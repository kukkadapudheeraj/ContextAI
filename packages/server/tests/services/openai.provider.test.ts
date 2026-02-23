import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OpenAIProvider } from '../../src/services/providers/openai.provider';
import type { ChatMessage } from '@contextai/shared';

const provider = new OpenAIProvider();

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('OpenAIProvider', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('has name "openai"', () => {
    expect(provider.name).toBe('openai');
  });

  it('calls OpenAI API and returns message content', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: '  The answer is 42  ' } }],
      }),
    });

    const messages: ChatMessage[] = [{ role: 'user', content: 'What is the answer?' }];
    const result = await provider.chat(messages, 'sk-test-token');

    expect(result).toBe('The answer is 42');
    const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('api.openai.com');
  });

  it('throws on API error', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 429,
      text: async () => 'Rate limited',
    });

    await expect(
      provider.chat([{ role: 'user', content: 'Hi' }], 'token')
    ).rejects.toThrow('OpenAI API error (429)');
  });

  it('uses gpt-4o model for image context', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'Image description' } }] }),
    });

    const messages: ChatMessage[] = [
      { role: 'user', content: 'Describe', contextType: 'image', mediaUrl: 'https://img.jpg' },
    ];
    await provider.chat(messages, 'token');

    const body = JSON.parse((mockFetch.mock.calls[0] as [string, RequestInit])[1].body as string);
    expect(body.model).toBe('gpt-4o');
  });
});
