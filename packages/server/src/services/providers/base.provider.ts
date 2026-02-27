import type { ChatMessage, ContextType } from '@clarify/shared';
import { buildSystemPrompt } from '@clarify/shared';

/** Returned by every provider's chat() method. */
export interface ChatResult {
  /** The assistant's reply text. */
  answer: string;
  /**
   * The model that actually produced the response.
   * When no model is specified, the provider probes the best (paid) model first
   * and falls back to the free-tier model on access errors.  The extension
   * caches this value so subsequent requests skip the probe step.
   */
  modelUsed: string;
}

export abstract class BaseProvider {
  abstract readonly name: string;

  /**
   * Send a multi-turn conversation to the AI and return the answer plus which
   * model was used (for subscription-aware auto-detection and caching).
   *
   * @param messages Full conversation history (includes system prompt)
   * @param token    Auth token (OAuth access token or API key)
   * @param model    Optional model override — provider auto-detects when omitted
   */
  abstract chat(messages: ChatMessage[], token: string, model?: string): Promise<ChatResult>;

  /** Check if the first user message contains a media URL (image/video) */
  protected hasMediaContent(messages: ChatMessage[]): boolean {
    return messages.some((m) => m.role === 'user' && !!m.mediaUrl);
  }

  /** Get the media URL from the first user message that has one */
  protected getMediaUrl(messages: ChatMessage[]): string | undefined {
    return messages.find((m) => m.role === 'user' && m.mediaUrl)?.mediaUrl;
  }

  /** Get the context type from the first user message */
  protected getContextType(messages: ChatMessage[]): ContextType | undefined {
    return messages.find((m) => m.role === 'user' && m.contextType)?.contextType;
  }

  /**
   * Build or inject a system prompt into the messages array.
   * If no system message exists, prepend one.
   */
  protected ensureSystemPrompt(messages: ChatMessage[], customPrompt?: string): ChatMessage[] {
    if (messages[0]?.role === 'system') return messages;
    const contextType = this.getContextType(messages) ?? 'text';
    return [{ role: 'system', content: buildSystemPrompt(contextType, customPrompt) }, ...messages];
  }
}
