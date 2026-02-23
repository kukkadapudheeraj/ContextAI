import React from 'react';
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
  if (message.role === 'system') return null;

  return (
    <div className={`message ${message.role}`}>
      <div className="bubble">{message.content}</div>
      {message.role === 'assistant' && provider && (
        <div className="message-meta">{PROVIDER_LABELS[provider]}</div>
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
