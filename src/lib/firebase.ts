import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with configured databaseId (CRITICAL)
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Google Auth Provider with least privilege Drive scope
// Scoped ONLY to files/folders created or opened by this application (drive.file)
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/drive.file');
googleProvider.setCustomParameters({ prompt: 'select_account' });

// In-memory access token cache with expiration (NEVER in localStorage/sessionStorage/Firestore)
let inMemoryAccessToken: string | null = null;
let tokenExpiresAt: number = 0; // Epoch milliseconds
let currentAuthorizedEmail: string | null = null;
let currentFirebaseUid: string | null = null;
let gisTokenClient: any = null;

/**
 * Safe diagnostic logger for Google OAuth & Picker operations
 * Strictly logs non-secret metadata (emails, error codes, types, picker status)
 * NEVER logs tokens, secrets, credentials, or PINs
 */
export function logSafeOAuthDiagnostic(event: string, details: {
  firebaseEmail?: string | null;
  loginHint?: string | null;
  errorCode?: string | number | null;
  errorType?: string | null;
  errorSubtype?: string | null;
  pickerOpenStatus?: string | null;
}) {
  console.log(`[Google OAuth Diagnostic] ${event}:`, {
    firebaseEmail: details.firebaseEmail || 'none',
    loginHint: details.loginHint || 'none',
    errorCode: details.errorCode ?? 'none',
    errorType: details.errorType || 'none',
    errorSubtype: details.errorSubtype || 'none',
    pickerOpenStatus: details.pickerOpenStatus || 'none',
    timestamp: new Date().toISOString()
  });
}

/**
 * Clear in-memory Drive OAuth state safely
 */
export function clearDriveOAuthState() {
  inMemoryAccessToken = null;
  tokenExpiresAt = 0;
  currentAuthorizedEmail = null;
}

export function setCachedAccessToken(token: string | null, expiresInSeconds: number = 3540, email?: string | null) {
  inMemoryAccessToken = token;
  if (token) {
    // Expire 60s early for safety margin
    tokenExpiresAt = Date.now() + (expiresInSeconds * 1000);
    if (email) {
      currentAuthorizedEmail = email.toLowerCase().trim();
    }
  } else {
    tokenExpiresAt = 0;
    currentAuthorizedEmail = null;
  }
}

export function isTokenExpired(): boolean {
  if (!inMemoryAccessToken) return true;
  // If current time is past expiration minus 30 seconds
  return Date.now() >= (tokenExpiresAt - 30000);
}

export function getCachedAccessToken(): string | null {
  if (isTokenExpired()) {
    return null;
  }
  return inMemoryAccessToken;
}

/**
 * Safely verifies Google Account identity (email) associated with the given Drive access token
 * Does not expose token or secrets. Returns normalized lowercase email or null.
 */
export async function getGoogleTokenEmail(token: string): Promise<string | null> {
  if (!token) return null;

  // 1. Try Google oauth2 tokeninfo endpoint
  try {
    const res = await fetch(`https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${encodeURIComponent(token)}`);
    if (res.ok) {
      const data = await res.json();
      if (data?.email) {
        return (data.email as string).toLowerCase().trim();
      }
    }
  } catch {
    // Continue to fallback
  }

  // 2. Fallback to Drive about endpoint (standard within drive.file scope)
  try {
    const res = await fetch('https://www.googleapis.com/drive/v3/about?fields=user', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.user?.emailAddress) {
        return (data.user.emailAddress as string).toLowerCase().trim();
      }
    }
  } catch (e) {
    console.warn('Could not read user info from Drive API:', e);
  }

  return null;
}

/**
 * Initializes Google Identity Services token client using the configured OAuth Client ID
 */
export function getOrCreateGISTokenClient(): any {
  if (typeof window === 'undefined' || !(window as any).google?.accounts?.oauth2) {
    return null;
  }
  const clientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID || firebaseConfig.oAuthClientId || '').trim();
  if (!gisTokenClient && clientId) {
    gisTokenClient = (window as any).google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'https://www.googleapis.com/auth/drive.file',
      callback: (tokenResponse: any) => {
        if (tokenResponse?.access_token) {
          const expiresIn = parseInt(tokenResponse.expires_in, 10) || 3540;
          setCachedAccessToken(tokenResponse.access_token, expiresIn);
        }
      },
    });
  }
  return gisTokenClient;
}

