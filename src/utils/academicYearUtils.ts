/**
 * Utilities for Thai Academic Years, Months, and Google Drive URL Validation
 * School Media Vault - Rajinibon School
 */

export interface ThaiMonth {
  number: number;
  name: string;
  shortName: string;
}

export const THAI_MONTHS: readonly ThaiMonth[] = [
  { number: 1, name: 'มกราคม', shortName: 'ม.ค.' },
  { number: 2, name: 'กุมภาพันธ์', shortName: 'ก.พ.' },
  { number: 3, name: 'มีนาคม', shortName: 'มี.ค.' },
  { number: 4, name: 'เมษายน', shortName: 'เม.ย.' },
  { number: 5, name: 'พฤษภาคม', shortName: 'พ.ค.' },
  { number: 6, name: 'มิถุนายน', shortName: 'มิ.ย.' },
  { number: 7, name: 'กรกฎาคม', shortName: 'ก.ค.' },
  { number: 8, name: 'สิงหาคม', shortName: 'ส.ค.' },
  { number: 9, name: 'กันยายน', shortName: 'ก.ย.' },
  { number: 10, name: 'ตุลาคม', shortName: 'ต.ค.' },
  { number: 11, name: 'พฤศจิกายน', shortName: 'พ.ย.' },
  { number: 12, name: 'ธันวาคม', shortName: 'ธ.ค.' },
];

export const DEFAULT_ACADEMIC_YEARS = ['2570', '2569', '2568'] as const;

/**
 * Determine month number (1 - 12) from month name or date string
 */
export function getMonthNumberFromName(monthOrDate?: string): number {
  if (!monthOrDate) return 8; // Default August
  const trimmed = monthOrDate.trim();
  for (const m of THAI_MONTHS) {
    if (trimmed === m.name || trimmed.includes(m.name) || trimmed.includes(m.shortName)) {
      return m.number;
    }
  }
  return 8;
}

/**
 * Determine month name from month number (1 - 12)
 */
export function getMonthNameFromNumber(monthNumber?: number): string {
  if (!monthNumber || monthNumber < 1 || monthNumber > 12) return 'สิงหาคม';
  const found = THAI_MONTHS.find(m => m.number === monthNumber);
  return found ? found.name : 'สิงหาคม';
}

/**
 * Regex to validate Google Drive or Google Docs domains (drive.google.com or docs.google.com)
 */
export const GOOGLE_DRIVE_DOMAIN_REGEX = /^(https?:\/\/)?(([\w-]+\.)?drive\.google\.com|docs\.google\.com)(\/.*)?$/i;

/**
 * Validates whether the given string is a valid Google Drive URL using regex
 * checking domain drive.google.com or docs.google.com.
 */
export function isValidGoogleDriveUrl(url?: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  return GOOGLE_DRIVE_DOMAIN_REGEX.test(trimmed);
}

/**
 * Ensures URL starts with https:// if user pasted without protocol
 */
export function normalizeGoogleDriveUrl(url: string): string {
  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

/**
 * Safely opens a Google Drive URL in a new tab without requiring OAuth login
 */
export function openGoogleDrive(driveUrl?: string, driveFolderId?: string) {
  let target = driveUrl?.trim();
  if (!target && driveFolderId && !driveFolderId.startsWith('drive-folder-')) {
    target = `https://drive.google.com/drive/folders/${driveFolderId}`;
  }
  if (target) {
    const safeUrl = normalizeGoogleDriveUrl(target);
    window.open(safeUrl, '_blank', 'noopener,noreferrer');
  }
}
