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
import { 
  signInWithPopup, 
  signOut, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User as FirebaseUser 
} from 'firebase/auth';
import { db, auth, googleProvider, setCachedAccessToken, getCachedAccessToken, getValidAccessToken, isTokenExpired } from '../lib/firebase';
import { Album, Photo, GmailUser, ShareLink, ActivityItem } from '../types';
import { INITIAL_ALBUMS, INITIAL_PHOTOS } from '../data/mockData';
import { getPhotoUrl, listFilesInAlbumFolder } from './googleDriveService';
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
 * Sync image files directly from Google Drive folder into Firestore metadata
 * - Query constraint: query only driveFolderId
 * - Duplicate prevention: uses driveFileId as unique external key
 * - Missing file detection: tracks photos deleted from Drive without auto-deleting Firestore records
 * - Automatically updates album's photoCount and triggers real-time gallery refresh
 */
export async function syncPhotosFromDriveFolder(
  album: Album,
  currentUser?: GmailUser | null
): Promise<{ addedCount: number; totalCount: number; existingCount: number; missingCount: number }> {
  if (!album.driveFolderId || album.driveFolderId.trim() === '') {
    throw new Error('ยังไม่มีโฟลเดอร์ Google Drive สำหรับอัลบั้มนี้');
  }

  // 1. Fetch current photos for this album from Firestore
  let existingPhotos: Photo[] = [];
  try {
    const q = query(collection(db, PHOTOS_COLLECTION), where('albumId', '==', album.id));
    const snap = await getDocs(q);
    existingPhotos = snap.docs.map(d => d.data() as Photo);
  } catch (err) {
    console.warn('Could not read existing photos from Firestore:', err);
  }

  const existingDriveFileIds = new Set(existingPhotos.map(p => p.driveFileId));

  // 2. Fetch image files from Google Drive album folder
  const driveFiles = await listFilesInAlbumFolder(album.driveFolderId);

  // 3. Duplicate prevention: filter out files that already exist in Firestore
  const newFiles = driveFiles.filter(f => !existingDriveFileIds.has(f.id));

  let addedCount = 0;
  for (let i = 0; i < newFiles.length; i++) {
    const file = newFiles[i];
    const photoId = `photo-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`;
    const newPhoto: Photo = {
      id: photoId,
      albumId: album.id,
      driveFileId: file.id,
      fileName: file.name,
      filename: file.name,
      mimeType: file.mimeType || 'image/jpeg',
      fileSize: file.fileSize || '2.4 MB',
      driveWebViewLink: file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`,
      webContentLink: file.webContentLink,
      thumbnailUrl: file.thumbnailLink || getPhotoUrl(file.id, true, 800),
      url: getPhotoUrl(file.id, false),
      uploadedBy: currentUser?.name || 'ครูกานดา (โสตทัศนศึกษา)',
      sortOrder: existingPhotos.length + addedCount + 1,
      isCover: existingPhotos.length === 0 && addedCount === 0,
      title: file.name.replace(/\.[^/.]+$/, ''),
      dimensions: file.dimensions || '3840 x 2160',
      categoryTag: album.category,
      views: 0,
      downloads: 0,
      uploadedAt: new Date().toISOString(),
      photographer: album.photographer || 'ฝ่ายโสตทัศนูปกรณ์'
    };

    try {
      const photoRef = doc(db, PHOTOS_COLLECTION, photoId);
      await setDoc(photoRef, newPhoto);
      addedCount++;
    } catch (err) {
      console.error(`Failed to save synced photo ${file.name} to Firestore:`, err);
    }
  }

  // 4. Update album photo count and last sync timestamp
  const newTotalCount = existingPhotos.length + addedCount;
  try {
    const albumRef = doc(db, ALBUMS_COLLECTION, album.id);
    await updateDoc(albumRef, {
      photoCount: newTotalCount,
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    console.warn('Failed to update album count in Firestore:', err);
  }

  // 5. Detect missing files from Drive without destructive deletion
  const driveFileIdsSet = new Set(driveFiles.map(f => f.id));
  const missingCount = existingPhotos.filter(
    p => p.driveFileId && !p.driveFileId.startsWith('drive-file-') && !driveFileIdsSet.has(p.driveFileId)
  ).length;

  if (addedCount > 0) {
    await logActivity({
      id: 'act-' + Date.now(),
      type: 'upload',
      title: `ซิงค์รูปภาพจาก Google Drive เพิ่ม ${addedCount} รูป (รวม ${newTotalCount} รูป)`,
      albumTitle: album.title,
      albumId: album.id,
      user: currentUser?.name || 'ฝ่ายโสตทัศนูปกรณ์',
      timeAgo: 'เมื่อสักครู่',
      timestamp: new Date().toISOString()
    });
  }

  return {
    addedCount,
    totalCount: newTotalCount,
    existingCount: existingPhotos.length,
    missingCount
  };
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
 * Syncs the Google user profile with Firestore users/{uid} document:
 * - Uses users/{uid} as document ID (never email)
 * - Fields: uid, displayName, email, photoURL, role, createdAt, updatedAt, lastLoginAt, isActive
 * - Preserves existing role if already set (admin / staff)
 * - Updates photoURL whenever Google sends a new one
 * - Fallbacks displayName to email prefix if absent
 */
export async function syncUserProfileDocument(fbUser: FirebaseUser): Promise<GmailUser> {
  const uid = fbUser.uid;
  const userRef = doc(db, USERS_COLLECTION, uid);

  let existingData: any = null;
  try {
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      existingData = snap.data();
    }
  } catch (err) {
    console.warn('Could not read existing user document from Firestore:', err);
  }

  const nowIso = new Date().toISOString();
  const email = fbUser.email || 'user@gmail.com';
  const emailPrefix = email.split('@')[0];
  const displayName = fbUser.displayName?.trim() || emailPrefix;
  const photoURL = fbUser.photoURL || null;

  const isSchool = email.includes('rajinibon') || email.includes('school');

  // Preserve existing role, otherwise assign based on configuration
  const role = existingData?.role || (email.includes('rajinibontv') || email.includes('admin') ? 'admin' : (isSchool ? 'staff' : 'staff'));
  const department = existingData?.department || (isSchool ? 'ฝ่ายโสตทัศนูปกรณ์และประชาสัมพันธ์' : 'ผู้ดูแลคลังภาพโสต');
  const organization = existingData?.organization || (isSchool ? 'โรงเรียนราชินีบน' : 'Google Workspace');

  const userDataToSave = {
    uid,
    displayName,
    email,
    photoURL,
    role,
    department,
    organization,
    isActive: true,
    updatedAt: nowIso,
    lastLoginAt: nowIso,
    ...(existingData?.createdAt ? {} : { createdAt: nowIso })
  };

  try {
    await setDoc(userRef, userDataToSave, { merge: true });
  } catch (err) {
    console.warn('Could not write user profile to Firestore:', err);
  }

  const roleLabel = role === 'admin' 
    ? 'ผู้ดูแลระบบโสตทัศนูปกรณ์ & สื่อโทรทัศน์' 
    : 'เจ้าหน้าที่โสตทัศนูปกรณ์';

  const formattedUser: GmailUser = {
    uid,
    name: displayName,
    email,
    avatarUrl: photoURL || '',
    photoURL: photoURL || undefined,
    role: roleLabel,
    department,
    organization,
    isStaff: true,
    signedInAt: 'วันนี้ ' + new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.',
    hasDriveAccess: !isTokenExpired()
  };

  return formattedUser;
}

/**
 * Save or update user profile in Firestore at users/{uid}
 */
export async function saveUserToFirestore(user: GmailUser): Promise<void> {
  try {
    const docId = user.uid || (auth.currentUser ? auth.currentUser.uid : user.email.replace(/[.@]/g, '_'));
    const userRef = doc(db, USERS_COLLECTION, docId);
    await setDoc(userRef, {
      uid: docId,
      displayName: user.name,
      email: user.email,
      photoURL: user.avatarUrl || user.photoURL || null,
      role: user.role.includes('admin') || user.role.includes('ผู้ดูแล') ? 'admin' : 'staff',
      department: user.department,
      organization: user.organization,
      isActive: true,
      lastLoginAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.warn('Failed to save user in Firestore:', err);
  }
}

/**
 * Firebase Google Sign-In with popup + in-memory Drive OAuth Access Token
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

    const user = await syncUserProfileDocument(result.user);
    user.hasDriveAccess = !!accessToken;
    return { user, accessToken: accessToken || '' };
  } catch (error: any) {
    console.error('Google Popup sign-in error or cancelled:', error);
    throw error;
  }
}

/**
 * Real-time Firebase Auth state subscription (Single listener pattern)
 * Automatically syncs profile on browser refresh without flashing mock state
 */
export function subscribeAuthState(
  onUserChanged: (user: GmailUser | null) => void,
  onLoadingChanged?: (loading: boolean) => void
): () => void {
  onLoadingChanged?.(true);
  const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
    if (fbUser) {
      try {
        const synced = await syncUserProfileDocument(fbUser);
        onUserChanged(synced);
      } catch (err) {
        console.warn('Error reading user profile on state change:', err);
        const email = fbUser.email || 'user@gmail.com';
        const name = fbUser.displayName || email.split('@')[0];
        onUserChanged({
          uid: fbUser.uid,
          name,
          email,
          avatarUrl: fbUser.photoURL || '',
          photoURL: fbUser.photoURL || undefined,
          role: 'เจ้าหน้าที่โสตทัศนูปกรณ์',
          department: 'ฝ่ายโสตทัศนูปกรณ์และประชาสัมพันธ์',
          organization: 'โรงเรียนราชินีบน',
          isStaff: true,
          signedInAt: 'วันนี้ ' + new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.',
          hasDriveAccess: !isTokenExpired()
        });
      }
    } else {
      onUserChanged(null);
    }
    onLoadingChanged?.(false);
  });

  return unsubscribe;
}

/**
 * Sign out from Firebase Auth, clearing in-memory OAuth tokens
 */
export async function logoutFirebase(): Promise<void> {
  try {
    await signOut(auth);
    setCachedAccessToken(null);
  } catch (e) {
    console.warn('Logout error:', e);
  }
}

