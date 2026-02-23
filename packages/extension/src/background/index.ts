import type { ContextType, StorageSchema } from '@contextai/shared';
import type { OpenChatMessage } from '@contextai/shared';
import { loadStorage, getProviderToken } from '../storage/storage';
import { connectGemini, disconnectGemini } from '../providers/gemini';
import { connectOpenAI, disconnectOpenAI } from '../providers/openai';
import { connectClaude, disconnectClaude } from '../providers/claude';

const SERVER_URL = 'http://localhost:3001';

// ── Context Menu Setup ────────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'contextai_text',
    title: 'Ask ContextAI',
    contexts: ['selection'],
  });

  chrome.contextMenus.create({
    id: 'contextai_image',
    title: 'Ask ContextAI about this image',
    contexts: ['image'],
  });

  chrome.contextMenus.create({
    id: 'contextai_video',
    title: 'Ask ContextAI about this video',
    contexts: ['video', 'link'],
  });
});

// ── Context Menu Click Handler ────────────────────────────────────────────────

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab?.id) return;

  const storage = await loadStorage();
  let contextType: ContextType;
  let content: string;

  if (info.menuItemId === 'contextai_text') {
    contextType = 'text';
    content = info.selectionText ?? '';
  } else if (info.menuItemId === 'contextai_image') {
    contextType = 'image';
    content = info.srcUrl ?? '';
  } else {
    contextType = 'video';
    content = info.srcUrl ?? info.linkUrl ?? '';
  }

  if (!content) return;

  const message: OpenChatMessage = {
    type: 'OPEN_CHAT',
    payload: { contextType, content, provider: storage.activeProvider },
  };

  try {
    await chrome.tabs.sendMessage(tab.id, message);
  } catch {
    // Content script may not be injected yet — try scripting API
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['src/content/index.tsx'],
    });
    await chrome.tabs.sendMessage(tab.id, message);
  }
});

// ── Message Handler (from content script / popup) ────────────────────────────

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  handleMessage(message).then(sendResponse).catch((err) => {
    sendResponse({ error: String(err) });
  });
  return true; // Keep channel open for async response
});

async function handleMessage(message: { type: string; payload?: unknown }): Promise<unknown> {
  switch (message.type) {
    case 'CONNECT_PROVIDER':
      return handleConnect((message.payload as { provider: string }).provider);

    case 'DISCONNECT_PROVIDER':
      return handleDisconnect((message.payload as { provider: string }).provider);

    case 'SEND_CHAT':
      return handleChat(message.payload as {
        messages: Array<{ role: string; content: string; mediaUrl?: string; contextType?: string }>;
        provider: string;
      });

    case 'GET_STORAGE':
      return loadStorage();

    default:
      throw new Error(`Unknown message type: ${message.type}`);
  }
}

// ── Provider Connection ────────────────────────────────────────────────────────

async function handleConnect(provider: string): Promise<{ success: boolean }> {
  switch (provider) {
    case 'gemini':
      await connectGemini();
      break;
    case 'openai':
      await connectOpenAI();
      break;
    case 'claude':
      await connectClaude();
      break;
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
  return { success: true };
}

async function handleDisconnect(provider: string): Promise<{ success: boolean }> {
  switch (provider) {
    case 'gemini':
      await disconnectGemini();
      break;
    case 'openai':
      await disconnectOpenAI();
      break;
    case 'claude':
      await disconnectClaude();
      break;
  }
  return { success: true };
}

// ── AI Chat Request ────────────────────────────────────────────────────────────

async function handleChat(payload: {
  messages: Array<{ role: string; content: string; mediaUrl?: string; contextType?: string }>;
  provider: string;
}): Promise<{ answer?: string; error?: string }> {
  const token = await getProviderToken(payload.provider as StorageSchema['activeProvider']);

  if (!token) {
    return {
      error: `No active token for ${payload.provider}. Please connect your account in the extension popup.`,
    };
  }

  const response = await fetch(`${SERVER_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provider: payload.provider,
      messages: payload.messages,
      token,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    return { error: `Server error (${response.status}): ${text}` };
  }

  const data = await response.json() as { answer: string };
  return { answer: data.answer };
}
