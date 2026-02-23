import type { ChatMessage } from '@contextai/shared';
import { BaseProvider } from './base.provider';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const TEXT_MODEL = 'gpt-4o-mini';
const VISION_MODEL = 'gpt-4o'; // gpt-4o supports vision

type OpenAIContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string; detail?: 'auto' | 'low' | 'high' } };

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | OpenAIContentPart[];
}

export class OpenAIProvider extends BaseProvider {
  readonly name = 'openai';

  async chat(messages: ChatMessage[], token: string): Promise<string> {
    const prepared = this.ensureSystemPrompt(messages);
    const hasMedia = this.hasMediaContent(prepared);
    const model = hasMedia ? VISION_MODEL : TEXT_MODEL;

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

    const requestBody = {
      model,
      messages: openAIMessages,
      temperature: 0.2,
      max_tokens: 1024,
    };

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenAI API error (${response.status}): ${errText}`);
    }

    const data = await response.json() as {
      choices: Array<{ message: { content: string } }>;
    };

    return data.choices?.[0]?.message?.content?.trim() ?? '(No response)';
  }
}
