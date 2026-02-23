import type { Action, ContextType } from '../types/provider.types';
/**
 * Returns the system prompt for the given context type.
 * Can be overridden by a custom prompt from user settings.
 */
export declare function buildSystemPrompt(contextType: ContextType, customPrompt?: string): string;
/**
 * Builds the initial user message content based on context type and action.
 */
export declare function buildInitialUserMessage(contextType: ContextType, content: string, action?: Action): string;
