import React, { useState } from 'react';
import type { ChatMessage, Provider } from '@contextai/shared';

const PROVIDER_LABELS: Record<Provider, string> = {
  gemini: 'Gemini',
  openai: 'ChatGPT',
  claude: 'Claude',
};

/** Render inline markdown: **bold**, *italic* */
function renderInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let i = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    if (match[2]) parts.push(<strong key={i++}>{match[2]}</strong>);
    else if (match[3]) parts.push(<em key={i++}>{match[3]}</em>);
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length === 1 && typeof parts[0] === 'string' ? parts[0] : parts;
}

/** Render a single line of markdown */
function renderLine(line: string, key: number): React.ReactNode {
  if (line.startsWith('### '))
    return (
      <div key={key} className="md-h3">
        {line.slice(4)}
      </div>
    );
  if (line.startsWith('## '))
    return (
      <div key={key} className="md-h2">
        {line.slice(3)}
      </div>
    );
  if (line.startsWith('# '))
    return (
      <div key={key} className="md-h1">
        {line.slice(2)}
      </div>
    );
  if (/^[-*] /.test(line))
    return (
      <div key={key} className="md-list-item">
        {renderInline(line.slice(2))}
      </div>
    );
  if (/^\d+\. /.test(line))
    return (
      <div key={key} className="md-numbered">
        {renderInline(line)}
      </div>
    );
  if (line.trim() === '') return <div key={key} className="md-spacer" />;
  return <div key={key}>{renderInline(line)}</div>;
}

function renderMarkdown(content: string): React.ReactNode {
  return content.split('\n').map((line, i) => renderLine(line, i));
}

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
      <div className="bubble">
        {message.role === 'assistant' ? renderMarkdown(message.content) : message.content}
      </div>
      {message.role === 'assistant' && (
        <div className="message-footer">
          {provider && <span className="message-meta">{PROVIDER_LABELS[provider]}</span>}
          <button className="copy-btn" onClick={handleCopy} title="Copy">
            {copied ? '✓' : 'Copy'}
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
