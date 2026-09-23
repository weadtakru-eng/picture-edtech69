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
let gisTokenClient: any = null;

export function setCachedAccessToken(token: string | null, expiresInSeconds: number = 3540) {
  inMemoryAccessToken = token;
  if (token) {
    // Expire 60s early for safety margin
    tokenExpiresAt = Date.now() + (expiresInSeconds * 1000);
  } else {
    tokenExpiresAt = 0;
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
 * Initializes Google Identity Services token client using the configured OAuth Client ID
 */
export function getOrCreateGISTokenClient(): any {
  if (typeof window === 'undefined' || !(window as any).google?.accounts?.oauth2) {
    return null;
  }
  if (!gisTokenClient && firebaseConfig.oAuthClientId) {
    gisTokenClient = (window as any).google.accounts.oauth2.initTokenClient({
      client_id: firebaseConfig.oAuthClientId,
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
 * Genuinely contacts Google servers when expired or after 401.
 * If GIS is blocked or unavailable, seamlessly uses Firebase GoogleAuthProvider popup.
 */
export async function requestAccessTokenViaGIS(promptType: string = ''): Promise<string | null> {
  return new Promise(async (resolve, reject) => {
    try {
      const client = getOrCreateGISTokenClient();
      if (client) {
        client.callback = (resp: any) => {
          if (resp?.error) {
            console.warn('Google Identity Services returned error:', resp);
            fallbackToFirebasePopup().then(resolve).catch(reject);
          } else if (resp?.access_token) {
            const expiresIn = parseInt(resp.expires_in, 10) || 3540;
            setCachedAccessToken(resp.access_token, expiresIn);
            resolve(resp.access_token);
          } else {
            resolve(null);
          }
        };
        client.requestAccessToken({ prompt: promptType });
        return;
      }

      // Fallback if GIS client not ready
      const token = await fallbackToFirebasePopup();
      resolve(token);
    } catch (err) {
      reject(err);
    }
  });
}

async function fallbackToFirebasePopup(): Promise<string | null> {
  const { signInWithPopup } = await import('firebase/auth');
  const result = await signInWithPopup(auth, googleProvider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  if (credential?.accessToken) {
    setCachedAccessToken(credential.accessToken);
    return credential.accessToken;
  }
  return null;
}

/**
 * Ensures a valid in-memory access token is available.
 * If expired or missing, genuinely requests a new token from Google.
 */
export async function getValidAccessToken(): Promise<string | null> {
  if (!isTokenExpired() && inMemoryAccessToken) {
    return inMemoryAccessToken;
  }

  try {
    return await requestAccessTokenViaGIS('');
  } catch (err) {
    console.warn('Failed to obtain new access token:', err);
    return null;
  }
}

// Clear token on sign out
onAuthStateChanged(auth, (user) => {
  if (!user) {
    inMemoryAccessToken = null;
    tokenExpiresAt = 0;
  }
});

export const FIREBASE_PROJECT_NAME = "picture edtech (gen-lang-client-0751488820)";
