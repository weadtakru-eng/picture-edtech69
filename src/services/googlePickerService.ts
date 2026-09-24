import firebaseConfig from '../../firebase-applet-config.json';
import { getCachedAccessToken, getValidAccessToken, auth, logSafeOAuthDiagnostic } from '../lib/firebase';
import { GmailUser } from '../types';

export interface GooglePickerFile {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes?: number;
  lastEditedUtc?: number;
  url?: string;
  thumbnails?: Array<{ url: string; width: number; height: number }>;
  description?: string;
}

let isGapiLoaded = false;
let gapiLoadPromise: Promise<void> | null = null;

/**
 * Ensure Google API client and Picker module are loaded
 */
export function loadGooglePickerApi(): Promise<void> {
  if (isGapiLoaded && (window as any).google?.picker) {
    return Promise.resolve();
  }

  if (gapiLoadPromise) {
    return gapiLoadPromise;
  }

  gapiLoadPromise = new Promise<void>((resolve, reject) => {
    const checkAndLoadPicker = () => {
      const gapi = (window as any).gapi;
      if (!gapi) {
        reject(new Error('ไม่สามารถโหลด Google API Client ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต'));
        return;
      }

      gapi.load('picker', {
        callback: () => {
          isGapiLoaded = true;
          resolve();
        },
        onerror: () => {
          reject(new Error('เกิดข้อผิดพลาดในการโหลดโมดูล Google Picker'));
        }
      });
    };

    if (typeof (window as any).gapi !== 'undefined') {
      checkAndLoadPicker();
    } else {
      // Inject script dynamically if missing
      const existingScript = document.querySelector('script[src="https://apis.google.com/js/api.js"]');
      if (existingScript) {
        existingScript.addEventListener('load', checkAndLoadPicker);
        existingScript.addEventListener('error', () => reject(new Error('โหลด Google API ไม่สำเร็จ')));
      } else {
        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/api.js';
        script.async = true;
        script.defer = true;
        script.onload = checkAndLoadPicker;
        script.onerror = () => reject(new Error('โหลด Google API ไม่สำเร็จ'));
        document.head.appendChild(script);
      }
    }
  });

  return gapiLoadPromise;
}

/**
 * Opens Google Picker dialog to select images from the specific album's Google Drive folder.
 * Grants drive.file permission to the selected photos automatically.
 */
