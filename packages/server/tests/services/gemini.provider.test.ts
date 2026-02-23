import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GeminiProvider } from '../../src/services/providers/gemini.provider';
import type { ChatMessage } from '@contextai/shared';

const provider = new GeminiProvider();

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

/** Helper: build a successful Gemini fetch response */
function okResponse(text: string) {
  return {
    ok: true,
    json: async () => ({ candidates: [{ content: { parts: [{ text }] } }] }),
  };
}

describe('GeminiProvider', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('has name "gemini"', () => {
    expect(provider.name).toBe('gemini');
  });

  it('calls Gemini API and returns answer + modelUsed', async () => {
    mockFetch.mockResolvedValue(okResponse('  Hello world  '));

    const messages: ChatMessage[] = [{ role: 'user', content: 'Explain quantum computing' }];
    const result = await provider.chat(messages, 'test-token');

    expect(result.answer).toBe('Hello world');
    // Default (free tier) model when no model specified
    expect(result.modelUsed).toBe('gemini-1.5-flash');
    expect(mockFetch).toHaveBeenCalledOnce();

    const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('generativelanguage.googleapis.com');
    expect(options.headers).toMatchObject({ Authorization: 'Bearer test-token' });
  });

  it('throws on API error', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 401, text: async () => 'Unauthorized' });

    const messages: ChatMessage[] = [{ role: 'user', content: 'Hello' }];
    await expect(provider.chat(messages, 'bad-token')).rejects.toThrow('Gemini API error (401)');
  });

  it('handles image context type and uses default model', async () => {
    mockFetch.mockResolvedValue(okResponse('A cat sitting on a mat'));

    const messages: ChatMessage[] = [
      {
        role: 'user',
        content: 'Describe this image',
        contextType: 'image',
        mediaUrl: 'https://example.com/cat.jpg',
      },
    ];

    const result = await provider.chat(messages, 'test-token');
    expect(result.answer).toBe('A cat sitting on a mat');
    expect(result.modelUsed).toBe('gemini-1.5-flash');

    const body = JSON.parse((mockFetch.mock.calls[0] as [string, RequestInit])[1].body as string);
    const userContent = body.contents[0];
    expect(userContent.parts.some((p: { fileData?: unknown }) => p.fileData)).toBe(true);
  });

  it('uses caller-supplied model override and returns it as modelUsed', async () => {
    mockFetch.mockResolvedValue(okResponse('Pro answer'));

    const messages: ChatMessage[] = [{ role: 'user', content: 'Hello' }];
    const result = await provider.chat(messages, 'token', 'gemini-1.5-pro');

    const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('gemini-1.5-pro');
    expect(result.modelUsed).toBe('gemini-1.5-pro');
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});
