import { 
  collection, 
  doc, 
  getDoc,
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot,
  query,
  where,
  orderBy,
  increment,
  serverTimestamp
} from 'firebase/firestore';
import { signInWithPopup, signOut, GoogleAuthProvider } from 'firebase/auth';
import { db, auth, googleProvider, setCachedAccessToken, getCachedAccessToken, getValidAccessToken } from '../lib/firebase';
import { Album, Photo, GmailUser, ShareLink, ActivityItem } from '../types';
import { INITIAL_ALBUMS, INITIAL_PHOTOS } from '../data/mockData';
import { getPhotoUrl } from './googleDriveService';
import { generatePinSalt, hashPin } from './pinSecurity';

const ALBUMS_COLLECTION = 'albums';
const PHOTOS_COLLECTION = 'photos';
const USERS_COLLECTION = 'users';
const SHARE_LINKS_COLLECTION = 'shareLinks';
const ACTIVITY_LOGS_COLLECTION = 'activityLogs';

// Operation Types for Firestore Error handling
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous
    },
    operationType,
    path
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Seed initial albums and photos to Firestore if the collections are empty
 */
export async function seedInitialDataIfEmpty(): Promise<void> {
  try {
    const albumsSnap = await getDocs(collection(db, ALBUMS_COLLECTION));
    if (albumsSnap.empty) {
      console.log('Seeding initial albums into Firestore...');
      for (const album of INITIAL_ALBUMS) {
        await setDoc(doc(db, ALBUMS_COLLECTION, album.id), {
          ...album,
          driveFolderId: album.driveFolderId || `drive-folder-${album.id}`,
          createdAt: new Date().toISOString()
        });
      }
    }

    const photosSnap = await getDocs(collection(db, PHOTOS_COLLECTION));
    if (photosSnap.empty) {
      console.log('Seeding initial photos into Firestore...');
      for (const photo of INITIAL_PHOTOS) {
        await setDoc(doc(db, PHOTOS_COLLECTION, photo.id), {
          ...photo,
          fileName: photo.filename,
          mimeType: 'image/jpeg',
          driveFileId: photo.driveFileId || `drive-${photo.id}`,
          driveWebViewLink: photo.url,
          uploadedBy: 'ครูกานดา (โสตทัศนศึกษา)',
          sortOrder: 1,
          isCover: photo.id === 'p-smt-01',
          createdAt: new Date().toISOString()
        });
      }
    }
  } catch (error) {
    console.warn('Error during Firestore initial check/seed:', error);
  }
}

/**
 * Real-time listener for albums
 */
export function subscribeAlbums(
  onUpdate: (albums: Album[]) => void,
  onError?: (error: Error) => void
): () => void {
  try {
    const albumsRef = collection(db, ALBUMS_COLLECTION);
    return onSnapshot(albumsRef, (snapshot) => {
      if (snapshot.empty) {
        onUpdate(INITIAL_ALBUMS);
        seedInitialDataIfEmpty();
        return;
      }
      const loaded: Album[] = [];
      snapshot.forEach((d) => {
        const data = d.data() as Album;
        loaded.push({
          ...data,
          id: d.id
        });
      });
      // Sort newest first
      loaded.sort((a, b) => (b.createdAt || b.date || '').localeCompare(a.createdAt || a.date || ''));
      onUpdate(loaded);
    }, (err) => {
      console.warn('Firestore albums listener error:', err);
      if (onError) onError(err);
      onUpdate(INITIAL_ALBUMS);
    });
  } catch (err: any) {
    handleFirestoreError(err, OperationType.LIST, ALBUMS_COLLECTION);
    return () => {};
  }
}

/**
 * Real-time listener for photos
 */
