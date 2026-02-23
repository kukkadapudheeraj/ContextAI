import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GeminiProvider } from '../../src/services/providers/gemini.provider';
import type { ChatMessage } from '@contextai/shared';

const provider = new GeminiProvider();

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('GeminiProvider', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('has name "gemini"', () => {
    expect(provider.name).toBe('gemini');
  });

  it('calls Gemini API and returns trimmed text', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: '  Hello world  ' }] } }],
      }),
    });

    const messages: ChatMessage[] = [{ role: 'user', content: 'Explain quantum computing' }];
    const result = await provider.chat(messages, 'test-token');

    expect(result).toBe('Hello world');
    expect(mockFetch).toHaveBeenCalledOnce();

    const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('generativelanguage.googleapis.com');
    expect(options.headers).toMatchObject({ Authorization: 'Bearer test-token' });
  });

  it('throws when Gemini API returns an error', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => 'Unauthorized',
    });

    const messages: ChatMessage[] = [{ role: 'user', content: 'Hello' }];
    await expect(provider.chat(messages, 'bad-token')).rejects.toThrow('Gemini API error (401)');
  });

  it('handles image context type', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: 'A cat sitting on a mat' }] } }],
      }),
    });

    const messages: ChatMessage[] = [
      {
        role: 'user',
        content: 'Describe this image',
        contextType: 'image',
        mediaUrl: 'https://example.com/cat.jpg',
      },
    ];

    const result = await provider.chat(messages, 'test-token');
    expect(result).toBe('A cat sitting on a mat');

    const body = JSON.parse((mockFetch.mock.calls[0] as [string, RequestInit])[1].body as string);
    const userContent = body.contents[0];
    expect(userContent.parts.some((p: { fileData?: unknown }) => p.fileData)).toBe(true);
  });
});