/**
 * Requests a fresh access token from Google via Google Identity Services requestAccessToken()
 * Passes login_hint (hint) for currentUser.email to prevent cross-account OAuth conflicts.
 */
export async function requestAccessTokenViaGIS(options: {
  promptType?: string;
  loginHint?: string | null;
} = {}): Promise<string | null> {
  const promptType = options.promptType ?? '';
  const loginHint = options.loginHint ?? auth.currentUser?.email ?? null;

  return new Promise(async (resolve, reject) => {
    try {
      const client = getOrCreateGISTokenClient();
      if (client) {
        client.callback = (resp: any) => {
          if (resp?.error) {
            logSafeOAuthDiagnostic('GIS Token Response Error', {
              firebaseEmail: auth.currentUser?.email,
              loginHint,
              errorCode: resp.error,
              errorType: resp.error_subtype || resp.error,
              errorSubtype: resp.error_description || resp.details
            });
            fallbackToFirebasePopup(loginHint).then(resolve).catch(reject);
          } else if (resp?.access_token) {
            const expiresIn = parseInt(resp.expires_in, 10) || 3540;
            setCachedAccessToken(resp.access_token, expiresIn, loginHint);
            resolve(resp.access_token);
          } else {
            resolve(null);
          }
        };

        client.error_callback = (err: any) => {
          logSafeOAuthDiagnostic('GIS error_callback Triggered', {
            firebaseEmail: auth.currentUser?.email,
            loginHint,
            errorCode: err?.type || err?.error || 'GIS_ERROR',
            errorType: err?.type || 'error_callback',
            errorSubtype: err?.message || err?.details
          });
          fallbackToFirebasePopup(loginHint).then(resolve).catch(reject);
        };

        const requestConfig: any = { prompt: promptType };
        if (loginHint) {
          requestConfig.login_hint = loginHint;
        }

        logSafeOAuthDiagnostic('Requesting GIS Access Token', {
          firebaseEmail: auth.currentUser?.email,
          loginHint,
          errorType: promptType ? `prompt=${promptType}` : 'prompt=default'
        });

        client.requestAccessToken(requestConfig);
        return;
      }

      // Fallback if GIS client not ready
      const token = await fallbackToFirebasePopup(loginHint);
      resolve(token);
    } catch (err: any) {
      logSafeOAuthDiagnostic('GIS Request Exception', {
        firebaseEmail: auth.currentUser?.email,
        loginHint,
        errorCode: err?.code,
        errorType: err?.name || 'Exception',
        errorSubtype: err?.message
      });
      reject(err);
    }
  });
}

async function fallbackToFirebasePopup(loginHint?: string | null): Promise<string | null> {
  const { signInWithPopup } = await import('firebase/auth');
  const customParams: Record<string, string> = { prompt: 'select_account' };
  if (loginHint) {
    customParams.login_hint = loginHint;
  }
  googleProvider.setCustomParameters(customParams);

  try {
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken || null;
    if (token) {
      setCachedAccessToken(token, 3540, result.user.email);
      return token;
    }
    return null;
  } catch (popupErr: any) {
    logSafeOAuthDiagnostic('Firebase Popup Error', {
      firebaseEmail: auth.currentUser?.email,
      loginHint,
      errorCode: popupErr?.code,
      errorType: popupErr?.name,
      errorSubtype: popupErr?.message
    });
    throw popupErr;
  }
}

/**
 * Ensures a valid in-memory access token matching the expected user email.
 * Implements strict Account Mismatch Detection and Account Chooser fallback.
 */
