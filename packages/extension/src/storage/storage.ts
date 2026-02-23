import type { StorageSchema, Provider } from '@contextai/shared';

const DEFAULTS: StorageSchema = {
  activeProvider: 'gemini',
  gemini: { connected: false },
  openai: { connected: false },
  claude: { connected: false },
};

/** Load the full storage schema, merging with defaults */
export async function loadStorage(): Promise<StorageSchema> {
  const result = await chrome.storage.sync.get(DEFAULTS);
  return result as StorageSchema;
}

/** Save partial updates to storage */
export async function saveStorage(partial: Partial<StorageSchema>): Promise<void> {
  await chrome.storage.sync.set(partial);
}

/** Update a single provider's connection state */
export async function setProviderConnection(
  provider: Provider,
  connection: StorageSchema[Provider]
): Promise<void> {
  await chrome.storage.sync.set({ [provider]: connection });
}

/** Set the active provider */
export async function setActiveProvider(provider: Provider): Promise<void> {
  await chrome.storage.sync.set({ activeProvider: provider });
}

/** Get the token for a provider, or null if not connected */
export async function getProviderToken(provider: Provider): Promise<string | null> {
  const storage = await loadStorage();
  const conn = storage[provider];
  if (!conn.connected || !conn.token) return null;

  // Check expiry for Gemini OAuth tokens
  if (provider === 'gemini' && conn.expiresAt && Date.now() > conn.expiresAt) {
    return null; // Token expired
  }

  return conn.token;
}
