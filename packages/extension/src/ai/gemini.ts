import type { ChatMessage } from '@contextai/shared';

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';
export const DEFAULT_MODEL = 'gemini-1.5-flash';

interface GeminiPart {
  text?: string;
  fileData?: { mimeType: string; fileUri: string };
}

interface GeminiContent {
  role: 'user' | 'model';
  parts: GeminiPart[];
}

export async function chatGemini(
  messages: ChatMessage[],
  token: string,
  model = DEFAULT_MODEL,
  signal?: AbortSignal
): Promise<string> {
  const systemMsg = messages.find((m) => m.role === 'system');

  const contents: GeminiContent[] = messages
    .filter((m) => m.role !== 'system')
    .map((m): GeminiContent => {
      const parts: GeminiPart[] = [];
      if (m.mediaUrl && m.contextType === 'image') {
        parts.push({ fileData: { mimeType: 'image/jpeg', fileUri: m.mediaUrl } });
      }
      if (m.content) parts.push({ text: m.content });
      return { role: m.role === 'assistant' ? 'model' : 'user', parts };
    });

  const response = await fetch(`${GEMINI_API_BASE}/models/${model}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    signal,
    body: JSON.stringify({
      system_instruction: systemMsg ? { parts: [{ text: systemMsg.content }] } : undefined,
      contents,
      generationConfig: { temperature: 0.2, maxOutputTokens: 1024 },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Gemini error (${response.status}): ${text}`);
  }

  const data = (await response.json()) as {
    candidates: Array<{ content: { parts: Array<{ text: string }> } }>;
  };
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '(No response)';
}
