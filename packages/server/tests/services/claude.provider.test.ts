import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ClaudeProvider } from '../../src/services/providers/claude.provider';
import type { ChatMessage } from '@contextai/shared';

const provider = new ClaudeProvider();

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

/** Helper: build a successful Anthropic fetch response */
function okResponse(text: string) {
  return {
    ok: true,
    json: async () => ({ content: [{ type: 'text', text }] }),
  };
}

describe('ClaudeProvider', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('has name "claude"', () => {
    expect(provider.name).toBe('claude');
  });

  it('calls Anthropic API and returns answer + modelUsed', async () => {
    mockFetch.mockResolvedValue(okResponse('  The sky is blue  '));

    const messages: ChatMessage[] = [{ role: 'user', content: 'Why is the sky blue?' }];
    const result = await provider.chat(messages, 'sk-ant-test');

    expect(result.answer).toBe('The sky is blue');
    // Default (free tier) model when no model specified
    expect(result.modelUsed).toBe('claude-3-5-haiku-20251001');
    const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('api.anthropic.com');
    expect((options.headers as Record<string, string>)['x-api-key']).toBe('sk-ant-test');
  });

  it('throws on API error', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 400, text: async () => 'Bad request' });

    await expect(provider.chat([{ role: 'user', content: 'Hi' }], 'bad-token')).rejects.toThrow(
      'Claude API error (400)'
    );
  });

  it('sends system prompt separately and uses default model', async () => {
    mockFetch.mockResolvedValue(okResponse('OK'));

    const messages: ChatMessage[] = [
      { role: 'system', content: 'You are a pirate.' },
      { role: 'user', content: 'Hello!' },
    ];
    const result = await provider.chat(messages, 'token');

    expect(result.modelUsed).toBe('claude-3-5-haiku-20251001');
    const body = JSON.parse((mockFetch.mock.calls[0] as [string, RequestInit])[1].body as string);
    expect(body.system).toBe('You are a pirate.');
    expect(body.messages.every((m: { role: string }) => m.role !== 'system')).toBe(true);
  });

  it('uses caller-supplied model override and returns it as modelUsed', async () => {
    mockFetch.mockResolvedValue(okResponse('Sonnet answer'));

    const messages: ChatMessage[] = [{ role: 'user', content: 'Hello' }];
    const result = await provider.chat(messages, 'token', 'claude-3-5-sonnet-20241022');

    const body = JSON.parse((mockFetch.mock.calls[0] as [string, RequestInit])[1].body as string);
    expect(body.model).toBe('claude-3-5-sonnet-20241022');
    expect(result.modelUsed).toBe('claude-3-5-sonnet-20241022');
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});
