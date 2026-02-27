import type { ChatMessage } from '@clarify/shared';
import { BaseProvider, type ChatResult } from './base.provider';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

/** Default model for all users — no subscription required */
const DEFAULT_MODEL = 'gpt-4o-mini';

type OpenAIContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string; detail?: 'auto' | 'low' | 'high' } };

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | OpenAIContentPart[];
}

export class OpenAIProvider extends BaseProvider {
  readonly name = 'openai';

  async chat(messages: ChatMessage[], token: string, model?: string): Promise<ChatResult> {
    const prepared = this.ensureSystemPrompt(messages);
    const effectiveModel = model ?? DEFAULT_MODEL;

    // Convert ChatMessage[] → OpenAI messages[]
    const openAIMessages: OpenAIMessage[] = prepared
      .filter((m) => m.role !== 'system')
      .map((m): OpenAIMessage => {
        if (m.mediaUrl && m.contextType === 'image') {
          const parts: OpenAIContentPart[] = [
            { type: 'image_url', image_url: { url: m.mediaUrl, detail: 'auto' } },
          ];
          if (m.content) {
            parts.push({ type: 'text', text: m.content });
          }
          return { role: m.role as 'user' | 'assistant', content: parts };
        }
        return { role: m.role as 'user' | 'assistant', content: m.content };
      });

    // Prepend system message
    const systemMessage = prepared.find((m) => m.role === 'system');
    if (systemMessage) {
      openAIMessages.unshift({ role: 'system', content: systemMessage.content });
    }

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        model: effectiveModel,
        messages: openAIMessages,
        temperature: 0.2,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenAI API error (${response.status}): ${errText}`);
    }

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
    };

    return {
      answer: data.choices?.[0]?.message?.content?.trim() ?? '(No response)',
      modelUsed: effectiveModel,
    };
  }
}
