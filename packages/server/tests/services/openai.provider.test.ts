import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OpenAIProvider } from '../../src/services/providers/openai.provider';
import type { ChatMessage } from '@contextai/shared';

const provider = new OpenAIProvider();

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

/** Helper: build a successful fetch response with the given content string */
function okResponse(content: string) {
  return {
    ok: true,
    json: async () => ({ choices: [{ message: { content } }] }),
  };
}

describe('OpenAIProvider', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('has name "openai"', () => {
    expect(provider.name).toBe('openai');
  });

  it('calls OpenAI API and returns answer + modelUsed', async () => {
    mockFetch.mockResolvedValue(okResponse('  The answer is 42  '));

    const messages: ChatMessage[] = [{ role: 'user', content: 'What is the answer?' }];
    const result = await provider.chat(messages, 'sk-test-token');

    expect(result.answer).toBe('The answer is 42');
    // Default (free tier) model when no model specified
    expect(result.modelUsed).toBe('gpt-4o-mini');
    expect(mockFetch).toHaveBeenCalledOnce();

    const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('api.openai.com');
  });

  it('throws on API error', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 429,
      text: async () => 'Rate limited',
    });

    await expect(provider.chat([{ role: 'user', content: 'Hi' }], 'token')).rejects.toThrow(
      'OpenAI API error (429)'
    );
  });

  it('uses caller-supplied model override and returns it as modelUsed', async () => {
    mockFetch.mockResolvedValue(okResponse('Vision result'));

    const messages: ChatMessage[] = [
      { role: 'user', content: 'Describe', contextType: 'image', mediaUrl: 'https://img.jpg' },
    ];
    const result = await provider.chat(messages, 'token', 'gpt-4o');

    const body = JSON.parse((mockFetch.mock.calls[0] as [string, RequestInit])[1].body as string);
    expect(body.model).toBe('gpt-4o');
    expect(result.modelUsed).toBe('gpt-4o');
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});
