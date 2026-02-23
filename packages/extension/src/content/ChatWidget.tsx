import React, { useCallback, useEffect, useState } from 'react';
import type { Action, ChatMessage, ContextType, Provider } from '@contextai/shared';
import { buildInitialUserMessage, buildSystemPrompt } from '../utils/prompt';
import { ChatPanel } from './ChatPanel';

interface WidgetState {
  isOpen: boolean;
  provider: Provider;
  contextType: ContextType;
  contextContent: string;
  messages: ChatMessage[];
  isLoading: boolean;
}

const INITIAL_STATE: WidgetState = {
  isOpen: false,
  provider: 'gemini',
  contextType: 'text',
  contextContent: '',
  messages: [],
  isLoading: false,
};

export function ChatWidget() {
  const [state, setState] = useState<WidgetState>(INITIAL_STATE);

  /** Send messages to background → AI provider and get response */
  const triggerQuery = useCallback(
    async (currentMessages: ChatMessage[], userText: string, provider: Provider) => {
      const userMessage: ChatMessage = { role: 'user', content: userText };
      const updatedMessages = [...currentMessages, userMessage];

      setState((s) => ({
        ...s,
        isOpen: true,
        messages: updatedMessages,
        isLoading: true,
      }));

      try {
        const response = (await chrome.runtime.sendMessage({
          type: 'SEND_CHAT',
          payload: { messages: updatedMessages, provider },
        })) as { answer?: string; error?: string };

        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: response.error ?? response.answer ?? '(No response)',
        };

        setState((s) => ({
          ...s,
          messages: [...s.messages, assistantMessage],
          isLoading: false,
        }));
      } catch (err) {
        const errorMessage: ChatMessage = {
          role: 'assistant',
          content: `Error: ${String(err)}`,
        };
        setState((s) => ({
          ...s,
          messages: [...s.messages, errorMessage],
          isLoading: false,
        }));
      }
    },
    []
  );

  // Listen for OPEN_CHAT messages from the background service worker
  useEffect(() => {
    function onMessage(message: { type: string; payload?: unknown }) {
      if (message.type === 'OPEN_CHAT') {
        const { contextType, content, provider } = message.payload as {
          contextType: ContextType;
          content: string;
          provider: Provider;
        };

        // Build initial conversation with system prompt
        const systemMessage: ChatMessage = {
          role: 'system',
          content: buildSystemPrompt(contextType),
        };

        setState({
          isOpen: true,
          provider,
          contextType,
          contextContent: content,
          messages: [systemMessage],
          isLoading: false,
        });

        // Automatically trigger initial explanation for text selections
        if (contextType === 'text') {
          triggerQuery(
            [systemMessage],
            buildInitialUserMessage(contextType, content, 'explain'),
            provider
          );
        } else {
          // For images/videos, auto-send the initial analysis request
          triggerQuery([systemMessage], buildInitialUserMessage(contextType, content), provider);
        }
      }
    }

    chrome.runtime.onMessage.addListener(onMessage);
    return () => chrome.runtime.onMessage.removeListener(onMessage);
  }, [triggerQuery]);

  // Close on ESC key
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && state.isOpen) {
        setState((s) => ({ ...s, isOpen: false }));
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [state.isOpen]);

  function handleSendMessage(text: string) {
    triggerQuery(state.messages, text, state.provider);
  }

  function handlePillAction(action: Action) {
    const userText = buildInitialUserMessage(state.contextType, state.contextContent, action);
    // Replace conversation with a fresh query for this action
    const freshMessages: ChatMessage[] = [
      { role: 'system', content: buildSystemPrompt(state.contextType) },
    ];
    setState((s) => ({ ...s, messages: freshMessages }));
    triggerQuery(freshMessages, userText, state.provider);
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  if (!state.isOpen) {
    // Collapsed tab — always visible when there's history
    if (state.messages.length <= 1) return null;

    return (
      <button className="widget-tab" onClick={() => setState((s) => ({ ...s, isOpen: true }))}>
        <span className="widget-tab-icon">🤖</span>
        <span className="widget-tab-label">ContextAI</span>
      </button>
    );
  }

  return (
    <ChatPanel
      provider={state.provider}
      contextType={state.contextType}
      contextContent={state.contextContent}
      messages={state.messages}
      isLoading={state.isLoading}
      onSendMessage={handleSendMessage}
      onPillAction={handlePillAction}
      onMinimize={() => setState((s) => ({ ...s, isOpen: false }))}
      onClose={() => setState(INITIAL_STATE)}
    />
  );
}