export function subscribePhotos(
  onUpdate: (photos: Photo[]) => void,
  onError?: (error: Error) => void
): () => void {
  try {
    const photosRef = collection(db, PHOTOS_COLLECTION);
    return onSnapshot(photosRef, (snapshot) => {
      if (snapshot.empty) {
        onUpdate(INITIAL_PHOTOS);
        return;
      }
      const loaded: Photo[] = [];
      snapshot.forEach((d) => {
        const data = d.data() as any;
        const driveFileId = data.driveFileId;
        // Resolve URLs: if driveFileId exists and url is not set or is drive format, resolve via Google CDN
        const resolvedUrl = data.url || (driveFileId ? getPhotoUrl(driveFileId, false) : '');
        const resolvedThumb = data.thumbnailUrl || (driveFileId ? getPhotoUrl(driveFileId, true, 800) : resolvedUrl);

        loaded.push({
          ...data,
          id: d.id,
          filename: data.fileName || data.filename || 'photo.jpg',
          fileName: data.fileName || data.filename || 'photo.jpg',
          url: resolvedUrl,
          thumbnailUrl: resolvedThumb
        });
      });
      // Sort order
      loaded.sort((a, b) => (b.createdAt || b.uploadedAt || '').localeCompare(a.createdAt || a.uploadedAt || ''));
      onUpdate(loaded);
    }, (err) => {
      console.warn('Firestore photos listener error:', err);
      if (onError) onError(err);
      onUpdate(INITIAL_PHOTOS);
    });
  } catch (err: any) {
    handleFirestoreError(err, OperationType.LIST, PHOTOS_COLLECTION);
    return () => {};
  }
}

/**
 * Save new or updated album to Firestore
 * Automatically ensures PINs are salted & SHA-256 hashed. NEVER stores plaintext PINs.
 */
