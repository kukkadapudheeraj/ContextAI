import { setProviderConnection } from '../storage/storage';

/**
 * Connect to Claude by storing the user's API key.
 * Get your key at: https://console.anthropic.com/settings/keys
 * The key is encrypted with AES-256-GCM before being written to chrome.storage.local.
 */
export async function connectClaude(apiKey: string): Promise<void> {
  await setProviderConnection('claude', { connected: true, token: apiKey });
}

export async function disconnectClaude(): Promise<void> {
  await setProviderConnection('claude', { connected: false });
}
