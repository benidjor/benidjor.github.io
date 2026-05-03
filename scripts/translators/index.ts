import type { TranslateSettings } from '../sync.ts';
import { GoogleFreeTranslator } from './google-free.ts';
import { LLMTranslator } from './llm.ts';

export interface Translator {
  translate(text: string, sourceLang: string, targetLang: string): Promise<string>;
  getName(): string;
}

export interface TranslatorConfig {
  provider?: 'openai' | 'anthropic' | 'google';
  apiKey?: string;
  model?: string;
}

function resolveEnvVar(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const envMatch = value.match(/^\$\{(\w+)\}$/);
  if (envMatch) {
    return process.env[envMatch[1]];
  }
  return value;
}

function isValidLLMConfig(config: TranslatorConfig): boolean {
  return Boolean(config.provider && config.apiKey && config.model);
}

export function createTranslator(settings?: TranslateSettings): Translator {
  if (!settings) {
    return new GoogleFreeTranslator();
  }

  const config: TranslatorConfig = {
    provider: settings.provider,
    apiKey: resolveEnvVar(settings.api_key),
    model: settings.model,
  };

  if (isValidLLMConfig(config)) {
    return new LLMTranslator(config.provider!, config.apiKey!, config.model!);
  }

  return new GoogleFreeTranslator();
}
