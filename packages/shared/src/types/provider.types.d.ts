export type Provider = 'gemini' | 'openai' | 'claude';
export type ContextType = 'text' | 'image' | 'video';
export type Action = 'explain' | 'simplify' | 'summarize' | 'translate';
export type MessageRole = 'user' | 'assistant' | 'system';
/**
 * A single turn in the chat conversation.
 * The full array is sent to the server with every request (stateless server).
 */
export interface ChatMessage {
  role: MessageRole;
  /** Text content of the message */
  content: string;
  /** Set only on the first user message to indicate what kind of content was selected */
  contextType?: ContextType;
  /** Image URL or video URL — set when contextType is 'image' or 'video' */
  mediaUrl?: string;
}
export interface ProviderConnection {
  connected: boolean;
  /** OAuth access token (Gemini) or API key (OpenAI/Claude) */
  token?: string;
  /** Unix timestamp (ms) when the token expires — Gemini OAuth only */
  expiresAt?: number;
}
export interface StorageSchema {
  activeProvider: Provider;
  gemini: ProviderConnection;
  openai: ProviderConnection;
  claude: ProviderConnection;
  /** Overrides the default system prompt for all providers */
  customSystemPrompt?: string;
}
