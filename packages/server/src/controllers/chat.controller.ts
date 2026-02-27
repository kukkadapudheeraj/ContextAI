import type { Request, Response, NextFunction } from 'express';
import type { ChatMessage } from '@clarify/shared';
import { ProviderFactory } from '../services/provider.factory';

interface ChatRequestBody {
  provider: string;
  messages: ChatMessage[];
  token: string;
  /** Optional model override sent by the extension from the user's settings */
  model?: string;
}

/**
 * POST /api/chat
 * Receives a full conversation history and routes it to the correct AI provider.
 * Returns { answer: string, modelUsed: string }.
 * modelUsed reflects the auto-detected model (or the user-supplied override) so
 * the extension can cache it and skip the probe step on subsequent requests.
 */
export async function chatHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { provider, messages, token, model } = req.body as ChatRequestBody;

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
    const result = await aiProvider.chat(messages, token, model);

    res.json({ answer: result.answer, modelUsed: result.modelUsed });
  } catch (err) {
    next(err);
  }
}
