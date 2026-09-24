import { getCachedAccessToken, getValidAccessToken, requestAccessTokenViaGIS } from '../lib/firebase';

export type DriveErrorCode = 
  | 'GOOGLE_LOGIN_REQUIRED'
  | 'PERMISSION_DENIED'
  | 'ORGANIZATION_POLICY_BLOCKED'
  | 'UPLOAD_FAILED'
  | 'FILE_NOT_FOUND'
  | 'QUOTA_EXCEEDED'
  | 'NETWORK_ERROR';

export class DriveError extends Error {
  code: DriveErrorCode;
  originalError?: any;

  constructor(code: DriveErrorCode, message: string, originalError?: any) {
    super(message);
    this.name = 'DriveError';
    this.code = code;
    this.originalError = originalError;
  }
}

export interface DriveFolderFileItem {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  fileSize: string;
  createdTime?: string;
  modifiedTime?: string;
  webViewLink?: string;
  webContentLink?: string;
  thumbnailLink?: string;
  dimensions?: string;
}

/**
 * Helper to ensure access token is available
 */
export function requireAccessToken(): string {
  const token = getCachedAccessToken();
  if (!token) {
    throw new DriveError(
      'GOOGLE_LOGIN_REQUIRED',
      'กรุณาเข้าสู่ระบบด้วยบัญชี Google เพื่อเข้าถึง Google Drive'
    );
  }
  return token;
}

/**
 * Handle API error responses from Google Drive
 */
async function handleDriveApiError(response: Response): Promise<never> {
  let errorData: any = {};
  try {
    errorData = await response.json();
  } catch {
    // ignore parse error
  }

  const message = errorData?.error?.message || response.statusText;
  const status = response.status;
  const reasons = (errorData?.error?.errors || []).map((e: any) => e.reason).join(',');

  if (status === 401) {
    // Trigger GIS token renewal
    try {
      await requestAccessTokenViaGIS();
    } catch {
      // ignore renewal error
    }
    throw new DriveError(
      'GOOGLE_LOGIN_REQUIRED',
      'เซสชัน Google หมดอายุ กรุณาลงชื่อเข้าใช้ Google ใหม่อีกครั้ง: ' + message
    );
  } else if (status === 403) {
    if (
      message.toLowerCase().includes('cannot share outside') ||
      message.toLowerCase().includes('domain policy') ||
      reasons.includes('cannotShareOutsideDomain') ||
      reasons.includes('domainPolicy')
    ) {
      throw new DriveError(
        'ORGANIZATION_POLICY_BLOCKED',
        'การแชร์ไฟล์ภายนอกถูกนโยบายความปลอดภัยของ Google Workspace ประจำองค์กร/โรงเรียนบล็อก (External sharing blocked by Workspace Admin policy): ' + message
      );
    }
    if (message.toLowerCase().includes('quota') || message.toLowerCase().includes('rate')) {
      throw new DriveError(
        'QUOTA_EXCEEDED',
        'Google Drive โควต้าการใช้งานเต็ม หรือเกินขีดจำกัดชั่วคราว: ' + message
      );
    }
    throw new DriveError(
      'PERMISSION_DENIED',
      'ไม่มีสิทธิ์เข้าถึงหรือแก้ไขไฟล์ใน Google Drive: ' + message
    );
  } else if (status === 404) {
    throw new DriveError(
      'FILE_NOT_FOUND',
      'ไม่พบไฟล์หรือโฟลเดอร์ใน Google Drive: ' + message
    );
  }

  throw new DriveError(
    'UPLOAD_FAILED',
    `เกิดข้อผิดพลาดในการเชื่อมต่อ Google Drive (${status}): ${message}`
  );
}

/**
 * Create a new folder for an album in Google Drive
 */
export async function createAlbumFolder(
  folderName: string,
  parentFolderId?: string
): Promise<{ id: string; name: string; webViewLink?: string }> {
  const token = requireAccessToken();

  try {
    const metadata: Record<string, any> = {
      name: `[อัลบั้มโสต] ${folderName}`,
      mimeType: 'application/vnd.google-apps.folder',
      description: 'โฟลเดอร์สำหรับคลังภาพกิจกรรมโรงเรียนราชินีบน'
    };

    if (parentFolderId) {
      metadata.parents = [parentFolderId];
    }

    const res = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(metadata)
    });

    if (!res.ok) {
      await handleDriveApiError(res);
    }

    const data = await res.json();
    
    // Automatically set permission to anyone as reader so photos inside can be viewed by school community
    try {
      await updateFilePermission(data.id, 'reader', 'anyone');
    } catch (permErr) {
      console.warn('Could not auto-set folder public read permission:', permErr);
    }

    return {
      id: data.id,
      name: data.name,
      webViewLink: data.webViewLink
    };
  } catch (err: any) {
    if (err instanceof DriveError) throw err;
    throw new DriveError('NETWORK_ERROR', 'ไม่สามารถเชื่อมต่อ Google Drive Network: ' + err.message, err);
  }
}

