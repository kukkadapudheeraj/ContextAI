import React, { useEffect, useRef, useState } from 'react';
import type { Action, ChatMessage, ContextType, Provider } from '@clarify/shared';
import { ContextPreview } from './ContextPreview';
import { MessageBubble, LoadingBubble } from './MessageBubble';

const ACTIONS: Array<{ key: Action; label: string }> = [
  { key: 'explain', label: 'Explain' },
  { key: 'simplify', label: 'Simplify' },
  { key: 'summarize', label: 'Summarize' },
  { key: 'translate', label: 'Translate' },
  { key: 'related', label: 'Related' },
];

interface ChatPanelProps {
  provider: Provider;
  contextType: ContextType;
  contextContent: string;
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (text: string) => void;
  onPillAction: (action: Action) => void;
  onClose: () => void;
}

export function ChatPanel({
  provider,
  contextType,
  contextContent,
  messages,
  isLoading,
  onSendMessage,
  onPillAction,
  onClose,
}: ChatPanelProps) {
  const [inputText, setInputText] = useState('');
  const [copied, setCopied] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  function handleSend() {
    const text = inputText.trim();
    if (!text || isLoading) return;
    setInputText('');
    onSendMessage(text);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleCopyAll() {
    const lastAI = [...messages].reverse().find((m) => m.role === 'assistant');
    if (!lastAI) return;
    navigator.clipboard.writeText(lastAI.content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  const visibleMessages = messages.filter((m) => m.role !== 'system');

  const PROVIDER_LABELS: Record<Provider, string> = {
    gemini: 'Gemini',
    openai: 'ChatGPT',
    claude: 'Claude',
  };

  return (
    <div className="widget-panel">
      {/* Header */}
      <div className="panel-header">
        <div className="panel-header-left">
          <div className="panel-header-icon">✦</div>
          <span className="panel-title">Clarify</span>
          <span className="provider-badge">{PROVIDER_LABELS[provider]}</span>
        </div>
        <div className="panel-header-actions">
          {visibleMessages.some((m) => m.role === 'assistant') && (
            <button className="copy-all-btn" onClick={handleCopyAll}>
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          )}
          <button className="icon-btn" onClick={onClose} title="Minimize">
            ×
          </button>
        </div>
      </div>

      {/* Context Preview */}
      {contextContent && <ContextPreview contextType={contextType} content={contextContent} />}

      {/* Action Pills (text mode only) */}
      {contextType === 'text' && (
        <div className="action-pills">
          {ACTIONS.map(({ key, label }) => (
            <button
              key={key}
              className="pill-btn"
              onClick={() => onPillAction(key)}
              disabled={isLoading}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Messages */}
      <div className="messages-area">
        {visibleMessages.length === 0 && !isLoading ? (
          <div className="empty-state">
            <div className="empty-state-icon">✦</div>
            <div>Ask anything about the selected content</div>
          </div>
        ) : (
          visibleMessages.map((msg, i) => (
            <MessageBubble
              key={i}
              message={msg}
              provider={msg.role === 'assistant' ? provider : undefined}
            />
          ))
        )}
        {isLoading && <LoadingBubble />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="input-area">
        <textarea
          className="chat-input"
          placeholder="Ask a follow-up question..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={isLoading}
        />
        <button
          className="send-btn"
          onClick={handleSend}
          disabled={!inputText.trim() || isLoading}
          title="Send"
        >
          ↑
        </button>
      </div>
    </div>
  );
}
