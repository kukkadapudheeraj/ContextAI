import React, { useState } from 'react';
import type { ChatMessage, Provider } from '@contextai/shared';

const PROVIDER_LABELS: Record<Provider, string> = {
  gemini: 'Gemini',
  openai: 'ChatGPT',
  claude: 'Claude',
};

interface MessageBubbleProps {
  message: ChatMessage;
  provider?: Provider;
}

export function MessageBubble({ message, provider }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);

  if (message.role === 'system') return null;

  function handleCopy() {
    navigator.clipboard.writeText(message.content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className={`message ${message.role}`}>
      <div className="bubble">{message.content}</div>
      {message.role === 'assistant' && (
        <div className="message-footer">
          {provider && <span className="message-meta">{PROVIDER_LABELS[provider]}</span>}
          <button className="copy-btn" onClick={handleCopy} title="Copy response">
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>
      )}
    </div>
  );
}

export function LoadingBubble() {
  return (
    <div className="message assistant">
      <div className="loading-dots">
        <div className="loading-dot" />
        <div className="loading-dot" />
        <div className="loading-dot" />
      </div>
    </div>
  );
}

export function ErrorBubble({ message }: { message: string }) {
  return <div className="error-bubble">⚠ {message}</div>;
}