/**
 * List image files inside a specific Google Drive folder
 * Query constraint: '${folderId}' in parents and trashed = false and mimeType contains 'image/'
 * Performance:
 * - Queries ONLY driveFolderId
 * - Queries ONLY image mime types
 * - Never downloads raw binary files; reads metadata only
 */
export async function listFilesInAlbumFolder(folderId: string): Promise<DriveFolderFileItem[]> {
  const token = requireAccessToken();

  if (!folderId || folderId.startsWith('drive-folder-')) {
    throw new DriveError('FILE_NOT_FOUND', 'ยังไม่มีโฟลเดอร์ Google Drive สำหรับอัลบั้มนี้');
  }

  try {
    const query = `'${folderId}' in parents and trashed = false and mimeType contains 'image/'`;
    const fields = 'files(id,name,mimeType,size,createdTime,modifiedTime,webViewLink,webContentLink,thumbnailLink,imageMediaMetadata)';
    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=${encodeURIComponent(fields)}&pageSize=1000&orderBy=createdTime desc`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!res.ok) {
      await handleDriveApiError(res);
    }

    const data = await res.json();
    const files = data.files || [];

    return files.map((file: any) => {
      let formattedSize = '2.4 MB';
      if (file.size) {
        const bytes = parseInt(file.size, 10);
        if (bytes > 1024 * 1024) {
          formattedSize = (bytes / (1024 * 1024)).toFixed(1) + ' MB';
        } else if (bytes > 1024) {
          formattedSize = (bytes / 1024).toFixed(0) + ' KB';
        }
      }

      let dimensions = '3840 x 2160';
      if (file.imageMediaMetadata?.width && file.imageMediaMetadata?.height) {
        dimensions = `${file.imageMediaMetadata.width} x ${file.imageMediaMetadata.height}`;
      }

      return {
        id: file.id,
        name: file.name,
        mimeType: file.mimeType || 'image/jpeg',
        size: file.size,
        fileSize: formattedSize,
        createdTime: file.createdTime,
        modifiedTime: file.modifiedTime,
        webViewLink: file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`,
        webContentLink: file.webContentLink,
        thumbnailLink: file.thumbnailLink,
        dimensions
      };
    });
  } catch (err: any) {
    if (err instanceof DriveError) throw err;
    throw new DriveError('NETWORK_ERROR', 'ไม่สามารถอ่านไฟล์ในโฟลเดอร์ Google Drive: ' + err.message, err);
  }
}


/**
 * Upload a single photo to Google Drive inside the album folder
 */
