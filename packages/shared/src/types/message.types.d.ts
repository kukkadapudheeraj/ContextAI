import type { ChatMessage, ContextType, Provider } from './provider.types';
/** Sent from background service worker → content script to open/update the chat widget */
export interface OpenChatMessage {
    type: 'OPEN_CHAT';
    payload: {
        contextType: ContextType;
        /** Selected text, image URL, or video URL */
        content: string;
        provider: Provider;
    };
}
/** Sent from content script → background to request an AI response */
export interface SendChatRequest {
    type: 'SEND_CHAT';
    payload: {
        /** Full conversation history — server is stateless, client owns the state */
        messages: ChatMessage[];
        provider: Provider;
        token: string;
    };
}
/** Sent from background → content script with the AI's response */
export interface ChatResponseMessage {
    type: 'CHAT_RESPONSE';
    payload: {
        answer: string;
        error?: string;
    };
}
export type BackgroundToContentMessage = OpenChatMessage | ChatResponseMessage;
export type ContentToBackgroundMessage = SendChatRequest;
export type ExtensionMessage = BackgroundToContentMessage | ContentToBackgroundMessage;
