import { setProviderConnection } from '../storage/storage';

/** Initiate Google OAuth flow via chrome.identity and store the token */
export async function connectGemini(): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive: true }, async (token) => {
      if (chrome.runtime.lastError || !token) {
        reject(new Error(chrome.runtime.lastError?.message ?? 'OAuth failed'));
        return;
      }

      // Google OAuth tokens typically expire in 1 hour
      const expiresAt = Date.now() + 60 * 60 * 1000;

      await setProviderConnection('gemini', {
        connected: true,
        token,
        expiresAt,
      });

      resolve();
    });
  });
}

/** Remove the cached OAuth token and mark as disconnected */
export async function disconnectGemini(): Promise<void> {
  return new Promise((resolve) => {
    chrome.identity.getAuthToken({ interactive: false }, (token) => {
      if (token) {
        chrome.identity.removeCachedAuthToken({ token }, async () => {
          await setProviderConnection('gemini', { connected: false });
          resolve();
        });
      } else {
        setProviderConnection('gemini', { connected: false }).then(resolve);
      }
    });
  });
}

/** Refresh an expired Gemini token */
export async function refreshGeminiToken(): Promise<string | null> {
  return new Promise((resolve) => {
    // Remove any cached invalid token first
    chrome.identity.getAuthToken({ interactive: false }, (oldToken) => {
      if (oldToken) {
        chrome.identity.removeCachedAuthToken({ token: oldToken }, () => {
          // Now get a fresh token non-interactively
          chrome.identity.getAuthToken({ interactive: false }, async (newToken) => {
            if (newToken) {
              await setProviderConnection('gemini', {
                connected: true,
                token: newToken,
                expiresAt: Date.now() + 60 * 60 * 1000,
              });
              resolve(newToken);
            } else {
              resolve(null);
            }
          });
        });
      } else {
        resolve(null);
      }
    });
  });
}
