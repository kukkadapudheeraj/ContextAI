import { setProviderConnection } from '../storage/storage';

/**
 * Connect to Gemini by storing the user's API key.
 * Get your free key at: https://aistudio.google.com/apikey
 * The key is encrypted with AES-256-GCM before being written to chrome.storage.local.
 */
export async function connectGemini(apiKey: string): Promise<void> {
  await setProviderConnection('gemini', { connected: true, token: apiKey });
}

export async function disconnectGemini(): Promise<void> {
  await setProviderConnection('gemini', { connected: false });
}
