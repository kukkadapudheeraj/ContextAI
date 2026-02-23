import type { ChatMessage, ContextType } from '@contextai/shared';
import { buildSystemPrompt } from '@contextai/shared';

export abstract class BaseProvider {
  abstract readonly name: string;

  /**
   * Send a multi-turn conversation to the AI and return the assistant's response.
   * @param messages Full conversation history (includes system prompt)
   * @param token    Auth token (OAuth access token or API key)
   */
  abstract chat(messages: ChatMessage[], token: string): Promise<string>;

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
