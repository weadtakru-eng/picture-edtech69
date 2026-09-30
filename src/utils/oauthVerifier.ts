import firebaseConfig from '../../firebase-applet-config.json';

/**
 * Expected Google OAuth 2.0 Client ID for Rajinibon School Media Vault
 */
export const TARGET_OAUTH_CLIENT_ID = '492271785891-odc8ftlkg5rijq13h16p69eh2196ahp6.apps.googleusercontent.com';

/**
 * Primary authorized production JavaScript Origin registered in Google Cloud Console
 */
export const PRODUCTION_AUTHORIZED_ORIGIN = 'https://picture-edtech69.vercel.app';

/**
 * Default authorized origins list
 */
export const DEFAULT_AUTHORIZED_ORIGINS: readonly string[] = [
  PRODUCTION_AUTHORIZED_ORIGIN,
];

export interface OAuthOriginVerification {
  isValid: boolean;
  currentOrigin: string;
  clientId: string;
  authorizedOrigins: string[];
  isProductionOrigin: boolean;
  warningTitle?: string;
  warningMessage?: string;
  suggestedAction?: string;
  gcpConsoleUrl: string;
  timestamp: number;
}

type WarningListener = (warning: OAuthOriginVerification | null) => void;
const warningListeners = new Set<WarningListener>();
let currentActiveWarning: OAuthOriginVerification | null = null;

/**
 * Normalize an origin URL for strict comparison (remove trailing slashes, lowercase protocol & host)
 */
export function normalizeOrigin(originUrl?: string): string {
  if (!originUrl) return '';
  try {
    const trimmed = originUrl.trim();
    // Remove any trailing slashes or paths
    const url = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    return `${url.protocol}//${url.host}`.toLowerCase();
  } catch {
    return originUrl.trim().replace(/\/+$/, '').toLowerCase();
  }
}

/**
 * Retrieves the list of currently authorized origins (configured list + environment variables)
 */
export function getAuthorizedOrigins(): string[] {
  const origins = new Set<string>();

  // Add default production origin
  origins.add(normalizeOrigin(PRODUCTION_AUTHORIZED_ORIGIN));

  // Add origins configured via environment variable (e.g. VITE_AUTHORIZED_ORIGINS=https://...,http://localhost:3000)
  const envOrigins = import.meta.env.VITE_AUTHORIZED_ORIGINS;
  if (typeof envOrigins === 'string' && envOrigins.trim()) {
    envOrigins.split(',').forEach((o: string) => {
      const norm = normalizeOrigin(o);
      if (norm) origins.add(norm);
    });
  }

  // If VITE_APP_ORIGIN is specified
  const envAppOrigin = import.meta.env.VITE_APP_ORIGIN;
  if (typeof envAppOrigin === 'string' && envAppOrigin.trim()) {
    const norm = normalizeOrigin(envAppOrigin);
    if (norm) origins.add(norm);
  }

  return Array.from(origins);
}

export const TARGET_ORIGIN = 'https://picture-edtech69.vercel.app';

/**
 * Checks if window.location.origin matches 'https://picture-edtech69.vercel.app'
 * @returns {boolean} true if window.location.origin is exactly 'https://picture-edtech69.vercel.app'
 */
export function checkIsProductionOrigin(): boolean {
  if (typeof window === 'undefined') return false;
  return normalizeOrigin(window.location.origin) === normalizeOrigin(TARGET_ORIGIN);
}

/**
 * Detailed diagnostic check comparing window.location.origin with 'https://picture-edtech69.vercel.app'
 */
export function checkOAuthOrigin(): {
  isMatch: boolean;
  currentOrigin: string;
  expectedOrigin: string;
} {
  const currentOrigin = typeof window !== 'undefined'
    ? (window.location.origin || `${window.location.protocol}//${window.location.host}`)
    : '';
  const isMatch = normalizeOrigin(currentOrigin) === normalizeOrigin(TARGET_ORIGIN);
  return {
    isMatch,
    currentOrigin,
    expectedOrigin: TARGET_ORIGIN,
  };
}

/**
 * Explicitly validates if current window.location.origin matches the authorized redirect URI / JavaScript origin
 * registered in the Google Cloud Console for client ID 492271785891-odc8ftlkg5rijq13h16p69eh2196ahp6.apps.googleusercontent.com
 */
