import React, { useState } from 'react';
import type { Provider } from '@clarify/shared';

type Step = 'welcome' | 'pick-provider' | 'api-key' | 'done';

const PROVIDERS: Array<{
  key: Provider;
  label: string;
  icon: string;
  tagline: string;
  freeTier: boolean;
  keyUrl: string;
  billingUrl: string | null;
  keyPlaceholder: string;
  billingNote: string;
  steps: string[];
}> = [
  {
    key: 'gemini',
    label: 'Gemini',
    icon: '✦',
    tagline: 'Google AI · Free tier available',
    freeTier: true,
    keyUrl: 'https://aistudio.google.com/apikey',
    billingUrl: null,
    keyPlaceholder: 'AIza...',
    billingNote: 'Gemini has a free tier — no billing required to start.',
    steps: [
      'Go to aistudio.google.com/apikey',
      'Sign in with your Google account',
      'Click "Create API key"',
      'Paste it below',
    ],
  },
  {
    key: 'openai',
    label: 'ChatGPT',
    icon: '⬡',
    tagline: 'OpenAI · Pay-as-you-go',
    freeTier: false,
    keyUrl: 'https://platform.openai.com/api-keys',
    billingUrl: 'https://platform.openai.com/settings/billing/overview',
    keyPlaceholder: 'sk-...',
    billingNote:
      'This uses the OpenAI API — separate from your ChatGPT Plus subscription. You need to add billing credits at platform.openai.com before generating an API key.',
    steps: [
      'Go to platform.openai.com/api-keys',
      'Create an account if you don\'t have one',
      'Add billing credits (Settings → Billing)',
      'Click "Create new secret key" and paste it below',
    ],
  },
  {
    key: 'claude',
    label: 'Claude',
    icon: '◈',
    tagline: 'Anthropic · Pay-as-you-go',
    freeTier: false,
    keyUrl: 'https://console.anthropic.com/settings/keys',
    billingUrl: 'https://console.anthropic.com/settings/billing',
    keyPlaceholder: 'sk-ant-...',
    billingNote:
      'This uses the Anthropic API — separate from your Claude Pro subscription. You need to add billing credits at console.anthropic.com before generating an API key.',
    steps: [
      'Go to console.anthropic.com/settings/keys',
      'Create an account if you don\'t have one',
      'Add billing credits (Settings → Billing)',
      'Click "Create Key" and paste it below',
    ],
  },
];

