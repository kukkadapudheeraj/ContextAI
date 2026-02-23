import { setProviderConnection } from '../storage/storage';

const OPENAI_SESSION_COOKIE = '__Secure-next-auth.session-token';
const OPENAI_URL = 'https://chat.openai.com';
const LOGIN_URL = 'https://chat.openai.com/auth/login';

/**
 * Connect to OpenAI by:
 * 1. Checking if the user is already logged in (session cookie exists)
 * 2. If not, opening the login page and polling until they log in
 */
export async function connectOpenAI(): Promise<void> {
  // Check for existing session
  const existingToken = await getSessionToken();
  if (existingToken) {
    await setProviderConnection('openai', { connected: true, token: existingToken });
    return;
  }

  // Open login tab and wait for the user to log in
  const token = await openLoginAndWait();
  await setProviderConnection('openai', { connected: true, token });
}

export async function disconnectOpenAI(): Promise<void> {
  await setProviderConnection('openai', { connected: false });
}

async function getSessionToken(): Promise<string | null> {
  try {
    const cookie = await chrome.cookies.get({
      url: OPENAI_URL,
      name: OPENAI_SESSION_COOKIE,
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
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('OpenAI login timed out after 5 minutes.'));
    }, 5 * 60 * 1000);

    // Poll every 2 seconds for the session cookie
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