export async function getValidAccessToken(expectedUserEmail?: string | null): Promise<string | null> {
  const targetEmail = (expectedUserEmail || auth.currentUser?.email || '').toLowerCase().trim();

  // 1. Check in-memory token validity & match
  if (!isTokenExpired() && inMemoryAccessToken) {
    if (currentAuthorizedEmail && targetEmail && currentAuthorizedEmail === targetEmail) {
      return inMemoryAccessToken;
    }
    if (!currentAuthorizedEmail && targetEmail) {
      const verified = await getGoogleTokenEmail(inMemoryAccessToken);
      if (verified) {
        currentAuthorizedEmail = verified;
        if (verified === targetEmail) {
          return inMemoryAccessToken;
        }
        logSafeOAuthDiagnostic('Account Mismatch on Cached Token', {
          firebaseEmail: targetEmail,
          loginHint: verified,
          errorType: 'ACCOUNT_MISMATCH'
        });
        clearDriveOAuthState();
      }
    } else if (currentAuthorizedEmail && targetEmail && currentAuthorizedEmail !== targetEmail) {
      logSafeOAuthDiagnostic('Stale Account Token Cleared', {
        firebaseEmail: targetEmail,
        loginHint: currentAuthorizedEmail,
        errorType: 'ACCOUNT_CHANGED'
      });
      clearDriveOAuthState();
    } else if (!targetEmail) {
      return inMemoryAccessToken;
    }
  }

  // 2. First Attempt: Request token with login_hint and prompt: ''
  let token: string | null = null;
  try {
    token = await requestAccessTokenViaGIS({ promptType: '', loginHint: targetEmail });
  } catch (err) {
    console.warn('Initial token request failed, will try account chooser:', err);
  }

  // 3. Verify account identity for first attempt
  if (token && targetEmail) {
    const verifiedEmail = await getGoogleTokenEmail(token);
    if (verifiedEmail) {
      currentAuthorizedEmail = verifiedEmail;
      if (verifiedEmail !== targetEmail) {
        logSafeOAuthDiagnostic('Account Mismatch on First Attempt', {
          firebaseEmail: targetEmail,
          loginHint: verifiedEmail,
          errorType: 'ACCOUNT_MISMATCH'
        });
        clearDriveOAuthState();
        token = null;
      }
    }
  }

  // 4. Second Attempt: If mismatch or no token, use prompt: 'select_account'
  if (!token && targetEmail) {
    logSafeOAuthDiagnostic('Launching Account Chooser', {
      firebaseEmail: targetEmail,
      loginHint: targetEmail,
      errorType: 'PROMPT_SELECT_ACCOUNT'
    });
    try {
      token = await requestAccessTokenViaGIS({ promptType: 'select_account', loginHint: targetEmail });
    } catch (err) {
      console.warn('Account chooser request failed:', err);
    }

    if (token) {
      const verifiedEmail = await getGoogleTokenEmail(token);
      if (verifiedEmail) {
        currentAuthorizedEmail = verifiedEmail;
        if (verifiedEmail !== targetEmail) {
          logSafeOAuthDiagnostic('Account Mismatch After Account Chooser', {
            firebaseEmail: targetEmail,
            loginHint: verifiedEmail,
            errorType: 'ACCOUNT_MISMATCH_REJECTED'
          });
          clearDriveOAuthState();
          throw new Error('บัญชี Google สำหรับ Google Drive ไม่ตรงกับบัญชีที่เข้าสู่ระบบ กรุณาเลือกบัญชีเดียวกัน');
        }
      }
    }
  }

  if (!token && targetEmail) {
    throw new Error('ไม่สามารถรับสิทธิ์เข้าถึง Google Drive สำหรับบัญชี ' + targetEmail);
  }

  return token;
}

// Clear token on sign out or UID change
onAuthStateChanged(auth, (user) => {
  if (!user) {
    clearDriveOAuthState();
    currentFirebaseUid = null;
  } else {
    if (currentFirebaseUid && currentFirebaseUid !== user.uid) {
      clearDriveOAuthState();
    }
    currentFirebaseUid = user.uid;
  }
});

export const FIREBASE_PROJECT_NAME = "picture edtech (gen-lang-client-0751488820)";
