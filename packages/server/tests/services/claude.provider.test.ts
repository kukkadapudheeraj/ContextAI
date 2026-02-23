import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ClaudeProvider } from '../../src/services/providers/claude.provider';
import type { ChatMessage } from '@contextai/shared';

const provider = new ClaudeProvider();

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('ClaudeProvider', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('has name "claude"', () => {
    expect(provider.name).toBe('claude');
  });

  it('calls Anthropic API and returns text content', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        content: [{ type: 'text', text: '  The sky is blue  ' }],
      }),
    });

    const messages: ChatMessage[] = [{ role: 'user', content: 'Why is the sky blue?' }];
    const result = await provider.chat(messages, 'sk-ant-test');

    expect(result).toBe('The sky is blue');
    const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('api.anthropic.com');
    expect((options.headers as Record<string, string>)['x-api-key']).toBe('sk-ant-test');
  });

  it('throws on API error', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => 'Bad request',
    });

    await expect(
      provider.chat([{ role: 'user', content: 'Hi' }], 'bad-token')
    ).rejects.toThrow('Claude API error (400)');
  });

  it('sends system prompt separately in request body', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ content: [{ type: 'text', text: 'OK' }] }),
    });

    const messages: ChatMessage[] = [
      { role: 'system', content: 'You are a pirate.' },
      { role: 'user', content: 'Hello!' },
    ];
    await provider.chat(messages, 'token');

    const body = JSON.parse((mockFetch.mock.calls[0] as [string, RequestInit])[1].body as string);
    expect(body.system).toBe('You are a pirate.');
    // System message should NOT appear in the messages array
    expect(body.messages.every((m: { role: string }) => m.role !== 'system')).toBe(true);
  });
});
