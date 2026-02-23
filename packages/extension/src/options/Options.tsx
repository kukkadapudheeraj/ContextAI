import React, { useEffect, useState } from 'react';
import type { Provider, StorageSchema } from '@contextai/shared';

const PROVIDERS: Array<{ key: Provider; label: string; icon: string; description: string }> = [
  {
    key: 'gemini',
    label: 'Google Gemini',
    icon: '✦',
    description: 'Connects via Google OAuth. Requires a Google account with Gemini access.',
  },
  {
    key: 'openai',
    label: 'ChatGPT (OpenAI)',
    icon: '⬡',
    description: 'Detects your ChatGPT session. Make sure you are logged into chat.openai.com.',
  },
  {
    key: 'claude',
    label: 'Claude (Anthropic)',
    icon: '◈',
    description: 'Detects your Claude session. Make sure you are logged into claude.ai.',
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
    const result = await chrome.runtime.sendMessage({ type: 'GET_STORAGE' }) as StorageSchema;
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
    setStorage((s) => s ? { ...s, activeProvider: provider } : s);
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
        <h1>🤖 ContextAI Settings</h1>
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
                <div key={key} className={`provider-card-full ${conn.connected ? 'connected' : ''}`}>
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
                        onClick={() => conn.connected ? handleDisconnect(key) : handleConnect(key)}
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

        {/* Privacy Notice */}
        <section className="options-section privacy">
          <h2>Privacy</h2>
          <p>
            🔒 All credentials and settings are stored locally in your browser via{' '}
            <code>chrome.storage.sync</code>. Nothing is sent to ContextAI servers.
            AI requests go directly from your browser to the AI provider's servers.
          </p>
        </section>
      </main>
    </div>
  );
}
