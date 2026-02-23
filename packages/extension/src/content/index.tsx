import React from 'react';
import { createRoot } from 'react-dom/client';
import { ChatWidget } from './ChatWidget';
import styles from './widget.css?inline';

// Prevent double-injection
if (!document.getElementById('contextai-shadow-host')) {
  const host = document.createElement('div');
  host.id = 'contextai-shadow-host';

  // Pin to bottom-right via inline style (outside shadow DOM, so it's never overridden)
  host.style.cssText = `
    position: fixed !important;
    bottom: 20px !important;
    right: 20px !important;
    z-index: 2147483646 !important;
    pointer-events: none;
  `;

  document.body.appendChild(host);

  // Create shadow root for style isolation
  const shadow = host.attachShadow({ mode: 'open' });

  // Inject styles into shadow DOM
  const styleEl = document.createElement('style');
  styleEl.textContent = styles;
  shadow.appendChild(styleEl);

  // Mount point for React
  const mountPoint = document.createElement('div');
  mountPoint.style.pointerEvents = 'auto';
  shadow.appendChild(mountPoint);

  createRoot(mountPoint).render(<ChatWidget />);
}
