import { setProviderConnection } from '../storage/storage';

/**
 * Connect to OpenAI by storing the user's API key.
 * Get your key at: https://platform.openai.com/api-keys
 * The key is encrypted with AES-256-GCM before being written to chrome.storage.local.
 */
export async function connectOpenAI(apiKey: string): Promise<void> {
  await setProviderConnection('openai', { connected: true, token: apiKey });
}

export async function disconnectOpenAI(): Promise<void> {
  await setProviderConnection('openai', { connected: false });
}
