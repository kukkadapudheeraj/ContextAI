import type { ChatMessage } from '@contextai/shared';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
export const DEFAULT_MODEL = 'gpt-4o-mini';

type ContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string; detail: 'auto' } };

interface OAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | ContentPart[];
}

export async function chatOpenAI(
  messages: ChatMessage[],
  token: string,
  model = DEFAULT_MODEL,
  signal?: AbortSignal,
): Promise<string> {
  const systemMsg = messages.find((m) => m.role === 'system');

  const oaiMessages: OAIMessage[] = messages
    .filter((m) => m.role !== 'system')
    .map((m): OAIMessage => {
      if (m.mediaUrl && m.contextType === 'image') {
        const parts: ContentPart[] = [
          { type: 'image_url', image_url: { url: m.mediaUrl, detail: 'auto' } },
        ];
        if (m.content) parts.push({ type: 'text', text: m.content });
        return { role: m.role as 'user' | 'assistant', content: parts };
      }
      return { role: m.role as 'user' | 'assistant', content: m.content };
    });

  if (systemMsg) oaiMessages.unshift({ role: 'system', content: systemMsg.content });

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ model, messages: oaiMessages, temperature: 0.2, max_tokens: 1024 }),
    signal,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenAI error (${response.status}): ${text}`);
  }

  const data = await response.json() as { choices: Array<{ message: { content: string } }> };
  return data.choices?.[0]?.message?.content?.trim() ?? '(No response)';
}
