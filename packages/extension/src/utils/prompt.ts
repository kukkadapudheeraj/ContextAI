import type { Action, ContextType } from '@contextai/shared';

const SYSTEM_PROMPTS: Record<ContextType, string> = {
  text: 'You are a helpful assistant. The user has highlighted text from a webpage. Explain it clearly and concisely. Invite follow-up questions at the end.',
  image:
    'You are a helpful assistant with vision capabilities. The user has shared an image URL. Describe what you see, highlight key elements, and invite follow-up questions.',
  video:
    'You are a helpful assistant. The user has shared a video link. Help them understand, summarize, or discuss the video content based on the URL and any context provided.',
};

const TEXT_ACTION_PROMPTS: Record<Action, string> = {
  explain: 'Explain the following text clearly and briefly:',
  simplify: 'Rewrite the following in simple terms that a beginner would understand:',
  summarize: 'Summarize the following in 3 concise bullet points:',
  translate: 'Translate the following to plain English and explain any technical terms:',
  related: 'Generate 5 related searches and questions someone might have about this topic:',
};

export function buildSystemPrompt(contextType: ContextType, customPrompt?: string): string {
  return customPrompt ?? SYSTEM_PROMPTS[contextType];
}

export function buildInitialUserMessage(
  contextType: ContextType,
  content: string,
  action: Action = 'explain'
): string {
  if (contextType === 'text') {
    return `${TEXT_ACTION_PROMPTS[action]}\n\n"${content}"`;
  }
  if (contextType === 'image') {
    return `Please describe and analyze this image: ${content}`;
  }
  if (contextType === 'video') {
    return `Please help me understand this video: ${content}`;
  }
  return content;
}