export async function uploadPhoto(
  file: File | Blob,
  fileName: string,
  albumFolderId: string,
  onProgress?: (percent: number) => void
): Promise<{
  driveFileId: string;
  fileName: string;
  mimeType: string;
  fileSize: string;
  driveWebViewLink: string;
  webContentLink?: string;
  thumbnailLink?: string;
  dimensions?: string;
}> {
  const token = requireAccessToken();

  return new Promise((resolve, reject) => {
    try {
      const boundary = '-------school_media_vault_' + Date.now();
      const delimiter = '\r\n--' + boundary + '\r\n';
      const closeDelim = '\r\n--' + boundary + '--';

      const mimeType = file.type || 'image/jpeg';
      const metadata = {
        name: fileName,
        mimeType: mimeType,
        parents: [albumFolderId],
        description: 'ภาพกิจกรรมโรงเรียนราชินีบน อัปโหลดผ่านระบบอัลบั้มโสต'
      };

      const reader = new FileReader();
      reader.onerror = () => {
        reject(new DriveError('UPLOAD_FAILED', 'ไม่สามารถอ่านไฟล์จากเครื่องได้'));
      };

      reader.onload = () => {
        const fileContent = reader.result as ArrayBuffer;

        const metadataPart = delimiter +
          'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
          JSON.stringify(metadata) +
          delimiter +
          `Content-Type: ${mimeType}\r\n\r\n`;

        // Combine metadata header, binary file data, and closing delimiter
        const enc = new TextEncoder();
        const headerBytes = enc.encode(metadataPart);
        const footerBytes = enc.encode(closeDelim);

        const totalLength = headerBytes.length + fileContent.byteLength + footerBytes.length;
        const combined = new Uint8Array(totalLength);
        combined.set(headerBytes, 0);
        combined.set(new Uint8Array(fileContent), headerBytes.length);
        combined.set(footerBytes, headerBytes.length + fileContent.byteLength);

        const xhr = new XMLHttpRequest();
        xhr.open(
          'POST',
          'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,size,webViewLink,webContentLink,thumbnailLink,imageMediaMetadata'
        );
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.setRequestHeader('Content-Type', `multipart/related; boundary=${boundary}`);

        if (xhr.upload && onProgress) {
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              const percent = Math.round((e.loaded / e.total) * 100);
              onProgress(percent);
            }
          };
        }

        xhr.onload = async () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const resData = JSON.parse(xhr.responseText);
              const driveFileId = resData.id;
              
              // Enable reader permission for this image (type: anyone, role: reader)
              try {
                await updateFilePermission(driveFileId, 'reader', 'anyone');
              } catch (permErr: any) {
                if (permErr?.code === 'ORGANIZATION_POLICY_BLOCKED') {
                  // Do NOT fake success; report that public sharing was blocked by organization policy
                  throw permErr;
                }
                console.warn('Could not auto-set permission on photo:', permErr);
              }

              // Format file size
              const bytes = parseInt(resData.size || `${file.size || 0}`, 10);
              let formattedSize = '1.5 MB';
              if (bytes > 1024 * 1024) {
                formattedSize = (bytes / (1024 * 1024)).toFixed(1) + ' MB';
              } else if (bytes > 1024) {
                formattedSize = (bytes / 1024).toFixed(0) + ' KB';
              }

              // Extract dimensions
              let dimensions = '3840 x 2160';
              if (resData.imageMediaMetadata?.width && resData.imageMediaMetadata?.height) {
                dimensions = `${resData.imageMediaMetadata.width} x ${resData.imageMediaMetadata.height}`;
              }

              resolve({
                driveFileId: driveFileId,
                fileName: resData.name || fileName,
                mimeType: resData.mimeType || mimeType,
                fileSize: formattedSize,
                driveWebViewLink: resData.webViewLink || `https://drive.google.com/file/d/${driveFileId}/view`,
                webContentLink: resData.webContentLink,
                thumbnailLink: resData.thumbnailLink,
                dimensions: dimensions
              });
            } catch (err: any) {
              reject(new DriveError('UPLOAD_FAILED', 'ประมวลผลข้อมูลจาก Google Drive ล้มเหลว: ' + err.message));
            }
          } else if (xhr.status === 401) {
            reject(new DriveError('GOOGLE_LOGIN_REQUIRED', 'กรุณาเข้าสู่ระบบ Google ใหม่อีกครั้ง'));
          } else if (xhr.status === 403) {
            reject(new DriveError('QUOTA_EXCEEDED', 'Google Drive โควต้าเต็มหรือไม่มีสิทธิ์'));
          } else {
            reject(new DriveError('UPLOAD_FAILED', `อัปโหลดไปยัง Google Drive ล้มเหลว (Status ${xhr.status})`));
          }
        };

        xhr.onerror = () => {
          reject(new DriveError('NETWORK_ERROR', 'เกิดข้อผิดพลาดเครือข่ายขณะอัปโหลดไปยัง Google Drive'));
        };

        xhr.send(combined);
      };

      reader.readAsArrayBuffer(file);
    } catch (err: any) {
      reject(new DriveError('UPLOAD_FAILED', err.message || 'เกิดข้อผิดพลาดในการอัปโหลด', err));
    }
  });
}

/**
 * Upload multiple photos with individual progress
 */
export async function uploadMultiplePhotos(
  files: File[],
  albumFolderId: string,
  onProgress?: (fileIndex: number, percent: number, fileName: string) => void
): Promise<Array<{
  driveFileId: string;
  fileName: string;
  mimeType: string;
  fileSize: string;
  driveWebViewLink: string;
  webContentLink?: string;
  thumbnailLink?: string;
  dimensions?: string;
}>> {
  const results = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const uploaded = await uploadPhoto(
      file,
      file.name,
      albumFolderId,
      (percent) => {
        if (onProgress) onProgress(i, percent, file.name);
      }
    );
    results.push(uploaded);
  }
  return results;
}

/**
 * Get file metadata from Google Drive
 */
