import React, { useEffect, useRef, useState } from 'react';
import type { Action, ChatMessage, ContextType, Provider } from '@contextai/shared';
import { ContextPreview } from './ContextPreview';
import { MessageBubble, LoadingBubble, ErrorBubble } from './MessageBubble';

const ACTIONS: Array<{ key: Action; label: string }> = [
  { key: 'explain', label: 'Explain' },
  { key: 'simplify', label: 'Simplify' },
  { key: 'summarize', label: 'Summarize' },
  { key: 'translate', label: 'Translate' },
];

interface ChatPanelProps {
  provider: Provider;
  contextType: ContextType;
  contextContent: string;
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (text: string) => void;
  onPillAction: (action: Action) => void;
  onMinimize: () => void;
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
  onMinimize,
  onClose,
}: ChatPanelProps) {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to latest message
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

  // Visible conversation messages (exclude system prompt)
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
          <span className="panel-header-icon">🤖</span>
          <span className="panel-title">ContextAI</span>
          <span className="provider-badge">{PROVIDER_LABELS[provider]}</span>
        </div>
        <div className="panel-header-actions">
          <button className="icon-btn" onClick={onMinimize} title="Minimize">−</button>
          <button className="icon-btn" onClick={onClose} title="Close">×</button>
        </div>
      </div>

      {/* Context Preview */}
      {contextContent && (
        <ContextPreview contextType={contextType} content={contextContent} />
      )}

      {/* Action Pills (text mode only) */}
      {contextType === 'text' && visibleMessages.length === 0 && (
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
            <div className="empty-state-icon">💬</div>
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
          ref={inputRef}
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
