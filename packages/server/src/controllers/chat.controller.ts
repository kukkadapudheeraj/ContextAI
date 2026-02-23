import type { Request, Response, NextFunction } from 'express';
import type { ChatMessage } from '@contextai/shared';
import { ProviderFactory } from '../services/provider.factory';

interface ChatRequestBody {
  provider: string;
  messages: ChatMessage[];
  token: string;
}

/**
 * POST /api/chat
 * Receives a full conversation history and routes it to the correct AI provider.
 * Returns { answer: string }.
 */
export async function chatHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { provider, messages, token } = req.body as ChatRequestBody;

    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: 'messages must be a non-empty array' });
      return;
    }

    if (!ProviderFactory.isValidProvider(provider)) {
      res.status(400).json({
        error: `Invalid provider "${provider}". Valid: gemini, openai, claude`,
      });
      return;
    }

    const aiProvider = ProviderFactory.getProvider(provider);
    const answer = await aiProvider.chat(messages, token);

    res.json({ answer });
  } catch (err) {
    next(err);
  }
}
