import type { StorageSchema, Provider } from '@contextai/shared';
import { encryptToken, decryptToken } from '../utils/crypto';

const DEFAULTS: StorageSchema = {
  activeProvider: 'gemini',
  gemini: { connected: false },
  openai: { connected: false },
  claude: { connected: false },
};

/** Returns the chrome.storage.local key for a provider's encrypted token */
function tokenKey(provider: Provider): string {
  return `contextai_token_${provider}`;
}

// ── Sync storage (non-sensitive settings) ────────────────────────────────────

/** Load the full storage schema, merging with defaults (no tokens — those live in local storage) */
export async function loadStorage(): Promise<StorageSchema> {
  const result = await chrome.storage.sync.get(DEFAULTS);
  return result as StorageSchema;
}

/** Save partial updates to sync storage */
export async function saveStorage(partial: Partial<StorageSchema>): Promise<void> {
  await chrome.storage.sync.set(partial);
}

/**
 * Update a single provider's connection state.
 *
 * If `connection.token` is present it is automatically routed to AES-GCM
 * encrypted local storage — it is NEVER written to chrome.storage.sync.
 * On disconnect, the encrypted token is removed from local storage.
 */
export async function setProviderConnection(
  provider: Provider,
  connection: StorageSchema[Provider],
): Promise<void> {
  if (connection.token) {
    // Encrypt and persist to local storage only
    await setProviderToken(provider, connection.token);
  }

  if (!connection.connected) {
    // On disconnect, remove the encrypted token
    await clearProviderToken(provider);
  }

  // Write everything except the token to sync storage
  const { token: _token, ...syncSafe } = connection;
  await chrome.storage.sync.set({ [provider]: syncSafe });
}

/** Set the active provider */
export async function setActiveProvider(provider: Provider): Promise<void> {
  await chrome.storage.sync.set({ activeProvider: provider });
}

// ── Encrypted local storage (tokens) ─────────────────────────────────────────

/**
 * Encrypt `plaintext` with AES-256-GCM and persist to chrome.storage.local.
 * The encryption key is device-bound and never leaves local storage.
 */
export async function setProviderToken(provider: Provider, plaintext: string): Promise<void> {
  const encrypted = await encryptToken(plaintext);
  await chrome.storage.local.set({ [tokenKey(provider)]: encrypted });
}

/**
 * Read and decrypt the session token for `provider`.
 * Returns null if the provider is not connected, the token is missing, or
 * the Gemini OAuth token has expired.
 */
export async function getProviderToken(provider: Provider): Promise<string | null> {
  // Connection state lives in sync storage
  const storage = await loadStorage();
  const conn = storage[provider];
  if (!conn.connected) return null;

  // Gemini OAuth tokens expire after ~1 hour
  if (provider === 'gemini' && conn.expiresAt && Date.now() > conn.expiresAt) {
    return null;
  }

  // Encrypted token lives in local storage
  const local = await chrome.storage.local.get(tokenKey(provider));
  const encrypted = local[tokenKey(provider)] as string | undefined;
  if (!encrypted) return null;

  try {
    return await decryptToken(encrypted);
  } catch {
    // Decryption failure (key rotated / storage corrupted) — treat as disconnected
    return null;
  }
}

/** Remove the encrypted token from local storage (called on provider disconnect) */
export async function clearProviderToken(provider: Provider): Promise<void> {
  await chrome.storage.local.remove(tokenKey(provider));
}
