import firebaseConfig from '../../firebase-applet-config.json';

export interface OAuthDiagnosticInfo {
  actualOrigin: string;
  protocol: string;
  host: string;
  fullHref: string;
  gisOAuthClientId: string;
  pickerOrigin: string;
  googleCloudProjectNumber: string;
  firebaseProjectId: string;
  hasTrailingSlash: boolean;
  isValidOriginFormat: boolean;
  gcpConsoleUrl: string;
}

/**
 * Collects runtime OAuth parameters and origins
 */
export function getOAuthDiagnosticInfo(): OAuthDiagnosticInfo {
  const origin = typeof window !== 'undefined' ? (window.location.origin || `${window.location.protocol}//${window.location.host}`) : '';
  const protocol = typeof window !== 'undefined' ? window.location.protocol : '';
  const host = typeof window !== 'undefined' ? window.location.host : '';
  const fullHref = typeof window !== 'undefined' ? window.location.href : '';
  
  const gisOAuthClientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID || firebaseConfig.oAuthClientId || '').trim();
  const pickerOrigin = typeof window !== 'undefined' ? (window.location.origin || `${window.location.protocol}//${window.location.host}`) : '';
  const googleCloudProjectNumber = '492271785891';
  const firebaseProjectId = firebaseConfig.projectId || 'gen-lang-client-0751488820';

  const hasTrailingSlash = origin.endsWith('/');
  const isValidOriginFormat = /^https?:\/\/[^/:]+(:\d+)?$/.test(origin);
  const gcpConsoleUrl = `https://console.cloud.google.com/apis/credentials?project=${firebaseProjectId}`;

  return {
    actualOrigin: origin,
    protocol,
    host,
    fullHref,
    gisOAuthClientId,
    pickerOrigin,
    googleCloudProjectNumber,
    firebaseProjectId,
    hasTrailingSlash,
    isValidOriginFormat,
    gcpConsoleUrl
  };
}

/**
 * Diagnostic script that logs window.location.origin, the current OAuth client ID used in
 * Google Identity Services, and the configured Picker origin to the console for debugging
 * origin_mismatch errors.
 */
export function logOAuthOriginDiagnostic(): OAuthDiagnosticInfo {
  const info = getOAuthDiagnosticInfo();

  console.group(
    '%c[Google OAuth Origin & Client ID Diagnostic]',
    'color: #1a73e8; font-weight: bold; font-size: 13px; padding: 2px 4px; background: #e8f0fe; border-radius: 4px;'
  );

  console.log('%c1. Runtime Browser Origin:', 'font-weight: bold; color: #202124;');
  console.log('  window.location.origin   :', info.actualOrigin);
  console.log('  window.location.protocol :', info.protocol);
  console.log('  window.location.host     :', info.host);
  console.log('  window.location.href     :', info.fullHref);

  console.log('%c2. Google Identity Services (GIS) Client ID:', 'font-weight: bold; color: #202124;');
  console.log('  Current OAuth Client ID  :', info.gisOAuthClientId);
  console.log('  GCP Project Number       :', info.googleCloudProjectNumber);
  console.log('  Firebase Project ID      :', info.firebaseProjectId);

  console.log('%c3. Google Picker Configured Origin:', 'font-weight: bold; color: #202124;');
  console.log('  Picker .setOrigin() value:', info.pickerOrigin);

  console.log('%c4. Origin Validation & Google Cloud Console Instructions:', 'font-weight: bold; color: #202124;');
  if (!info.isValidOriginFormat || info.hasTrailingSlash) {
    console.warn(
      `⚠️ WARNING: Origin "${info.actualOrigin}" format may cause origin_mismatch. Ensure NO trailing slash or path!`
    );
  } else {
    console.log(`✅ Origin format is valid: "${info.actualOrigin}"`);
  }

  console.log(
    `👉 To resolve Error 400: origin_mismatch:\n` +
    `   1. Open Google Cloud Console: ${info.gcpConsoleUrl}\n` +
    `   2. Select OAuth 2.0 Client ID: "${info.gisOAuthClientId}"\n` +
    `   3. Under "Authorized JavaScript origins", ensure this EXACT URI exists:\n` +
    `      👉 ${info.actualOrigin}\n` +
    `      (Do NOT add a trailing slash, path, or hash!)\n` +
    `   4. Click Save and allow 2-5 minutes for Google servers to sync.`
  );

  const rawEnvKey = import.meta.env.VITE_GOOGLE_PICKER_API_KEY;
  const cleanEnvKey = typeof rawEnvKey === 'string' ? rawEnvKey.replace(/^["']|["']$/g, '').trim() : '';
  const activePickerKey = cleanEnvKey || (firebaseConfig.apiKey || '').trim();
  const maskedKey = activePickerKey ? `${activePickerKey.slice(0, 8)}...${activePickerKey.slice(-4)}` : 'MISSING';

  console.log('%c5. Google Picker API Key Diagnostic:', 'font-weight: bold; color: #202124;');
  console.log('  Active Picker Key        :', maskedKey, cleanEnvKey ? '(From VITE_GOOGLE_PICKER_API_KEY)' : '(From Firebase Default Key)');
  console.log('  App ID (Project Number)  :', info.googleCloudProjectNumber);
  console.log(
    `👉 To resolve "คีย์ API ของนักพัฒนาซอฟต์แวร์ไม่ถูกต้อง" (Invalid Developer Key):\n` +
    `   1. เปิด Google Picker API ใน GCP Project:\n` +
    `      👉 https://console.cloud.google.com/marketplace/product/google/picker.googleapis.com?project=${info.firebaseProjectId}\n` +
    `      (ต้องขึ้นสถานة ENABLED สีฟ้า/เขียว)\n` +
    `   2. ตรวจสอบ API Key Restrictions ใน GCP Credentials:\n` +
    `      👉 ${info.gcpConsoleUrl}\n` +
    `      - ถ้าตั้ง Restrict key: ตรวจสอบว่ามี "Google Picker API" และ "Google Drive API" ในรายการ\n` +
    `      - ถ้าตั้ง Website restrictions: ตรวจสอบว่ามี "${info.actualOrigin}/*" และ "https://docs.google.com/*"`
  );

  console.groupEnd();

  return info;
}

// Auto-expose on window for easy developer inspection in browser DevTools
if (typeof window !== 'undefined') {
  (window as any).__logOAuthOriginDiagnostic = logOAuthOriginDiagnostic;
  (window as any).__getOAuthDiagnosticInfo = getOAuthDiagnosticInfo;
}
