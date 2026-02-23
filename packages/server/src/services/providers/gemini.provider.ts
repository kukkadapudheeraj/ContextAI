import type { ChatMessage } from '@contextai/shared';
import { BaseProvider } from './base.provider';

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const TEXT_MODEL = 'gemini-1.5-flash';
const VISION_MODEL = 'gemini-1.5-flash';

interface GeminiPart {
  text?: string;
  inlineData?: { mimeType: string; data: string };
  fileData?: { mimeType: string; fileUri: string };
}

interface GeminiContent {
  role: 'user' | 'model';
  parts: GeminiPart[];
}

export class GeminiProvider extends BaseProvider {
  readonly name = 'gemini';

  async chat(messages: ChatMessage[], token: string): Promise<string> {
    const prepared = this.ensureSystemPrompt(messages);
    const hasMedia = this.hasMediaContent(prepared);
    const model = hasMedia ? VISION_MODEL : TEXT_MODEL;

    // Convert ChatMessage[] → Gemini contents[]
    const contents: GeminiContent[] = prepared
      .filter((m) => m.role !== 'system')
      .map((m): GeminiContent => {
        const parts: GeminiPart[] = [];

        if (m.mediaUrl && m.contextType === 'image') {
          // Pass image as a URL reference
          parts.push({ fileData: { mimeType: 'image/jpeg', fileUri: m.mediaUrl } });
        }

        if (m.content) {
          parts.push({ text: m.content });
        }

        return {
          role: m.role === 'assistant' ? 'model' : 'user',
          parts,
        };
      });

    // Extract system instruction from the system message
    const systemMessage = prepared.find((m) => m.role === 'system');

    const requestBody = {
      system_instruction: systemMessage
        ? { parts: [{ text: systemMessage.content }] }
        : undefined,
      contents,
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 1024,
      },
    };

    const response = await fetch(
      `${GEMINI_API_BASE}/models/${model}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API error (${response.status}): ${errText}`);
    }

    const data = await response.json() as {
      candidates: Array<{ content: { parts: Array<{ text: string }> } }>;
    };

    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '(No response)';
  }
}
