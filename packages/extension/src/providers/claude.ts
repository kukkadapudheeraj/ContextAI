import { setProviderConnection } from '../storage/storage';

const CLAUDE_SESSION_COOKIE = 'sessionKey';
const CLAUDE_URL = 'https://claude.ai';
const LOGIN_URL = 'https://claude.ai/login';

/**
 * Connect to Claude by detecting the session cookie from claude.ai.
 * If not logged in, opens the login page and polls until the user signs in.
 */
export async function connectClaude(): Promise<void> {
  const existingToken = await getSessionToken();
  if (existingToken) {
    await setProviderConnection('claude', { connected: true, token: existingToken });
    return;
  }

  const token = await openLoginAndWait();
  await setProviderConnection('claude', { connected: true, token });
}

export async function disconnectClaude(): Promise<void> {
  await setProviderConnection('claude', { connected: false });
}

async function getSessionToken(): Promise<string | null> {
  try {
    const cookie = await chrome.cookies.get({
      url: CLAUDE_URL,
      name: CLAUDE_SESSION_COOKIE,
    });
    return cookie?.value ?? null;
  } catch {
    return null;
  }
}

async function openLoginAndWait(): Promise<string> {
  const tab = await chrome.tabs.create({ url: LOGIN_URL });
  const tabId = tab.id!;

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => {
        cleanup();
        reject(new Error('Claude login timed out after 5 minutes.'));
      },
      5 * 60 * 1000
    );

    const interval = setInterval(async () => {
      const token = await getSessionToken();
      if (token) {
        cleanup();
        chrome.tabs.remove(tabId).catch(() => undefined);
        resolve(token);
      }
    }, 2000);

    function cleanup() {
      clearTimeout(timeout);
      clearInterval(interval);
    }
  });
}