export function verifyOAuthOrigin(): OAuthOriginVerification {
  const rawOrigin = typeof window !== 'undefined'
    ? (window.location.origin || `${window.location.protocol}//${window.location.host}`)
    : '';
  const currentOrigin = normalizeOrigin(rawOrigin);
  const configuredClientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID || firebaseConfig.oAuthClientId || TARGET_OAUTH_CLIENT_ID).trim();
  const effectiveClientId = configuredClientId || TARGET_OAUTH_CLIENT_ID;

  const authorizedOrigins = getAuthorizedOrigins();
  const isAuthorized = authorizedOrigins.some((authOrigin) => currentOrigin === authOrigin);
  const isProduction = currentOrigin === normalizeOrigin(PRODUCTION_AUTHORIZED_ORIGIN);

  const gcpProjectId = firebaseConfig.projectId || 'gen-lang-client-0751488820';
  const gcpConsoleUrl = `https://console.cloud.google.com/apis/credentials?project=${gcpProjectId}`;

  if (isAuthorized) {
    return {
      isValid: true,
      currentOrigin,
      clientId: effectiveClientId,
      authorizedOrigins,
      isProductionOrigin: isProduction,
      gcpConsoleUrl,
      timestamp: Date.now(),
    };
  }

  // If origin mismatch is detected
  const warningTitle = '⚠️ ตรวจพบ Google OAuth Origin Mismatch (Error 400 Prevention)';
  const warningMessage =
    `Origin ปัจจุบันคือ "${currentOrigin}" ซึ่งไม่ตรงกับ Authorized JavaScript Origin ใน Google Cloud Console ` +
    `สำหรับ OAuth Client ID "${effectiveClientId}". หากเริ่ม Google Identity Services อาจเกิดข้อผิดพลาด "Error 400: origin_mismatch"`;

  const suggestedAction =
    `แนวทางแก้ไข:\n` +
    `1. เข้าใช้งานผ่าน Production Domain จริง: ${PRODUCTION_AUTHORIZED_ORIGIN}\n` +
    `2. หรือเพิ่ม "${currentOrigin}" ใน Authorized JavaScript origins ของ Google Cloud Console (${gcpConsoleUrl})`;

  return {
    isValid: false,
    currentOrigin,
    clientId: effectiveClientId,
    authorizedOrigins,
    isProductionOrigin: isProduction,
    warningTitle,
    warningMessage,
    suggestedAction,
    gcpConsoleUrl,
    timestamp: Date.now(),
  };
}

/**
 * Subscribe to origin warning state changes to display warnings in the UI
 */
export function subscribeOAuthOriginWarning(listener: WarningListener): () => void {
  warningListeners.add(listener);
  // Emit current state immediately to new subscriber
  listener(currentActiveWarning);
  return () => {
    warningListeners.delete(listener);
  };
}

/**
 * Sets or clears the active warning and notifies all registered UI components
 */
export function setOAuthOriginWarning(warning: OAuthOriginVerification | null) {
  currentActiveWarning = warning;
  warningListeners.forEach((listener) => {
    try {
      listener(warning);
    } catch (e) {
      console.error('Error in OAuth origin warning listener:', e);
    }
  });
}

/**
 * Gets the current active origin warning
 */
export function getActiveOAuthOriginWarning(): OAuthOriginVerification | null {
  return currentActiveWarning;
}

/**
 * Dismiss the active origin warning banner in the UI
 */
export function dismissOAuthOriginWarning() {
  setOAuthOriginWarning(null);
}

/**
 * Pre-flight check before initiating the Google Identity Services flow.
 * Validates the origin and automatically triggers UI warnings if not authorized.
 * 
 * @returns {boolean} true if the origin is authorized and safe to proceed; false if mismatch was detected.
 */
export function validateOriginBeforeGISFlow(options: { forceNotifyUI?: boolean } = {}): {
  allowed: boolean;
  verification: OAuthOriginVerification;
} {
  const verification = verifyOAuthOrigin();

  if (!verification.isValid) {
    console.warn(
      `%c[OAuth Verifier] Origin Mismatch Detected!%c\n` +
      `Current Origin: ${verification.currentOrigin}\n` +
      `Expected Registered Origins: ${verification.authorizedOrigins.join(', ')}\n` +
      `OAuth Client ID: ${verification.clientId}\n` +
      `GCP Console: ${verification.gcpConsoleUrl}`,
      'color: #d93025; font-weight: bold; font-size: 13px;',
      'color: inherit;'
    );

    // Display the warning in the UI
    if (options.forceNotifyUI !== false) {
      setOAuthOriginWarning(verification);
    }

    return {
      allowed: false,
      verification,
    };
  }

  // If valid, ensure any stale mismatch warning is cleared
  if (currentActiveWarning && currentActiveWarning.isValid === false) {
    setOAuthOriginWarning(null);
  }

  return {
    allowed: true,
    verification,
  };
}

// Global hook for debugging in DevTools
if (typeof window !== 'undefined') {
  (window as any).__verifyOAuthOrigin = verifyOAuthOrigin;
  (window as any).__validateOriginBeforeGISFlow = validateOriginBeforeGISFlow;
  (window as any).__checkIsProductionOrigin = checkIsProductionOrigin;
  (window as any).__checkOAuthOrigin = checkOAuthOrigin;
}
