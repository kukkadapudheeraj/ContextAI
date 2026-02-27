import type { ChatMessage, ContextType, StorageSchema } from '@clarify/shared';
import type { OpenChatMessage } from '@clarify/shared';
import { loadStorage, getProviderToken } from '../storage/storage';
import { connectGemini, disconnectGemini } from '../providers/gemini';
import { connectOpenAI, disconnectOpenAI } from '../providers/openai';
import { connectClaude, disconnectClaude } from '../providers/claude';
import { chatOpenAI } from '../ai/openai';
import { chatGemini } from '../ai/gemini';
import { chatClaude } from '../ai/claude';

// ── Context Menu Setup ────────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'clarify_text',
    title: 'Ask Clarify',
    contexts: ['selection'],
  });

  chrome.contextMenus.create({
    id: 'clarify_image',
    title: 'Ask Clarify about this image',
    contexts: ['image'],
  });

  chrome.contextMenus.create({
    id: 'clarify_video',
    title: 'Ask Clarify about this video',
    contexts: ['video', 'link'],
  });
});

// ── Context Menu Click Handler ────────────────────────────────────────────────

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab?.id) return;

  const storage = await loadStorage();
  let contextType: ContextType;
  let content: string;

  if (info.menuItemId === 'clarify_text') {
    contextType = 'text';
    content = info.selectionText ?? '';
  } else if (info.menuItemId === 'clarify_image') {
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
    // Content script not yet injected (tab was open before extension loaded).
    // The manifest injects it automatically on next page load — nothing to do here.
  }
});

// ── Message Handler (from content script / popup) ────────────────────────────

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  handleMessage(message)
    .then(sendResponse)
    .catch((err) => {
      sendResponse({ error: String(err) });
    });
  return true; // Keep channel open for async response
});

async function handleMessage(message: { type: string; payload?: unknown }): Promise<unknown> {
  switch (message.type) {
    case 'CONNECT_PROVIDER':
      return handleConnect(
        (message.payload as { provider: string; apiKey?: string }).provider,
        (message.payload as { provider: string; apiKey?: string }).apiKey
      );

    case 'DISCONNECT_PROVIDER':
      return handleDisconnect((message.payload as { provider: string }).provider);

    case 'SEND_CHAT':
      return handleChat(
        message.payload as {
          messages: Array<{
            role: string;
            content: string;
            mediaUrl?: string;
            contextType?: string;
          }>;
          provider: string;
        }
      );

    case 'GET_STORAGE':
      return loadStorage();

    default:
      throw new Error(`Unknown message type: ${message.type}`);
  }
}

// ── Provider Connection ────────────────────────────────────────────────────────

async function handleConnect(provider: string, apiKey?: string): Promise<{ success: boolean }> {
  switch (provider) {
    case 'gemini':
      if (!apiKey) throw new Error('Gemini API key is required.');
      await connectGemini(apiKey);
      break;
    case 'openai':
      if (!apiKey) throw new Error('OpenAI API key is required.');
      await connectOpenAI(apiKey);
      break;
    case 'claude':
      if (!apiKey) throw new Error('Claude API key is required.');
      await connectClaude(apiKey);
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

// ── AI Chat Request (calls AI APIs directly — no backend server needed) ────────

async function handleChat(payload: {
  messages: Array<{ role: string; content: string; mediaUrl?: string; contextType?: string }>;
  provider: string;
}): Promise<{ answer?: string; error?: string }> {
  const providerKey = payload.provider as StorageSchema['activeProvider'];
  const storage = await loadStorage();

  // Decrypt the session token from AES-GCM encrypted local storage
  const token = await getProviderToken(providerKey);

  if (!token) {
    return {
      error: `No active token for ${payload.provider}. Please connect your account in the extension popup.`,
    };
  }

  // Pass the user-selected model — undefined falls back to provider's free-tier default
  const model = storage[providerKey]?.model;

  // Apply custom system prompt if set in Options
  let messages = payload.messages as ChatMessage[];
  const customPrompt = storage.customSystemPrompt;
  if (customPrompt?.trim()) {
    if (messages[0]?.role === 'system') {
      messages = [{ role: 'system', content: customPrompt }, ...messages.slice(1)];
    } else {
      messages = [{ role: 'system', content: customPrompt }, ...messages];
    }
  }

  // 30-second timeout via AbortController
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30_000);

  try {
    let answer: string;

    switch (providerKey) {
      case 'openai':
        answer = await chatOpenAI(messages, token, model, controller.signal);
        break;
      case 'gemini':
        answer = await chatGemini(messages, token, model, controller.signal);
        break;
      case 'claude':
        answer = await chatClaude(messages, token, model, controller.signal);
        break;
      default:
        throw new Error(`Unknown provider: ${providerKey}`);
    }

    clearTimeout(timeoutId);
    return { answer };
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof DOMException && err.name === 'AbortError') {
      return { error: 'Request timed out after 30 seconds. Check your connection and try again.' };
    }
    return { error: String(err) };
  }
}
