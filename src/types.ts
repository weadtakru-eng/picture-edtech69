export type AppView = 
  | 'dashboard' 
  | 'albums' 
  | 'album-detail' 
  | 'bulk-upload' 
  | 'all-photos' 
  | 'share-qr' 
  | 'reports' 
  | 'settings' 
  | 'login-states';

export type AccessLevel = 'public' | 'password' | 'private' | 'disabled';

export interface Photo {
  id: string;
  albumId: string;
  title: string;
  filename: string;
  fileName?: string; // synced with user requirement
  driveFileId?: string;
  mimeType?: string;
  fileSize: string;
  driveWebViewLink?: string;
  webContentLink?: string;
  uploadedBy?: string;
  createdAt?: string;
  sortOrder?: number;
  isCover?: boolean;
  url: string;
  thumbnailUrl: string;
  dimensions: string;
  is4K?: boolean;
  categoryTag?: string;
  views: number;
  downloads: number;
  uploadedAt: string;
  photographer: string;
  cameraInfo?: {
    model: string;
    lens: string;
    iso: number;
    aperture: string;
    shutter: string;
  };
  isFavorite?: boolean;
}

export interface Album {
  id: string;
  title: string;
  academicYear: string;
  category: 'กิจกรรมโรงเรียน' | 'กิจกรรมนักเรียน' | 'กีฬา' | 'งานพิธีการ' | 'ห้องเรียนพิเศษ' | string;
  date: string;
  photoCount: number;
  views: number;
  downloads: number;
  fileSizeTotal: string;
  coverUrl: string;
  coverDriveFileId?: string;
  accessLevel: AccessLevel;
  accessCode?: string; // deprecated: migrated to pinHash + pinSalt
  pinSalt?: string;
  pinHash?: string;
  allowDownload?: boolean;
  isShared: boolean;
  shareUrl: string;
  shareToken?: string;
  shareRevoked?: boolean;
  shareExpiresAt?: string;
  description: string;
  location: string;
  organizer: string;
  photographer: string;
  tags: string[];
  driveFolderId?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UploadQueueItem {
  id: string;
  filename: string;
  fileSize: string;
  progress: number;
  status: 'completed' | 'uploading' | 'queued' | 'failed';
  speed?: string;
  thumbnailUrl?: string;
  errorMessage?: string;
  exifReady?: boolean;
  file?: File;
  driveFileId?: string;
}

export interface ActivityItem {
  id: string;
  type: 'upload' | 'share' | 'download' | 'security' | 'backup';
  title: string;
  albumTitle: string;
  timeAgo: string;
  user: string;
  userEmail?: string;
  detail?: string;
  timestamp?: string;
  albumId?: string;
}

export interface TopSharedLink {
  id: string;
  rank: number;
  title: string;
  views: number;
  downloads: number;
  growth: string;
  isPublic: boolean;
  shareToken?: string;
  albumId?: string;
}

export interface ShareLink {
  id: string;
  shareToken: string;
  albumId: string;
  isPublic: boolean;
  accessCount: number;
  createdAt: string;
  expiresAt?: string;
  isRevoked?: boolean;
  allowedDownload?: boolean;
  createdByUser?: string;
}

export interface GmailUser {
  uid?: string;
  name: string;
  email: string;
  avatarUrl: string;
  role: string;
  department: string;
  organization: string;
  isStaff: boolean;
  signedInAt: string;
  hasDriveAccess?: boolean;
}
