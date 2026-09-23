import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  increment 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { Album, Photo, ShareLink, ActivityItem } from '../types';
import { getPhotoUrl } from './googleDriveService';

// Firestore collection names
export const COLLECTIONS = {
  USERS: 'users',
  ALBUMS: 'albums',
  PHOTOS: 'photos',
  SHARE_LINKS: 'shareLinks',
  ACTIVITY_LOGS: 'activityLogs',
} as const;

/**
 * 1. Fetch all albums from Firestore
 */
export async function getAlbumsFromFirestore(): Promise<Album[]> {
  const path = COLLECTIONS.ALBUMS;
  try {
    const q = query(collection(db, path), orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    const albums: Album[] = [];
    snapshot.forEach(docSnap => {
      albums.push({ id: docSnap.id, ...(docSnap.data() as any) } as Album);
    });
    return albums;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

/**
 * 2. Real-time subscription to albums collection
 */
export function subscribeAlbums(onData: (albums: Album[]) => void, onError?: (err: any) => void) {
  const path = COLLECTIONS.ALBUMS;
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const albums: Album[] = [];
      snapshot.forEach(docSnap => {
        albums.push({ id: docSnap.id, ...(docSnap.data() as any) } as Album);
      });
      // Sort by createdAt / date descending
      albums.sort((a, b) => (b.createdAt || b.date || '').localeCompare(a.createdAt || a.date || ''));
      onData(albums);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

/**
 * 3. Create a new album in Firestore with driveFolderId
 */
export async function createAlbumInFirestore(albumData: Partial<Album>): Promise<Album> {
  const path = COLLECTIONS.ALBUMS;
  try {
    const albumId = albumData.id || `album_${Date.now()}`;
    const newAlbum: Album = {
      id: albumId,
      title: albumData.title || 'อัลบั้มใหม่',
      academicYear: albumData.academicYear || '2569',
      category: albumData.category || 'กิจกรรมโรงเรียน',
      date: albumData.date || new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }),
      photoCount: 0,
      views: 0,
      downloads: 0,
      fileSizeTotal: '0 MB',
      coverUrl: albumData.coverUrl || '',
      accessLevel: albumData.accessLevel || 'public',
      accessCode: albumData.accessCode || '',
      isShared: albumData.isShared || false,
      shareUrl: albumData.shareUrl || `https://album.school.ac.th/a/${albumId}`,
      description: albumData.description || '',
      location: albumData.location || 'โรงเรียนราชินีบน',
      organizer: albumData.organizer || 'ฝ่ายโสตทัศนูปกรณ์และประชาสัมพันธ์',
      photographer: albumData.photographer || 'ฝ่ายโสตทัศนูปกรณ์',
      tags: albumData.tags || [],
      driveFolderId: albumData.driveFolderId || '',
      createdBy: albumData.createdBy || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await setDoc(doc(db, path, albumId), newAlbum);
    return newAlbum;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

/**
 * 4. Update an existing album in Firestore
 */
export async function updateAlbumInFirestore(albumId: string, updates: Partial<Album>): Promise<void> {
  const path = `${COLLECTIONS.ALBUMS}/${albumId}`;
  try {
    await updateDoc(doc(db, COLLECTIONS.ALBUMS, albumId), {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * 5. Fetch photos for a specific album from Firestore
 */
export async function getPhotosForAlbumFromFirestore(albumId: string): Promise<Photo[]> {
  const path = COLLECTIONS.PHOTOS;
  try {
    const q = query(collection(db, path), where('albumId', '==', albumId));
    const snapshot = await getDocs(q);
    const photos: Photo[] = [];
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      // Derive active preview URLs if stored via driveFileId
      const driveFileId = data.driveFileId;
      const url = driveFileId ? getPhotoUrl(driveFileId, 'medium') : (data.url || '');
      const thumbnailUrl = driveFileId ? getPhotoUrl(driveFileId, 'thumbnail') : (data.thumbnailUrl || data.url || '');

      photos.push({
        id: docSnap.id,
        albumId: data.albumId,
        title: data.title || data.fileName || 'ภาพกิจกรรม',
        filename: data.fileName || data.filename || 'photo.jpg',
        fileName: data.fileName || data.filename || 'photo.jpg',
        url,
        thumbnailUrl,
        fileSize: data.fileSize || '3.5 MB',
        dimensions: data.dimensions || '4000 × 2666',
        is4K: data.is4K ?? true,
        categoryTag: data.categoryTag || 'ภาพกิจกรรม',
        views: data.views || 0,
        downloads: data.downloads || 0,
        uploadedAt: data.uploadedAt || data.createdAt || 'วันนี้',
        photographer: data.photographer || data.uploadedBy || 'ทีมงานโสตฯ',
        isFavorite: data.isFavorite || false,
        driveFileId: data.driveFileId,
        mimeType: data.mimeType,
        driveWebViewLink: data.driveWebViewLink,
        uploadedBy: data.uploadedBy,
        createdAt: data.createdAt,
        sortOrder: data.sortOrder || 0,
        isCover: data.isCover || false
      });
    });

    photos.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    return photos;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

/**
 * 6. Subscribe to real-time photos for an album
 */
export function subscribePhotosForAlbum(
  albumId: string, 
  onData: (photos: Photo[]) => void, 
  onError?: (err: any) => void
) {
  const path = COLLECTIONS.PHOTOS;
  const q = query(collection(db, path), where('albumId', '==', albumId));
  return onSnapshot(
    q,
    (snapshot) => {
      const photos: Photo[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        const driveFileId = data.driveFileId;
        const url = driveFileId ? getPhotoUrl(driveFileId, 'medium') : (data.url || '');
        const thumbnailUrl = driveFileId ? getPhotoUrl(driveFileId, 'thumbnail') : (data.thumbnailUrl || data.url || '');

        photos.push({
          id: docSnap.id,
          albumId: data.albumId,
          title: data.title || data.fileName || 'ภาพกิจกรรม',
          filename: data.fileName || data.filename || 'photo.jpg',
          fileName: data.fileName || data.filename || 'photo.jpg',
          url,
          thumbnailUrl,
          fileSize: data.fileSize || '3.5 MB',
          dimensions: data.dimensions || '4000 × 2666',
          is4K: data.is4K ?? true,
          categoryTag: data.categoryTag || 'ภาพกิจกรรม',
          views: data.views || 0,
          downloads: data.downloads || 0,
          uploadedAt: data.uploadedAt || data.createdAt || 'วันนี้',
          photographer: data.photographer || data.uploadedBy || 'ทีมงานโสตฯ',
          isFavorite: data.isFavorite || false,
          driveFileId: data.driveFileId,
          mimeType: data.mimeType,
          driveWebViewLink: data.driveWebViewLink,
          uploadedBy: data.uploadedBy,
          createdAt: data.createdAt,
          sortOrder: data.sortOrder || 0,
          isCover: data.isCover || false
        });
      });

      photos.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
      onData(photos);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

/**
 * 7. Save photo record in Firestore (referencing Google Drive file ID)
 * Never stores raw binary or base64 in Firestore!
 */
export async function savePhotoToFirestore(photoData: {
  albumId: string;
  driveFileId: string;
  fileName: string;
  mimeType: string;
  fileSize: string;
  driveWebViewLink?: string;
  uploadedBy?: string;
  sortOrder?: number;
  isCover?: boolean;
  title?: string;
  dimensions?: string;
  is4K?: boolean;
}): Promise<Photo> {
  const path = COLLECTIONS.PHOTOS;
  try {
    const photoId = `photo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();

    const record = {
      id: photoId,
      albumId: photoData.albumId,
      driveFileId: photoData.driveFileId,
      fileName: photoData.fileName,
      mimeType: photoData.mimeType,
      fileSize: photoData.fileSize,
      driveWebViewLink: photoData.driveWebViewLink || '',
      uploadedBy: photoData.uploadedBy || 'เจ้าหน้าที่โสตฯ',
      createdAt: nowIso,
      sortOrder: photoData.sortOrder ?? Date.now(),
      isCover: photoData.isCover ?? false,
      title: photoData.title || photoData.fileName,
      dimensions: photoData.dimensions || '4000 × 2666',
      is4K: photoData.is4K ?? true,
      categoryTag: 'ภาพกิจกรรม',
      views: 0,
      downloads: 0
    };

    await setDoc(doc(db, path, photoId), record);

    // Increment photoCount in the parent album document
    try {
      const albumRef = doc(db, COLLECTIONS.ALBUMS, photoData.albumId);
      await updateDoc(albumRef, {
        photoCount: increment(1),
        updatedAt: nowIso
      });
    } catch (e) {
      console.warn('Could not increment album photoCount:', e);
    }

    const driveUrl = getPhotoUrl(photoData.driveFileId, 'medium');
    const thumbUrl = getPhotoUrl(photoData.driveFileId, 'thumbnail');

    return {
      id: photoId,
      albumId: photoData.albumId,
      title: record.title,
      filename: record.fileName,
      fileName: record.fileName,
      url: driveUrl,
      thumbnailUrl: thumbUrl,
      fileSize: record.fileSize,
      dimensions: record.dimensions,
      is4K: record.is4K,
      categoryTag: record.categoryTag,
      views: 0,
      downloads: 0,
      uploadedAt: 'วันนี้',
      photographer: record.uploadedBy,
      driveFileId: record.driveFileId,
      mimeType: record.mimeType,
      driveWebViewLink: record.driveWebViewLink,
      uploadedBy: record.uploadedBy,
      createdAt: record.createdAt,
      sortOrder: record.sortOrder,
      isCover: record.isCover
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

/**
 * 8. Set album cover photo
 */
export async function setAlbumCoverInFirestore(albumId: string, photo: Photo): Promise<void> {
  const path = `${COLLECTIONS.ALBUMS}/${albumId}`;
  try {
    const coverUrl = photo.driveFileId ? getPhotoUrl(photo.driveFileId, 'medium') : photo.url;
    await updateDoc(doc(db, COLLECTIONS.ALBUMS, albumId), {
      coverUrl,
      updatedAt: new Date().toISOString()
    });

    // Also mark photo as isCover = true in photos collection
    try {
      await updateDoc(doc(db, COLLECTIONS.PHOTOS, photo.id), {
        isCover: true
      });
    } catch (e) {
      // Non-critical
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * 9. Delete photo from Firestore
 */
export async function deletePhotoFromFirestore(photoId: string, albumId: string): Promise<void> {
  const path = `${COLLECTIONS.PHOTOS}/${photoId}`;
  try {
    await deleteDoc(doc(db, COLLECTIONS.PHOTOS, photoId));
    // Decrement photo count in parent album
    try {
      await updateDoc(doc(db, COLLECTIONS.ALBUMS, albumId), {
        photoCount: increment(-1),
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      // Ignore
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * 10. Create and manage ShareLink for public album access
 */
export async function createShareLinkInFirestore(albumId: string, isPublic = true, accessLevel = 'public'): Promise<ShareLink> {
  const path = COLLECTIONS.SHARE_LINKS;
  try {
    const token = `share_${Math.random().toString(36).substring(2, 10)}`;
    const shareLinkId = `link_${Date.now()}`;
    const newLink: ShareLink = {
      id: shareLinkId,
      albumId,
      token,
      isPublic,
      accessLevel: accessLevel as any,
      expiresAt: '', // None or specify date
      views: 0,
      downloads: 0,
      createdAt: new Date().toISOString()
    };

    await setDoc(doc(db, path, shareLinkId), newLink);

    // Update album status as isShared = true
    await updateDoc(doc(db, COLLECTIONS.ALBUMS, albumId), {
      isShared: true,
      shareUrl: `https://album.school.ac.th/a/${token}`
    });

    return newLink;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

/**
 * 11. Verify ShareLink for Public Viewers without login
 */
export async function verifyPublicShareLink(token: string): Promise<{ album: Album; photos: Photo[] } | null> {
  const path = COLLECTIONS.SHARE_LINKS;
  try {
    const q = query(collection(db, path), where('token', '==', token));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;

    const shareLink = snapshot.docs[0].data() as ShareLink;

    // Check expiration if any
    if (shareLink.expiresAt && new Date(shareLink.expiresAt).getTime() < Date.now()) {
      return null;
    }

    // Get Album
    const albumDoc = await getDoc(doc(db, COLLECTIONS.ALBUMS, shareLink.albumId));
    if (!albumDoc.exists()) return null;

    const album = { id: albumDoc.id, ...albumDoc.data() } as Album;
    if (album.accessLevel === 'disabled') return null;

    // Load Photos
    const photos = await getPhotosForAlbumFromFirestore(album.id);

    // Record view in share link
    try {
      await updateDoc(doc(db, COLLECTIONS.SHARE_LINKS, snapshot.docs[0].id), {
        views: increment(1)
      });
      await updateDoc(doc(db, COLLECTIONS.ALBUMS, album.id), {
        views: increment(1)
      });
    } catch (e) {
      // Non-blocking
    }

    return { album, photos };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

/**
 * 12. Add activity log
 */
export async function logActivity(item: Omit<ActivityItem, 'id'>): Promise<void> {
  const path = COLLECTIONS.ACTIVITY_LOGS;
  try {
    const logId = `log_${Date.now()}`;
    await setDoc(doc(db, path, logId), {
      id: logId,
      ...item,
      createdAt: new Date().toISOString()
    });
  } catch (e) {
    console.warn('Activity log write error:', e);
  }
}

/**
 * 13. Initialize default database seed if Firestore albums collection is empty.
 * This preserves existing mock albums until real Google Drive albums are added,
 * ensuring zero disruption to the UI.
 */
export async function seedInitialFirestoreDataIfEmpty(initialAlbums: Album[], initialPhotos: Photo[]): Promise<void> {
  try {
    const snapshot = await getDocs(collection(db, COLLECTIONS.ALBUMS));
    if (!snapshot.empty) {
      return; // Already initialized
    }

    console.log('Seeding initial albums into Firestore...');
    for (const album of initialAlbums) {
      await setDoc(doc(db, COLLECTIONS.ALBUMS, album.id), {
        ...album,
        driveFolderId: `drive_folder_${album.id}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    console.log('Seeding initial photos into Firestore...');
    for (const photo of initialPhotos) {
      await setDoc(doc(db, COLLECTIONS.PHOTOS, photo.id), {
        id: photo.id,
        albumId: photo.albumId,
        driveFileId: `mock_drive_${photo.id}`,
        fileName: photo.filename,
        mimeType: 'image/jpeg',
        fileSize: photo.fileSize,
        driveWebViewLink: photo.url,
        uploadedBy: photo.photographer,
        createdAt: new Date().toISOString(),
        sortOrder: 1,
        isCover: photo.url === initialAlbums.find(a => a.id === photo.albumId)?.coverUrl,
        title: photo.title,
        dimensions: photo.dimensions,
        is4K: photo.is4K ?? true,
        categoryTag: photo.categoryTag || 'ภาพกิจกรรม',
        views: photo.views,
        downloads: photo.downloads,
        url: photo.url,
        thumbnailUrl: photo.thumbnailUrl
      });
    }
  } catch (e) {
    console.warn('Initial Firestore seed check skipped or handled:', e);
  }
}