export async function getFileMetadata(driveFileId: string): Promise<any> {
  const token = requireAccessToken();
  try {
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files/${driveFileId}?fields=id,name,mimeType,size,webViewLink,webContentLink,thumbnailLink,imageMediaMetadata,permissions`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    if (!res.ok) {
      await handleDriveApiError(res);
    }
    return await res.json();
  } catch (err: any) {
    if (err instanceof DriveError) throw err;
    throw new DriveError('NETWORK_ERROR', 'ไม่สามารถดึงข้อมูลไฟล์ได้: ' + err.message, err);
  }
}

/**
 * Image Delivery Architecture:
 * - driveFileId is the PRIMARY source of truth stored in Firestore.
 * - lh3.googleusercontent.com/d/{driveFileId} is an implementation detail (convenience preview endpoint)
 *   used when a file has anyone-with-link read permission. It is NOT an official permanent Drive API contract.
 * - If lh3.googleusercontent.com fails, the application uses getFallbackPhotoUrl() as fallback.
 */
export function getPhotoUrl(driveFileId: string, isThumbnail: boolean = false, size: number = 1600): string {
  if (!driveFileId) return '';
  if (isThumbnail) {
    return `https://lh3.googleusercontent.com/d/${driveFileId}=w${size}`;
  }
  return `https://lh3.googleusercontent.com/d/${driveFileId}`;
}

/**
 * Fallback architecture for public image delivery if the primary preview endpoint is unavailable
 */
export function getFallbackPhotoUrl(driveFileId: string, isThumbnail: boolean = false, size: number = 800): string {
  if (!driveFileId) return '';
  if (isThumbnail) {
    return `https://drive.google.com/thumbnail?id=${driveFileId}&sz=w${size}`;
  }
  return `https://drive.google.com/uc?id=${driveFileId}&export=view`;
}

/**
 * Get download URL for Google Drive file
 */
export function getDownloadUrl(driveFileId: string, webContentLink?: string): string {
  if (webContentLink) return webContentLink;
  return `https://drive.google.com/uc?export=download&id=${driveFileId}`;
}

/**
 * Update permission on a file or folder (e.g., make it public readable)
 * If Google Workspace policy disallows external sharing, raises ORGANIZATION_POLICY_BLOCKED
 */
export async function updateFilePermission(
  fileOrFolderId: string,
  role: 'reader' | 'commenter' | 'writer' = 'reader',
  type: 'anyone' | 'user' = 'anyone'
): Promise<any> {
  const token = requireAccessToken();
  try {
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileOrFolderId}/permissions`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          role: role,
          type: type
        })
      }
    );
    if (!res.ok) {
      let errBody: any = {};
      try { errBody = await res.json(); } catch {}
      const msg = errBody?.error?.message || res.statusText;
      const reasons = (errBody?.error?.errors || []).map((e: any) => e.reason).join(',');

      if (
        msg.toLowerCase().includes('cannot share outside') ||
        msg.toLowerCase().includes('domain policy') ||
        reasons.includes('cannotShareOutsideDomain') ||
        reasons.includes('domainPolicy')
      ) {
        throw new DriveError(
          'ORGANIZATION_POLICY_BLOCKED',
          'การแชร์ไฟล์สาธารณะถูกนโยบาย Google Workspace ประจำองค์กรบล็อก (External sharing disabled by school Workspace policy): ' + msg
        );
      }

      await handleDriveApiError(res);
    }
    return await res.json();
  } catch (err: any) {
    if (err instanceof DriveError) throw err;
    throw new DriveError('PERMISSION_DENIED', 'ไม่สามารถปรับปรุงสิทธิ์ Google Drive ได้: ' + err.message, err);
  }
}

/**
 * Delete a photo from Google Drive
 */
export async function deletePhoto(driveFileId: string): Promise<void> {
  const token = requireAccessToken();
  try {
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${driveFileId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    if (!res.ok && res.status !== 404) {
      await handleDriveApiError(res);
    }
  } catch (err: any) {
    if (err instanceof DriveError) throw err;
    throw new DriveError('NETWORK_ERROR', 'ไม่สามารถลบไฟล์จาก Google Drive: ' + err.message, err);
  }
}

/**
 * Delete an entire album folder from Google Drive
 */
export async function deleteAlbumFolder(driveFolderId: string): Promise<void> {
  const token = requireAccessToken();
  try {
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${driveFolderId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    if (!res.ok && res.status !== 404) {
      await handleDriveApiError(res);
    }
  } catch (err: any) {
    if (err instanceof DriveError) throw err;
    throw new DriveError('NETWORK_ERROR', 'ไม่สามารถลบโฟลเดอร์จาก Google Drive: ' + err.message, err);
  }
}
