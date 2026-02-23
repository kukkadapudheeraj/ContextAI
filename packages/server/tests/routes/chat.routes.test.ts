import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';
import { ProviderFactory } from '../../src/services/provider.factory';

// Only emit log output when the developer explicitly requests it (VERBOSE=true pnpm test).
// This keeps normal CI / watch-mode output clean and never affects extension users —
// test files are never bundled into the extension build.
const log = process.env['VERBOSE'] === 'true'
  ? (...args: unknown[]) => console.log(...args) // eslint-disable-line no-console
  : () => undefined;

// Create a single app instance shared across all tests in this suite
const app = createApp();

describe('POST /api/chat', () => {
  // Reset any mocks after each test to prevent state leaking between cases
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // Auth middleware must reject requests that omit the token field
  it('returns 401 when token is missing', async () => {
    const body = { provider: 'gemini', messages: [{ role: 'user', content: 'Hello' }] };
    log('[test] POST /api/chat — no token:', body);

    const res = await request(app).post('/api/chat').send(body);
    log('[test] response:', res.status, res.body);

    expect(res.status).toBe(401);
    expect(res.body.error).toContain('token');
  });

  // Auth middleware must reject requests that omit the provider field
  it('returns 400 when provider is missing', async () => {
    const body = { messages: [{ role: 'user', content: 'Hello' }], token: 'test-token' };
    log('[test] POST /api/chat — no provider:', body);

    const res = await request(app).post('/api/chat').send(body);
    log('[test] response:', res.status, res.body);

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('provider');
  });

  // Controller must reject a conversation with no messages — nothing to send to the AI
  it('returns 400 when messages is empty', async () => {
    const body = { provider: 'gemini', messages: [], token: 'test-token' };
    log('[test] POST /api/chat — empty messages:', body);

    const res = await request(app).post('/api/chat').send(body);
    log('[test] response:', res.status, res.body);

    expect(res.status).toBe(400);
  });

  // Controller must reject unknown provider names before attempting any AI call
  it('returns 400 for invalid provider', async () => {
    const body = {
      provider: 'invalid-provider',
      messages: [{ role: 'user', content: 'Hello' }],
      token: 'test-token',
    };
    log('[test] POST /api/chat — invalid provider:', body);

    const res = await request(app).post('/api/chat').send(body);
    log('[test] response:', res.status, res.body);

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('invalid-provider');
  });

  // Happy path: mock the provider to return a response and verify the answer is forwarded
  it('returns 200 with answer when provider succeeds', async () => {
    // Stub out the real AI call so the test stays fast and offline
    const mockProvider = { chat: vi.fn().mockResolvedValue('Hello from AI!'), name: 'gemini' };
    vi.spyOn(ProviderFactory, 'getProvider').mockReturnValue(mockProvider as never);
    vi.spyOn(ProviderFactory, 'isValidProvider').mockReturnValue(true);

    const body = { provider: 'gemini', messages: [{ role: 'user', content: 'Hello' }], token: 'valid-token' };
    log('[test] POST /api/chat — valid request:', body);

    const res = await request(app).post('/api/chat').send(body);
    log('[test] response:', res.status, res.body);
    log('[test] provider.chat call count:', mockProvider.chat.mock.calls.length);

    expect(res.status).toBe(200);
    expect(res.body.answer).toBe('Hello from AI!');
    expect(mockProvider.chat).toHaveBeenCalledOnce();
  });

  // Error path: a provider failure must bubble through the error middleware as a 500
  it('returns 500 when provider throws an error', async () => {
    // Simulate a downstream AI API failure (e.g. network error, quota exceeded)
    const mockProvider = {
      chat: vi.fn().mockRejectedValue(new Error('API error')),
      name: 'gemini',
    };
    vi.spyOn(ProviderFactory, 'getProvider').mockReturnValue(mockProvider as never);
    vi.spyOn(ProviderFactory, 'isValidProvider').mockReturnValue(true);

    const body = { provider: 'gemini', messages: [{ role: 'user', content: 'Hello' }], token: 'valid-token' };
    log('[test] POST /api/chat — provider will throw:', body);

    const res = await request(app).post('/api/chat').send(body);
    log('[test] response:', res.status, res.body);

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('API error');
  });
});
