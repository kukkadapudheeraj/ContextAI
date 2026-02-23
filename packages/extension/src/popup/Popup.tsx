import React, { useEffect, useState } from 'react';
import type { Provider, StorageSchema } from '@contextai/shared';

const ONBOARDING_STEPS = [
  { icon: '🔌', text: 'Connect at least one AI provider below' },
  { icon: '🌐', text: 'Visit any webpage and right-click text, image, or video' },
  { icon: '💬', text: 'Select "Ask ContextAI" to start chatting' },
];

const PROVIDERS: Array<{ key: Provider; label: string; icon: string }> = [
  { key: 'gemini', label: 'Gemini', icon: '✦' },
  { key: 'openai', label: 'ChatGPT', icon: '⬡' },
  { key: 'claude', label: 'Claude', icon: '◈' },
];

export function Popup() {
  const [storage, setStorage] = useState<StorageSchema | null>(null);
  const [connecting, setConnecting] = useState<Provider | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [onboardingDismissed, setOnboardingDismissed] = useState(false);

  useEffect(() => {
    loadStorage();
  }, []);

  async function loadStorage() {
    const result = (await chrome.runtime.sendMessage({ type: 'GET_STORAGE' })) as StorageSchema;
    setStorage(result);
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
        <div className="popup-logo">🤖 ContextAI</div>
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
          {PROVIDERS.map(({ key, label, icon }) => {
            const conn = storage[key];
            const isConnecting = connecting === key;
            return (
              <div key={key} className={`provider-card ${conn.connected ? 'connected' : ''}`}>
                <div className="provider-info">
                  <span className="provider-icon">{icon}</span>
                  <span className="provider-name">{label}</span>
                  {conn.connected && <span className="connected-badge">✓</span>}
                </div>
                <button
                  className={`action-btn ${conn.connected ? 'disconnect' : 'connect'}`}
                  onClick={() => (conn.connected ? handleDisconnect(key) : handleConnect(key))}
                  disabled={isConnecting}
                >
                  {isConnecting ? '...' : conn.connected ? 'Disconnect' : 'Connect →'}
                </button>
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