export async function saveAlbumToFirestore(album: Album): Promise<void> {
  try {
    const albumRef = doc(db, ALBUMS_COLLECTION, album.id);
    const albumData: any = { ...album };

    if (albumData.accessLevel === 'password' && !albumData.pinHash) {
      const salt = albumData.pinSalt || generatePinSalt();
      albumData.pinSalt = salt;
      albumData.pinHash = await hashPin(albumData.accessCode || '123456', salt);
    }
    // Remove plaintext accessCode before saving
    delete albumData.accessCode;

    await setDoc(albumRef, {
      ...albumData,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    // Also log activity
    await logActivity({
      id: 'act-' + Date.now(),
      type: 'upload',
      title: `สร้าง/อัปเดตอัลบั้ม ${album.title}`,
      albumTitle: album.title,
      timeAgo: 'เมื่อสักครู่',
      user: album.organizer || 'เจ้าหน้าที่โสตฯ',
      albumId: album.id,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${ALBUMS_COLLECTION}/${album.id}`);
  }
}

/**
 * Delete album from Firestore and its photos
 */
export async function deleteAlbumFromFirestore(albumId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, ALBUMS_COLLECTION, albumId));
    
    // Also delete photos belonging to this album
    const q = query(collection(db, PHOTOS_COLLECTION), where('albumId', '==', albumId));
    const snap = await getDocs(q);
    for (const d of snap.docs) {
      await deleteDoc(d.ref);
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${ALBUMS_COLLECTION}/${albumId}`);
  }
}

/**
 * Save photo record to Firestore (stores metadata and Drive File ID, NO raw files or base64)
 */
export async function savePhotoToFirestore(photo: Partial<Photo> & { id: string; albumId: string; driveFileId: string }): Promise<void> {
  try {
    const photoRef = doc(db, PHOTOS_COLLECTION, photo.id);
    
    const photoData = {
      id: photo.id,
      albumId: photo.albumId,
      driveFileId: photo.driveFileId,
      fileName: photo.fileName || photo.filename || 'photo.jpg',
      filename: photo.fileName || photo.filename || 'photo.jpg',
      mimeType: photo.mimeType || 'image/jpeg',
      fileSize: photo.fileSize || '2.0 MB',
      driveWebViewLink: photo.driveWebViewLink || `https://drive.google.com/file/d/${photo.driveFileId}/view`,
      webContentLink: photo.webContentLink || '',
      uploadedBy: photo.uploadedBy || 'ผู้ดูแลระบบโสตฯ',
      createdAt: photo.createdAt || new Date().toISOString(),
      uploadedAt: photo.uploadedAt || 'วันนี้ ' + new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.',
      sortOrder: photo.sortOrder || 1,
      isCover: !!photo.isCover,
      title: photo.title || photo.fileName || photo.filename || 'รูปกิจกรรม',
      dimensions: photo.dimensions || '3840 x 2160',
      categoryTag: photo.categoryTag || 'งานกิจกรรม',
      photographer: photo.photographer || 'ฝ่ายโสตทัศนูปกรณ์',
      views: photo.views || 0,
      downloads: photo.downloads || 0,
      url: photo.url || getPhotoUrl(photo.driveFileId, false),
      thumbnailUrl: photo.thumbnailUrl || getPhotoUrl(photo.driveFileId, true, 800)
    };

    await setDoc(photoRef, photoData, { merge: true });

    // Increment album photo count
    try {
      const albumRef = doc(db, ALBUMS_COLLECTION, photo.albumId);
      await updateDoc(albumRef, {
        photoCount: increment(1),
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      console.warn('Could not increment album count:', e);
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${PHOTOS_COLLECTION}/${photo.id}`);
  }
}

/**
 * Delete photo from Firestore
 */
export async function deletePhotoFromFirestore(photoId: string, albumId?: string): Promise<void> {
  try {
    await deleteDoc(doc(db, PHOTOS_COLLECTION, photoId));
    if (albumId) {
      try {
        const albumRef = doc(db, ALBUMS_COLLECTION, albumId);
        await updateDoc(albumRef, {
          photoCount: increment(-1),
          updatedAt: new Date().toISOString()
        });
      } catch (e) {
        // ignore
      }
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${PHOTOS_COLLECTION}/${photoId}`);
  }
}

/**
 * Set cover photo for an album in Firestore
 */
export async function setAlbumCoverPhoto(albumId: string, photoId: string, coverUrl: string, driveFileId?: string): Promise<void> {
  try {
    const albumRef = doc(db, ALBUMS_COLLECTION, albumId);
    await updateDoc(albumRef, {
      coverUrl,
      coverDriveFileId: driveFileId || '',
      updatedAt: new Date().toISOString()
    });

    // Update isCover flag in photos collection
    const photoRef = doc(db, PHOTOS_COLLECTION, photoId);
    await updateDoc(photoRef, {
      isCover: true
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `${ALBUMS_COLLECTION}/${albumId}`);
  }
}

/**
 * Generate cryptographically secure, non-guessable random share tokens
 */
export function generateSecureShareToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return 'rb_' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Public Share Link handling:
 * Create a secure public share token for an album with expiration and download settings
 */
export async function createShareLink(
  albumId: string, 
  createdByUser?: string,
  expirationDays: number = 0,
  allowDownload: boolean = true
): Promise<ShareLink> {
  try {
    const shareToken = generateSecureShareToken();
    const linkId = 'sl_' + Date.now();
    const expiresAt = expirationDays > 0 
      ? new Date(Date.now() + expirationDays * 86400000).toISOString() 
      : undefined;

    const shareLink: ShareLink = {
      id: linkId,
      shareToken,
      albumId,
      isPublic: true,
      accessCount: 0,
      createdAt: new Date().toISOString(),
      expiresAt,
      isRevoked: false,
      allowedDownload: allowDownload,
      createdByUser: createdByUser || 'staff'
    };

    await setDoc(doc(db, SHARE_LINKS_COLLECTION, linkId), shareLink);
    
    // Update album with shareUrl, isShared, and sync flags
    const albumRef = doc(db, ALBUMS_COLLECTION, albumId);
    await updateDoc(albumRef, {
      isShared: true,
      shareRevoked: false,
      shareToken: shareToken,
      shareUrl: `${window.location.origin}/#public-album/${shareToken}`,
      allowDownload: allowDownload,
      shareExpiresAt: expiresAt || null,
      updatedAt: new Date().toISOString()
    });

    return shareLink;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, SHARE_LINKS_COLLECTION);
    throw err;
  }
}

/**
 * Revoke public share link (immediate invalidation)
 */
export async function revokeShareLink(albumId: string, shareToken?: string): Promise<void> {
  try {
    const albumRef = doc(db, ALBUMS_COLLECTION, albumId);
    await updateDoc(albumRef, {
      isShared: false,
      shareRevoked: true,
      accessLevel: 'disabled',
      updatedAt: new Date().toISOString()
    });

    if (shareToken) {
      const q = query(collection(db, SHARE_LINKS_COLLECTION), where('shareToken', '==', shareToken));
      const snap = await getDocs(q);
      for (const d of snap.docs) {
        await updateDoc(d.ref, {
          isRevoked: true,
          revokedAt: new Date().toISOString()
        });
      }
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `${ALBUMS_COLLECTION}/${albumId}`);
  }
}

/**
 * Update album share & security permissions in Firestore
 */
export async function updateAlbumShareSettings(
  albumId: string,
  settings: {
    accessLevel?: 'public' | 'password' | 'private' | 'disabled';
    pin?: string;
    allowDownload?: boolean;
    expirationDays?: number;
  }
): Promise<void> {
  try {
    const albumRef = doc(db, ALBUMS_COLLECTION, albumId);
    const updates: Record<string, any> = {
      updatedAt: new Date().toISOString()
    };

    if (settings.accessLevel) {
      updates.accessLevel = settings.accessLevel;
    }
    if (settings.allowDownload !== undefined) {
      updates.allowDownload = settings.allowDownload;
    }

    if (settings.accessLevel === 'password' && settings.pin) {
      const salt = generatePinSalt();
      const hash = await hashPin(settings.pin, salt);
      updates.pinSalt = salt;
      updates.pinHash = hash;
      updates.accessCode = null; // Clear legacy plaintext
    }

    if (settings.expirationDays !== undefined) {
      updates.shareExpiresAt = settings.expirationDays > 0 
        ? new Date(Date.now() + settings.expirationDays * 86400000).toISOString() 
        : null;
    }

    await updateDoc(albumRef, updates);
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `${ALBUMS_COLLECTION}/${albumId}`);
    throw err;
  }
}

/**
 * Get public album and photos by share token (NO LOGIN REQUIRED)
 * Verifies token validity, expiration, revocation, and sanitizes out internal data.
 */
export async function getPublicAlbumByShareToken(shareToken: string): Promise<{ album: Album; photos: Photo[] } | null> {
  try {
    if (!shareToken) return null;

    // 1. First check shareLinks collection
    const q = query(collection(db, SHARE_LINKS_COLLECTION), where('shareToken', '==', shareToken));
    const snap = await getDocs(q);
    
    let albumId: string | null = null;
    let allowedDownload = true;

    if (!snap.empty) {
      const shareData = snap.docs[0].data() as ShareLink;
      
      // Revocation check
      if (shareData.isRevoked) {
        return null;
      }

      // Expiration check
      if (shareData.expiresAt && new Date() > new Date(shareData.expiresAt)) {
        return null;
      }

      albumId = shareData.albumId;
      allowedDownload = shareData.allowedDownload !== false;

      // Increment access count
      try {
        await updateDoc(snap.docs[0].ref, {
          accessCount: increment(1)
        });
      } catch (e) {
        // Non-blocking
      }
    } else {
      // Check if any album has this shareToken directly
      const qAlbum = query(collection(db, ALBUMS_COLLECTION), where('shareToken', '==', shareToken));
      const snapAlbum = await getDocs(qAlbum);
      if (!snapAlbum.empty) {
        const alb = snapAlbum.docs[0].data() as Album;
        if (alb.shareRevoked) return null;
        if (alb.shareExpiresAt && new Date() > new Date(alb.shareExpiresAt)) return null;
        albumId = snapAlbum.docs[0].id;
        allowedDownload = alb.allowDownload !== false;
      }
    }

    if (!albumId) {
      return null;
    }

    // 2. Fetch album
    const albumDoc = await getDoc(doc(db, ALBUMS_COLLECTION, albumId));
    if (!albumDoc.exists()) {
      return null;
    }
    const rawAlbum = albumDoc.data() as Album;

    // Check if album itself is revoked, disabled, or private
    if (rawAlbum.shareRevoked || !rawAlbum.isShared || rawAlbum.accessLevel === 'disabled') {
      return null;
    }

    // Sanitize Album: Expose ONLY public metadata. NO plaintext passwords, NO uploader email.
    const sanitizedAlbum: Album = {
      id: albumDoc.id,
      title: rawAlbum.title || 'อัลบั้มภาพกิจกรรม',
      academicYear: rawAlbum.academicYear || '',
      category: rawAlbum.category || 'กิจกรรมทั่วไป',
      date: rawAlbum.date || '',
      photoCount: rawAlbum.photoCount || 0,
      views: (rawAlbum.views || 0) + 1,
      downloads: rawAlbum.downloads || 0,
      fileSizeTotal: rawAlbum.fileSizeTotal || '',
      coverUrl: rawAlbum.coverUrl || '',
      coverDriveFileId: rawAlbum.coverDriveFileId,
      accessLevel: rawAlbum.accessLevel || 'public',
      pinSalt: rawAlbum.pinSalt,
      pinHash: rawAlbum.pinHash,
      allowDownload: rawAlbum.allowDownload !== undefined ? rawAlbum.allowDownload : allowedDownload,
      isShared: true,
      shareUrl: rawAlbum.shareUrl || '',
      shareToken: rawAlbum.shareToken,
      description: rawAlbum.description || '',
      location: rawAlbum.location || '',
      organizer: rawAlbum.organizer || '',
      photographer: rawAlbum.photographer || 'ฝ่ายโสตทัศนูปกรณ์',
      tags: rawAlbum.tags || []
    };

    // 3. Fetch album photos (sanitized metadata)
    const photoQ = query(collection(db, PHOTOS_COLLECTION), where('albumId', '==', albumId));
    const photoSnap = await getDocs(photoQ);
    const photos: Photo[] = [];
    photoSnap.forEach(d => {
      const p = d.data() as any;
      const driveFileId = p.driveFileId;
      // Derive dynamic high-speed Google CDN URLs using driveFileId
      const resolvedUrl = p.url || (driveFileId ? getPhotoUrl(driveFileId, false) : '');
      const resolvedThumb = p.thumbnailUrl || (driveFileId ? getPhotoUrl(driveFileId, true, 800) : resolvedUrl);

      photos.push({
        id: d.id,
        albumId: p.albumId,
        title: p.title || p.fileName || 'รูปกิจกรรม',
        filename: p.fileName || p.filename || 'photo.jpg',
        fileName: p.fileName || p.filename || 'photo.jpg',
        driveFileId: driveFileId,
        mimeType: p.mimeType || 'image/jpeg',
        fileSize: p.fileSize || '2.0 MB',
        driveWebViewLink: p.driveWebViewLink || '',
        webContentLink: p.webContentLink || '',
        sortOrder: p.sortOrder || 1,
        isCover: !!p.isCover,
        url: resolvedUrl,
        thumbnailUrl: resolvedThumb,
        dimensions: p.dimensions || '3840 x 2160',
        is4K: !!p.is4K,
        categoryTag: p.categoryTag || sanitizedAlbum.category,
        views: p.views || 0,
        downloads: p.downloads || 0,
        uploadedAt: p.uploadedAt || '',
        photographer: p.photographer || sanitizedAlbum.photographer,
        cameraInfo: p.cameraInfo
      });
    });

    // Sort newest / sortOrder
    photos.sort((a, b) => (b.uploadedAt || '').localeCompare(a.uploadedAt || ''));

    return { album: sanitizedAlbum, photos };
  } catch (err) {
    console.warn('getPublicAlbumByShareToken error:', err);
    return null;
  }
}

/**
 * Log activity for audit trail
 */
export async function logActivity(activity: ActivityItem): Promise<void> {
  try {
    await setDoc(doc(db, ACTIVITY_LOGS_COLLECTION, activity.id), {
      ...activity,
      createdAt: new Date().toISOString()
    });
  } catch (err) {
    console.warn('Failed to log activity:', err);
  }
}

/**
 * Save user profile in Firestore
 */
export async function saveUserToFirestore(user: GmailUser): Promise<void> {
  try {
    const userRef = doc(db, USERS_COLLECTION, user.email.replace(/[.@]/g, '_'));
    await setDoc(userRef, {
      ...user,
      lastLogin: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.warn('Failed to save user in Firestore:', err);
  }
}

/**
 * Firebase Google Sign-In with popup + Drive OAuth Access Token
 */
export async function loginWithFirebaseGoogle(): Promise<{ user: GmailUser; accessToken: string }> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const accessToken = credential?.accessToken;

    if (accessToken) {
      setCachedAccessToken(accessToken);
    } else {
      console.warn('No access token returned from GoogleAuthProvider credentials');
    }

    const fbUser = result.user;
    const isSchool = fbUser.email?.includes('rajinibon') || fbUser.email?.includes('school');

    const user: GmailUser = {
      uid: fbUser.uid,
      name: fbUser.displayName || 'ผู้ใช้งาน Google',
      email: fbUser.email || 'user@gmail.com',
      avatarUrl: fbUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
      role: isSchool ? 'เจ้าหน้าที่ฝ่ายโสตทัศนูปกรณ์ & สื่อ' : 'ผู้ใช้งาน Google Workspace',
      department: isSchool ? 'ฝ่ายโสตทัศนูปกรณ์และประชาสัมพันธ์' : 'ผู้ดูแลคลังภาพโสต',
      organization: isSchool ? 'โรงเรียนราชินีบน' : 'Google Account',
      isStaff: true,
      signedInAt: 'วันนี้ ' + new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.',
      hasDriveAccess: !!accessToken
    };

    await saveUserToFirestore(user);
    return { user, accessToken: accessToken || '' };
  } catch (error: any) {
    console.error('Google Popup sign-in error or cancelled:', error);
    throw error;
  }
}

/**
 * Sign out from Firebase Auth
 */
export async function logoutFirebase(): Promise<void> {
  try {
    await signOut(auth);
    setCachedAccessToken(null);
  } catch (e) {
    console.warn('Logout error:', e);
  }
}
