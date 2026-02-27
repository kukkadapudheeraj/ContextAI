import React, { useEffect, useState } from 'react';
import type { Provider, StorageSchema } from '@clarify/shared';

const ONBOARDING_STEPS = [
  { icon: '🔑', text: 'Connect an AI provider below using your API key' },
  { icon: '🌐', text: 'Visit any webpage and right-click text, image, or video' },
  { icon: '💬', text: 'Select "Ask Clarify" to start chatting' },
];

const PROVIDERS: Array<{ key: Provider; label: string; icon: string; subtitle: string }> = [
  { key: 'gemini', label: 'Gemini', icon: '✦', subtitle: 'API key · aistudio.google.com' },
  { key: 'openai', label: 'ChatGPT', icon: '⬡', subtitle: 'API key · platform.openai.com' },
  { key: 'claude', label: 'Claude', icon: '◈', subtitle: 'API key · console.anthropic.com' },
];

const API_KEY_LINKS: Partial<Record<Provider, { placeholder: string; url: string; hint: string }>> =
  {
    gemini: {
      placeholder: 'AIza...',
      url: 'https://aistudio.google.com/apikey',
      hint: 'API key from Google AI Studio (aistudio.google.com/apikey)',
    },
    openai: {
      placeholder: 'sk-...',
      url: 'https://platform.openai.com/api-keys',
      hint: 'API key from platform.openai.com — separate from your ChatGPT subscription',
    },
    claude: {
      placeholder: 'sk-ant-...',
      url: 'https://console.anthropic.com/settings/keys',
      hint: 'API key from console.anthropic.com — separate from your Claude subscription',
    },
  };

export function Popup() {
  const [storage, setStorage] = useState<StorageSchema | null>(null);
  const [connecting, setConnecting] = useState<Provider | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [onboardingDismissed, setOnboardingDismissed] = useState(false);
  const [keyInputProvider, setKeyInputProvider] = useState<Provider | null>(null);
  const [keyInputValue, setKeyInputValue] = useState('');

  useEffect(() => {
    loadStorage();
  }, []);

  async function loadStorage() {
    const result = (await chrome.runtime.sendMessage({ type: 'GET_STORAGE' })) as StorageSchema;
    setStorage(result);
  }

  function startConnect(provider: Provider) {
    setKeyInputProvider(provider);
    setKeyInputValue('');
    setError(null);
  }

  async function handleConnect(provider: Provider, apiKey?: string) {
    setConnecting(provider);
    setError(null);
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'CONNECT_PROVIDER',
        payload: { provider, apiKey },
      });
      if (response?.error) {
        setError(`Failed to connect: ${response.error}`);
        return;
      }
      await loadStorage();
      setKeyInputProvider(null);
      setKeyInputValue('');
    } catch (err) {
      setError(`Failed to connect: ${String(err)}`);
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

  async function handleSetActive(provider: Provider) {
    await chrome.storage.sync.set({ activeProvider: provider });
    setStorage((s) => (s ? { ...s, activeProvider: provider } : s));
  }

  function openOptions() {
    chrome.runtime.openOptionsPage();
  }

  if (!storage) {
    return (
      <div className="popup">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  const isFirstRun = !PROVIDERS.some((p) => storage[p.key].connected);
  const showOnboarding = isFirstRun && !onboardingDismissed;

  return (
    <div className="popup">
      <header className="popup-header">
        <div className="popup-logo">✦ Clarify</div>
      </header>

      {/* First-run onboarding banner */}
      {showOnboarding && (
        <div className="onboarding-banner">
          <div className="onboarding-header">
            <span className="onboarding-title">Welcome! Get started in 3 steps</span>
            <button
              className="onboarding-dismiss"
              onClick={() => setOnboardingDismissed(true)}
              title="Dismiss"
            >
              ×
            </button>
          </div>
          <ol className="onboarding-steps">
            {ONBOARDING_STEPS.map((step, i) => (
              <li key={i} className="onboarding-step">
                <span className="onboarding-step-icon">{step.icon}</span>
                <span>{step.text}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Active Provider Selector */}
      <section className="section">
        <div className="section-label">Active AI</div>
        <div className="provider-tabs">
          {PROVIDERS.map(({ key, label }) => (
            <button
              key={key}
              className={`provider-tab ${storage.activeProvider === key ? 'active' : ''}`}
              onClick={() => handleSetActive(key)}
              disabled={!storage[key].connected}
              title={!storage[key].connected ? 'Connect first' : `Use ${label}`}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      {/* Provider Cards */}
      <section className="section">
        <div className="section-label">Connected Accounts</div>
        <div className="provider-list">
          {PROVIDERS.map(({ key, label, icon, subtitle }) => {
            const conn = storage[key];
            const isConnecting = connecting === key;
            const showingInput = keyInputProvider === key;
            const keyLink = API_KEY_LINKS[key];

            return (
              <div
                key={key}
                className={`provider-card ${conn.connected ? 'connected' : ''} ${showingInput ? 'expanded' : ''}`}
              >
                <div className="provider-row">
                  <div className="provider-info">
                    <span className="provider-icon">{icon}</span>
                    <div className="provider-name-group">
                      <span className="provider-name">{label}</span>
                      <span className="provider-subtitle">{subtitle}</span>
                    </div>
                    {conn.connected && <span className="connected-badge">✓</span>}
                  </div>
                  {conn.connected ? (
                    <button
                      className="action-btn disconnect"
                      onClick={() => handleDisconnect(key)}
                      disabled={isConnecting}
                    >
                      {isConnecting ? '...' : 'Disconnect'}
                    </button>
                  ) : (
                    <button
                      className="action-btn connect"
                      onClick={() => startConnect(key)}
                      disabled={isConnecting || showingInput}
                    >
                      {isConnecting ? '...' : 'Connect →'}
                    </button>
                  )}
                </div>

                {/* Inline API key input for OpenAI / Claude */}
                {showingInput && keyLink && (
                  <div className="key-input-row">
                    <p className="key-hint">{keyLink.hint}</p>
                    <input
                      className="key-input"
                      type="password"
                      placeholder={keyLink.placeholder}
                      value={keyInputValue}
                      onChange={(e) => setKeyInputValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && keyInputValue.trim()) {
                          void handleConnect(key, keyInputValue.trim());
                        }
                        if (e.key === 'Escape') {
                          setKeyInputProvider(null);
                        }
                      }}
                      autoFocus
                    />
                    <div className="key-input-actions">
                      <a className="key-link" href={keyLink.url} target="_blank" rel="noreferrer">
                        Get key ↗
                      </a>
                      <button
                        className="action-btn connect save-btn"
                        onClick={() => handleConnect(key, keyInputValue.trim())}
                        disabled={!keyInputValue.trim() || isConnecting}
                      >
                        {isConnecting ? '...' : 'Save'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {error && <div className="error-msg">{error}</div>}

      <footer className="popup-footer">
        <span className="disclaimer-note">Use at your own risk</span>
        <button className="settings-link" onClick={openOptions}>
          ⚙ Settings &amp; Terms
        </button>
      </footer>
    </div>
  );
}