export async function openGooglePhotoPicker(options: {
  folderId?: string;
  albumTitle?: string;
  userEmail?: string;
  currentUser?: GmailUser | null;
  onAuthRequired?: () => void;
}): Promise<GooglePickerFile[]> {
  const targetEmail = options.userEmail || options.currentUser?.email || auth.currentUser?.email || null;

  // 1. Ensure valid access token specifically matching current user
  let token: string | null = null;
  try {
    token = await getValidAccessToken(targetEmail);
  } catch (err: any) {
    logSafeOAuthDiagnostic('Picker Token Fetch Failed', {
      firebaseEmail: targetEmail,
      loginHint: targetEmail,
      errorCode: err?.code,
      errorType: err?.name,
      errorSubtype: err?.message,
      pickerOpenStatus: 'FAILED_TOKEN'
    });
    throw err;
  }

  if (!token) {
    token = getCachedAccessToken();
  }

  if (!token) {
    if (options.onAuthRequired) {
      options.onAuthRequired();
    }
    logSafeOAuthDiagnostic('Picker Token Missing', {
      firebaseEmail: targetEmail,
      loginHint: targetEmail,
      pickerOpenStatus: 'ABORTED_NO_TOKEN'
    });
    throw new Error('กรุณาลงชื่อเข้าใช้ด้วยบัญชี Google เพื่อเปิดใช้งาน Google Drive');
  }

  // 2. Load Google Picker API
  await loadGooglePickerApi();

  const google = (window as any).google;
  if (!google?.picker) {
    logSafeOAuthDiagnostic('Google Picker API Unavailable', {
      firebaseEmail: targetEmail,
      pickerOpenStatus: 'API_UNAVAILABLE'
    });
    throw new Error('Google Picker API ยังไม่พร้อมใช้งาน กรุณาลองใหม่อีกครั้ง');
  }

  logSafeOAuthDiagnostic('Opening Google Picker', {
    firebaseEmail: targetEmail,
    loginHint: targetEmail,
    pickerOpenStatus: 'OPENING'
  });

  return new Promise<GooglePickerFile[]>((resolve, reject) => {
    try {
      // 3. Configure DocsView for images only
      const docsView = new google.picker.DocsView(google.picker.ViewId.DOCS)
        .setMimeTypes('image/jpeg,image/png,image/webp,image/gif,image/heic,image/tiff')
        .setIncludeFolders(false)
        .setSelectFolderEnabled(false);

      // Point directly to album folder if available
      if (options.folderId && !options.folderId.startsWith('drive-folder-')) {
        docsView.setParent(options.folderId);
      }

      // 4. Dedicated Google Picker API key from environment variable (never hardcoded)
      const rawEnvKey = import.meta.env.VITE_GOOGLE_PICKER_API_KEY;
      const cleanEnvKey = typeof rawEnvKey === 'string' ? rawEnvKey.replace(/^["']|["']$/g, '').trim() : '';
      const pickerApiKey = cleanEnvKey || (firebaseConfig.apiKey || '').trim();
      const googleCloudProjectNumber = (import.meta.env.VITE_GOOGLE_PROJECT_NUMBER || firebaseConfig.messagingSenderId || '492271785891').trim();

      const pickerOrigin = window.location.origin || (window.location.protocol + '//' + window.location.host);

      // Build Picker with least privilege drive.file scope & OAuth token
      const builder = new google.picker.PickerBuilder()
        .addView(docsView)
        .setOAuthToken(token)
        .setDeveloperKey(pickerApiKey)
        .setAppId(googleCloudProjectNumber)
        .enableFeature(google.picker.Feature.MULTISELECT_ENABLED)
        .setLocale('th')
        .setTitle(options.albumTitle ? `เลือกรูปภาพสำหรับอัลบั้ม: ${options.albumTitle}` : 'เลือกรูปภาพเพื่อซิงค์เข้าสู่อัลบั้ม')
        .setOrigin(pickerOrigin);

      builder.setCallback((data: any) => {
        const action = data[google.picker.Response.ACTION];

        if (action === google.picker.Action.PICKED) {
          const documents = data[google.picker.Response.DOCUMENTS] || [];
          logSafeOAuthDiagnostic('Picker Documents Picked', {
            firebaseEmail: targetEmail,
            pickerOpenStatus: `PICKED_${documents.length}_FILES`
          });
          const files: GooglePickerFile[] = documents.map((doc: any) => ({
            id: doc.id,
            name: doc.name,
            mimeType: doc.mimeType || 'image/jpeg',
            sizeBytes: typeof doc.sizeBytes === 'number' ? doc.sizeBytes : (doc.sizeBytes ? parseInt(doc.sizeBytes, 10) : undefined),
            lastEditedUtc: doc.lastEditedUtc,
            url: doc.url,
            thumbnails: doc.thumbnails,
            description: doc.description
          }));
          resolve(files);
        } else if (action === google.picker.Action.CANCEL) {
          logSafeOAuthDiagnostic('Picker Cancelled', {
            firebaseEmail: targetEmail,
            pickerOpenStatus: 'CANCELLED'
          });
          // User closed or cancelled picker: resolve with empty array (no error)
          resolve([]);
        }
      });

      const picker = builder.build();
      picker.setVisible(true);
    } catch (err: any) {
      logSafeOAuthDiagnostic('Google Picker Initialization Error', {
        firebaseEmail: targetEmail,
        errorCode: err?.code,
        errorType: err?.name,
        errorSubtype: err?.message,
        pickerOpenStatus: 'ERROR'
      });
      reject(err);
    }
  });
}
