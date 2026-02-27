import type { ChatMessage } from '@contextai/shared';

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
export const DEFAULT_MODEL = 'claude-3-5-haiku-20241022';

type ContentBlock =
  | { type: 'text'; text: string }
  | { type: 'image'; source: { type: 'url'; url: string } };

interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string | ContentBlock[];
}

export async function chatClaude(
  messages: ChatMessage[],
  token: string,
  model = DEFAULT_MODEL,
  signal?: AbortSignal
): Promise<string> {
  const systemMsg = messages.find((m) => m.role === 'system');

  const claudeMessages: ClaudeMessage[] = messages
    .filter((m) => m.role !== 'system')
    .map((m): ClaudeMessage => {
      if (m.mediaUrl && m.contextType === 'image') {
        const blocks: ContentBlock[] = [
          { type: 'image', source: { type: 'url', url: m.mediaUrl } },
        ];
        if (m.content) blocks.push({ type: 'text', text: m.content });
        return { role: m.role as 'user' | 'assistant', content: blocks };
      }
      return { role: m.role as 'user' | 'assistant', content: m.content };
    });

  const response = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': token,
      'anthropic-version': '2023-06-01',
    },
    signal,
    body: JSON.stringify({
      model,
      system: systemMsg?.content,
      messages: claudeMessages,
      max_tokens: 1024,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Claude error (${response.status}): ${text}`);
  }

  const data = (await response.json()) as { content: Array<{ type: string; text: string }> };
  return data.content?.find((b) => b.type === 'text')?.text?.trim() ?? '(No response)';
}
