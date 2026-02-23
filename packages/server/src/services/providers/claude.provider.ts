import type { ChatMessage } from '@contextai/shared';
import { BaseProvider } from './base.provider';

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const TEXT_MODEL = 'claude-3-5-haiku-20251001';
const VISION_MODEL = 'claude-sonnet-4-6'; // Supports vision

type ClaudeContentBlock =
  | { type: 'text'; text: string }
  | { type: 'image'; source: { type: 'url'; url: string } };

interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string | ClaudeContentBlock[];
}

export class ClaudeProvider extends BaseProvider {
  readonly name = 'claude';

  async chat(messages: ChatMessage[], token: string): Promise<string> {
    const prepared = this.ensureSystemPrompt(messages);
    const hasMedia = this.hasMediaContent(prepared);
    const model = hasMedia ? VISION_MODEL : TEXT_MODEL;

    const systemMessage = prepared.find((m) => m.role === 'system');

    // Convert ChatMessage[] → Anthropic messages[]
    const claudeMessages: ClaudeMessage[] = prepared
      .filter((m) => m.role !== 'system')
      .map((m): ClaudeMessage => {
        if (m.mediaUrl && m.contextType === 'image') {
          const blocks: ClaudeContentBlock[] = [
            { type: 'image', source: { type: 'url', url: m.mediaUrl } },
          ];
          if (m.content) {
            blocks.push({ type: 'text', text: m.content });
          }
          return { role: m.role as 'user' | 'assistant', content: blocks };
        }
        return { role: m.role as 'user' | 'assistant', content: m.content };
      });

    const requestBody = {
      model,
      system: systemMessage?.content,
      messages: claudeMessages,
      max_tokens: 1024,
    };

    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': token,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Claude API error (${response.status}): ${errText}`);
    }

    const data = await response.json() as {
      content: Array<{ type: string; text: string }>;
    };

    return data.content?.find((b) => b.type === 'text')?.text?.trim() ?? '(No response)';
  }
}
