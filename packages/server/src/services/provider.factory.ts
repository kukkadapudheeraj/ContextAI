import type { Provider } from '@contextai/shared';
import { BaseProvider } from './providers/base.provider';
import { GeminiProvider } from './providers/gemini.provider';
import { OpenAIProvider } from './providers/openai.provider';
import { ClaudeProvider } from './providers/claude.provider';

const REGISTRY: Record<Provider, BaseProvider> = {
  gemini: new GeminiProvider(),
  openai: new OpenAIProvider(),
  claude: new ClaudeProvider(),
};

export class ProviderFactory {
  static getProvider(name: string): BaseProvider {
    const provider = REGISTRY[name as Provider];
    if (!provider) {
      throw new Error(`Unknown provider: "${name}". Valid providers: ${Object.keys(REGISTRY).join(', ')}`);
    }
    return provider;
  }

  static getAllProviders(): BaseProvider[] {
    return Object.values(REGISTRY);
  }

  static isValidProvider(name: string): name is Provider {
    return name in REGISTRY;
  }
}
