/**
 * AES-256-GCM token encryption utilities.
 *
 * A single device-bound key is generated on first use and stored as a JWK in
 * chrome.storage.local (never synced to Google).  All session tokens are
 * encrypted with that key before being written to local storage.
 *
 * Protection scope:
 *   ✓ Google Chrome Sync servers never see plaintext tokens
 *   ✓ Casual inspection of Chrome's LevelDB profile files reveals only
 *     ciphertext + a key that lives in the same local store
 *   ✗ An attacker with full access to the local machine can read both
 *     (this is inherent to any client-side encryption scheme)
 */

const KEY_RECORD = 'contextai_enc_key';
const ALGORITHM = { name: 'AES-GCM', length: 256 } as const;
const IV_BYTES = 12; // 96-bit IV — recommended for AES-GCM

// ── Key management ────────────────────────────────────────────────────────────

async function getOrCreateKey(): Promise<CryptoKey> {
  const stored = await chrome.storage.local.get(KEY_RECORD);

  if (stored[KEY_RECORD]) {
    // Re-import the persisted JWK
    return crypto.subtle.importKey(
      'jwk',
      stored[KEY_RECORD] as JsonWebKey,
      ALGORITHM,
      false, // non-extractable after import — key can only be used, not exported again
      ['encrypt', 'decrypt'],
    );
  }

  // First run: generate a new key, export it so it can be persisted, then re-import
  // as non-extractable for runtime use.
  const exportableKey = await crypto.subtle.generateKey(ALGORITHM, true, ['encrypt', 'decrypt']);
  const jwk = await crypto.subtle.exportKey('jwk', exportableKey);
  await chrome.storage.local.set({ [KEY_RECORD]: jwk });

  return crypto.subtle.importKey('jwk', jwk, ALGORITHM, false, ['encrypt', 'decrypt']);
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Encrypt a plaintext string.
 * Returns a base64-encoded string of the form: IV (12 bytes) || ciphertext.
 */
export async function encryptToken(plaintext: string): Promise<string> {
  const key = await getOrCreateKey();
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const encoded = new TextEncoder().encode(plaintext);

  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);

  // Prepend IV so it travels with the ciphertext
  const combined = new Uint8Array(IV_BYTES + ciphertext.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), IV_BYTES);

  // btoa works on byte strings; convert via charCodeAt
  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypt a base64 string produced by encryptToken.
 * Throws if the key or ciphertext is invalid.
 */
export async function decryptToken(ciphertext: string): Promise<string> {
  const key = await getOrCreateKey();
  const combined = Uint8Array.from(atob(ciphertext), (c) => c.charCodeAt(0));
  const iv = combined.slice(0, IV_BYTES);
  const ct = combined.slice(IV_BYTES);

  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
  return new TextDecoder().decode(decrypted);
}
