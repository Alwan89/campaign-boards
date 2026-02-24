/**
 * googleAuth.js — Google OAuth2 for browser-based Sheets + Drive access.
 *
 * Uses Google Identity Services (GIS) implicit token flow.
 * No backend needed — the user signs in with their own Google account.
 */

const CLIENT_ID = '13156438808-d7hi2cumb3f3q33cbbqpbb9sfdrl64jb.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets.readonly https://www.googleapis.com/auth/drive.readonly';

let tokenClient = null;
let accessToken = null;
let tokenExpiry = 0;

/**
 * Initialize the Google Identity Services token client.
 * Must be called after the GIS script has loaded.
 */
export function initGoogleAuth() {
  return new Promise((resolve, reject) => {
    if (!window.google?.accounts?.oauth2) {
      reject(new Error('Google Identity Services not loaded. Check index.html.'));
      return;
    }
    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: () => {}, // overridden per-request
    });
    resolve();
  });
}

/**
 * Request an access token (prompts Google sign-in if needed).
 * Returns the access token string.
 */
export function requestAccessToken() {
  return new Promise((resolve, reject) => {
    // Return cached token if still valid (with 60s buffer)
    if (accessToken && Date.now() < tokenExpiry - 60000) {
      resolve(accessToken);
      return;
    }

    if (!tokenClient) {
      reject(new Error('Google auth not initialized. Call initGoogleAuth() first.'));
      return;
    }

    tokenClient.callback = async (response) => {
      if (response.error) {
        reject(new Error(`Google auth error: ${response.error}`));
        return;
      }
      accessToken = response.access_token;
      // GIS tokens last 3600s by default
      tokenExpiry = Date.now() + (response.expires_in || 3600) * 1000;

      // Verify granted scopes include drive.readonly
      try {
        const info = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${accessToken}`);
        const tokenInfo = await info.json();
        console.log('[GoogleAuth] Granted scopes:', tokenInfo.scope);
        if (!tokenInfo.scope?.includes('drive.readonly')) {
          console.warn('[GoogleAuth] drive.readonly scope NOT granted — Drive scan will fail');
        }
      } catch (e) {
        console.warn('[GoogleAuth] Could not verify token scopes:', e);
      }

      resolve(accessToken);
    };

    tokenClient.error_callback = (err) => {
      reject(new Error(`Google sign-in failed: ${err.type || 'unknown'}`));
    };

    // Force consent prompt so user grants ALL scopes (including drive.readonly)
    // Without this, Google reuses a previous grant that may only have spreadsheets scope
    tokenClient.requestAccessToken({ prompt: 'consent' });
  });
}

/**
 * Make an authenticated fetch to a Google API endpoint.
 */
export async function googleFetch(url) {
  const token = await requestAccessToken();
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google API error (${res.status}): ${text}`);
  }
  return res.json();
}

/**
 * Check if user is currently signed in with a valid token.
 */
export function isSignedIn() {
  return accessToken && Date.now() < tokenExpiry - 60000;
}

/**
 * Revoke the current token (sign out).
 */
export function signOut() {
  if (accessToken) {
    window.google.accounts.oauth2.revoke(accessToken);
    accessToken = null;
    tokenExpiry = 0;
  }
}
