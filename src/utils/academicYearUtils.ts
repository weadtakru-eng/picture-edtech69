export interface ThaiMonth {
  number: number;
  name: string;
}

export const THAI_MONTHS: ThaiMonth[] = [
  { number: 1, name: 'มกราคม' },
  { number: 2, name: 'กุมภาพันธ์' },
  { number: 3, name: 'มีนาคม' },
  { number: 4, name: 'เมษายน' },
  { number: 5, name: 'พฤษภาคม' },
  { number: 6, name: 'มิถุนายน' },
  { number: 7, name: 'กรกฎาคม' },
  { number: 8, name: 'สิงหาคม' },
  { number: 9, name: 'กันยายน' },
  { number: 10, name: 'ตุลาคม' },
  { number: 11, name: 'พฤศจิกายน' },
  { number: 12, name: 'ธันวาคม' }
];

export const DEFAULT_ACADEMIC_YEARS: string[] = ['2569', '2568'];

export const GOOGLE_DRIVE_DOMAIN_REGEX = /^(https?:\/\/)?(drive|docs)\.google\.com(\/.*)?$/i;

export function isValidGoogleDriveUrl(url: string): boolean {
  if (!url) return false;
  return GOOGLE_DRIVE_DOMAIN_REGEX.test(url.trim());
}

export function normalizeGoogleDriveUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

export function openGoogleDrive(url?: string, folderId?: string): void {
  if (url && url.trim()) {
    const safe = normalizeGoogleDriveUrl(url);
    window.open(safe, '_blank', 'noopener,noreferrer');
    return;
  }
  if (folderId && folderId.trim() && !folderId.startsWith('drive-folder-')) {
    window.open(`https://drive.google.com/drive/folders/${folderId}`, '_blank', 'noopener,noreferrer');
    return;
  }
  window.open('https://drive.google.com', '_blank', 'noopener,noreferrer');
}

export function getMonthNumberFromName(monthName: string): number {
  const found = THAI_MONTHS.find((m) => m.name === monthName);
  return found ? found.number : 1;
}