export function Onboarding() {
  const [step, setStep] = useState<Step>('welcome');
  const [selectedProvider, setSelectedProvider] = useState<(typeof PROVIDERS)[0] | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConnect() {
    if (!selectedProvider || !apiKey.trim()) return;
    setConnecting(true);
    setError(null);
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'CONNECT_PROVIDER',
        payload: { provider: selectedProvider.key, apiKey: apiKey.trim() },
      });
      if (response?.error) {
        setError(`Could not connect: ${response.error}`);
        return;
      }
      setStep('done');
    } catch (err) {
      setError(`Could not connect: ${String(err)}`);
    } finally {
      setConnecting(false);
    }
  }

  if (step === 'welcome') {
    return (
      <div className="ob-page">
        <div className="ob-card ob-welcome">
          <div className="ob-logo">✦ Clarify</div>
          <h1 className="ob-headline">AI answers, right where you need them</h1>
          <p className="ob-subtext">
            Right-click any text, image, or video on any webpage to instantly chat with AI.
          </p>
          <div className="ob-feature-list">
            <div className="ob-feature">
              <span className="ob-feature-icon">📝</span>
              <span>Select text → explain, simplify, summarise</span>
            </div>
            <div className="ob-feature">
              <span className="ob-feature-icon">🖼️</span>
              <span>Right-click an image → ask what's in it</span>
            </div>
            <div className="ob-feature">
              <span className="ob-feature-icon">🎥</span>
              <span>Right-click a video → discuss the content</span>
            </div>
          </div>
          <button className="ob-btn ob-btn-primary" onClick={() => setStep('pick-provider')}>
            Get Started →
          </button>
        </div>
      </div>
    );
  }

  if (step === 'pick-provider') {
    return (
      <div className="ob-page">
        <div className="ob-card">
          <div className="ob-step-label">Step 1 of 2</div>
          <h2 className="ob-title">Choose your AI provider</h2>
          <p className="ob-subtext">
            Clarify uses your own AI API key — you pay only for what you use.
          </p>

          <div className="ob-provider-grid">
            {PROVIDERS.map((p) => (
              <button
                key={p.key}
                className={`ob-provider-card ${selectedProvider?.key === p.key ? 'selected' : ''}`}
                onClick={() => setSelectedProvider(p)}
              >
                <span className="ob-provider-icon">{p.icon}</span>
                <span className="ob-provider-name">{p.label}</span>
                <span className="ob-provider-tagline">{p.tagline}</span>
                {p.freeTier && <span className="ob-free-badge">Free to start</span>}
              </button>
            ))}
          </div>

          <div className="ob-actions">
            <button className="ob-link" onClick={() => setStep('welcome')}>
              ← Back
            </button>
            <button
              className="ob-btn ob-btn-primary"
              disabled={!selectedProvider}
              onClick={() => setStep('api-key')}
            >
              Continue →
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'api-key' && selectedProvider) {
    return (
      <div className="ob-page">
        <div className="ob-card">
          <div className="ob-step-label">Step 2 of 2</div>
          <h2 className="ob-title">
            <span className="ob-provider-icon-sm">{selectedProvider.icon}</span> Connect{' '}
            {selectedProvider.label}
          </h2>

          {!selectedProvider.freeTier && (
            <div className="ob-billing-notice">
              <span className="ob-billing-icon">💳</span>
              <p>{selectedProvider.billingNote}</p>
              {selectedProvider.billingUrl && (
                <a
                  className="ob-billing-link"
                  href={selectedProvider.billingUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Add billing credits ↗
                </a>
              )}
            </div>
          )}

          {selectedProvider.freeTier && (
            <div className="ob-free-notice">
              <span>✅</span>
              <p>{selectedProvider.billingNote}</p>
            </div>
          )}

          <div className="ob-steps-list">
            {selectedProvider.steps.map((s, i) => (
              <div key={i} className="ob-step-item">
                <span className="ob-step-num">{i + 1}</span>
                <span>{s}</span>
              </div>
            ))}
          </div>

          <div className="ob-input-group">
            <input
              className="ob-input"
              type="password"
              placeholder={selectedProvider.keyPlaceholder}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && apiKey.trim()) void handleConnect();
              }}
              autoFocus
            />
            <a
              className="ob-get-key-link"
              href={selectedProvider.keyUrl}
              target="_blank"
              rel="noreferrer"
            >
              Get API key ↗
            </a>
          </div>

          {error && <div className="ob-error">{error}</div>}

          <div className="ob-actions">
            <button className="ob-link" onClick={() => setStep('pick-provider')}>
              ← Back
            </button>
            <button
              className="ob-btn ob-btn-primary"
              disabled={!apiKey.trim() || connecting}
              onClick={handleConnect}
            >
              {connecting ? 'Connecting…' : 'Connect →'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Done
  return (
    <div className="ob-page">
      <div className="ob-card ob-done">
        <div className="ob-done-icon">✓</div>
        <h2 className="ob-title">You're all set!</h2>
        <p className="ob-subtext">
          {selectedProvider?.label} is connected. Here's how to use Clarify:
        </p>

        <div className="ob-how-to">
          <div className="ob-how-step">
            <span className="ob-how-num">1</span>
            <span>Go to any webpage</span>
          </div>
          <div className="ob-how-step">
            <span className="ob-how-num">2</span>
            <span>Select text, or right-click an image or video</span>
          </div>
          <div className="ob-how-step">
            <span className="ob-how-num">3</span>
            <span>
              Click <strong>"Ask Clarify"</strong> from the menu
            </span>
          </div>
          <div className="ob-how-step">
            <span className="ob-how-num">4</span>
            <span>Chat with AI right on the page</span>
          </div>
        </div>

        <button className="ob-btn ob-btn-primary" onClick={() => window.close()}>
          Start using Clarify →
        </button>
      </div>
    </div>
  );
}
