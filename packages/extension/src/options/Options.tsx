import React, { useEffect, useState } from 'react';
import type { Provider, StorageSchema } from '@clarify/shared';

const PROVIDER_MODELS: Record<Provider, Array<{ value: string; label: string }>> = {
  gemini: [
    { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash (default)' },
    { value: 'gemini-2.0-flash-lite', label: 'Gemini 2.0 Flash Lite (faster)' },
    { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
  ],
  openai: [
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini (default)' },
    { value: 'gpt-4o', label: 'GPT-4o' },
    { value: 'o3-mini', label: 'o3 Mini (reasoning)' },
  ],
  claude: [
    { value: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku (default)' },
    { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
    { value: 'claude-3-7-sonnet-20250219', label: 'Claude 3.7 Sonnet (latest)' },
  ],
};

const PROVIDERS: Array<{ key: Provider; label: string; icon: string; description: string }> = [
  {
    key: 'gemini',
    label: 'Google Gemini',
    icon: '✦',
    description: 'API key from Google AI Studio (aistudio.google.com/apikey).',
  },
  {
    key: 'openai',
    label: 'ChatGPT (OpenAI)',
    icon: '⬡',
    description:
      'API key from platform.openai.com/api-keys — separate from your ChatGPT subscription.',
  },
  {
    key: 'claude',
    label: 'Claude (Anthropic)',
    icon: '◈',
    description:
      'API key from console.anthropic.com/settings/keys — separate from your Claude subscription.',
  },
];

export function Options() {
  const [storage, setStorage] = useState<StorageSchema | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [connecting, setConnecting] = useState<Provider | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStorage();
  }, []);

  async function loadStorage() {
    const result = (await chrome.runtime.sendMessage({ type: 'GET_STORAGE' })) as StorageSchema;
    setStorage(result);
    setCustomPrompt(result.customSystemPrompt ?? '');
  }

  async function handleConnect(provider: Provider) {
    setConnecting(provider);
    setError(null);
    try {
      await chrome.runtime.sendMessage({ type: 'CONNECT_PROVIDER', payload: { provider } });
      await loadStorage();
    } catch (err) {
      setError(`Failed to connect ${provider}: ${String(err)}`);
    } finally {
      setConnecting(null);
    }
  }

  async function handleDisconnect(provider: Provider) {
    setConnecting(provider);
    try {
      await chrome.runtime.sendMessage({ type: 'DISCONNECT_PROVIDER', payload: { provider } });
      await loadStorage();
    } catch (err) {
      setError(`Failed to disconnect: ${String(err)}`);
    } finally {
      setConnecting(null);
    }
  }

  async function handleSetDefault(provider: Provider) {
    await chrome.storage.sync.set({ activeProvider: provider });
    setStorage((s) => (s ? { ...s, activeProvider: provider } : s));
  }

  async function handleSetModel(provider: Provider, model: string) {
    const current = storage![provider];
    await chrome.storage.sync.set({ [provider]: { ...current, model } });
    setStorage((s) => (s ? { ...s, [provider]: { ...s[provider], model } } : s));
  }

  async function handleSavePrompt() {
    await chrome.storage.sync.set({ customSystemPrompt: customPrompt || undefined });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (!storage) return <div className="options-loading">Loading settings...</div>;

  return (
    <div className="options-page">
      <header className="options-header">
        <h1>🤖 Clarify Settings</h1>
        <p>Manage your AI connections and preferences</p>
      </header>

      <main className="options-main">
        {/* Connected Accounts */}
        <section className="options-section">
          <h2>Connected Accounts</h2>
          <div className="provider-cards">
            {PROVIDERS.map(({ key, label, icon, description }) => {
              const conn = storage[key];
              const isConnecting = connecting === key;
              const isDefault = storage.activeProvider === key;
              return (
                <div
                  key={key}
                  className={`provider-card-full ${conn.connected ? 'connected' : ''}`}
                >
                  <div className="provider-card-header">
                    <div className="provider-card-info">
                      <span className="provider-icon-lg">{icon}</span>
                      <div>
                        <div className="provider-name-lg">{label}</div>
                        <div className="provider-desc">{description}</div>
                      </div>
                    </div>
                    <div className="provider-card-actions">
                      {conn.connected && (
                        <button
                          className={`default-btn ${isDefault ? 'is-default' : ''}`}
                          onClick={() => handleSetDefault(key)}
                          disabled={isDefault}
                        >
                          {isDefault ? '✓ Default' : 'Set Default'}
                        </button>
                      )}
                      <button
                        className={`connect-btn ${conn.connected ? 'disconnect' : 'connect'}`}
                        onClick={() =>
                          conn.connected ? handleDisconnect(key) : handleConnect(key)
                        }
                        disabled={isConnecting}
                      >
                        {isConnecting ? 'Working...' : conn.connected ? 'Disconnect' : 'Connect →'}
                      </button>
                    </div>
                  </div>
                  {conn.connected && (
                    <div className="connected-status">
                      <span className="status-dot" />
                      Connected{isDefault ? ' · Active' : ''}
                    </div>
                  )}
                  {conn.connected && (
                    <div className="model-selector">
                      <label className="model-label" htmlFor={`model-${key}`}>
                        Model
                      </label>
                      <select
                        id={`model-${key}`}
                        className="model-select"
                        value={conn.model ?? PROVIDER_MODELS[key][0].value}
                        onChange={(e) => handleSetModel(key, e.target.value)}
                      >
                        {PROVIDER_MODELS[key].map(({ value, label }) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Custom Prompt */}
        <section className="options-section">
          <h2>Custom System Prompt</h2>
          <p className="section-desc">
            Override the default instructions given to the AI. Leave blank to use the default.
          </p>
          <textarea
            className="prompt-textarea"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="e.g. You are a helpful tutor. Always explain things simply and use examples."
            rows={4}
          />
          <div className="prompt-actions">
            <button className="save-btn" onClick={handleSavePrompt}>
              {saved ? '✓ Saved' : 'Save Prompt'}
            </button>
            {customPrompt && (
              <button className="clear-btn" onClick={() => setCustomPrompt('')}>
                Clear
              </button>
            )}
          </div>
        </section>

        {error && <div className="options-error">{error}</div>}

        {/* Privacy & Security */}
        <section className="options-section privacy">
          <h2>Privacy &amp; Security</h2>
          <p>
            🔒 Your session tokens are encrypted with <code>AES-256-GCM</code> before being stored
            and never leave your device — kept in <code>chrome.storage.local</code> only, never
            synced to Google. Non-sensitive settings (active provider, selected model) use{' '}
            <code>chrome.storage.sync</code> for convenience. Nothing is ever sent to Clarify
            servers. AI requests go directly from your browser to the AI provider&apos;s servers.
          </p>
        </section>

        {/* Disclaimer */}
        <section className="options-section disclaimer">
          <h2>Terms &amp; Disclaimer</h2>
          <div className="disclaimer-body">
            <p>
              Clarify is an independent browser extension and is{' '}
              <strong>not affiliated with, endorsed by, or sponsored by</strong> Google, OpenAI, or
              Anthropic. By using this extension you agree to the following:
            </p>
            <ul className="disclaimer-list">
              <li>
                <strong>Use at your own risk.</strong> This extension is provided &ldquo;as
                is&rdquo;, without warranty of any kind. The developer is not liable for any
                damages, data loss, or consequences arising from your use of this extension or any
                AI-generated content.
              </li>
              <li>
                <strong>AI responses may be inaccurate.</strong> AI models can produce incorrect,
                incomplete, or outdated information. Always verify important results with
                authoritative sources before acting on them.
              </li>
              <li>
                <strong>Third-party services apply.</strong> Your queries are processed by the AI
                provider you connect (Google Gemini, OpenAI, or Anthropic Claude). Their respective{' '}
                <em>Terms of Service</em> and <em>Privacy Policies</em> govern how your data is
                handled on their end.
              </li>
              <li>
                <strong>Responsible use.</strong> You are solely responsible for the content you
                submit and for complying with applicable laws and the terms of each AI provider.
              </li>
            </ul>
            <p className="disclaimer-trust">
              We built Clarify to be transparent and privacy-first. If you ever have questions or
              concerns, please reach out — your trust matters to us.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
