import React from 'react';
import type { ContextType } from '@contextai/shared';

function truncate(str: string, maxLength: number): string {
  return str.length <= maxLength ? str : str.slice(0, maxLength) + '...';
}

interface ContextPreviewProps {
  contextType: ContextType;
  content: string;
}

export function ContextPreview({ contextType, content }: ContextPreviewProps) {
  const label =
    contextType === 'text' ? 'Selected Text' : contextType === 'image' ? 'Image' : 'Video';

  return (
    <div className="context-preview">
      <div className="context-label">{label}</div>

      {contextType === 'text' && <div className="context-text">"{truncate(content, 120)}"</div>}

      {contextType === 'image' && (
        <img
          className="context-image"
          src={content}
          alt="Selected image"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      )}

      {contextType === 'video' && (
        <div className="context-video-link">
          <span>🎬</span>
          <span>{truncate(content, 60)}</span>
        </div>
      )}
    </div>
  );
}
