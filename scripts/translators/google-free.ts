import type { Translator } from './index.ts';

const GOOGLE_TRANSLATE_URL = 'https://translate.googleapis.com/translate_a/single';

export class GoogleFreeTranslator implements Translator {
  getName(): string {
    return 'Google Translate (Free)';
  }

  async translate(text: string, sourceLang: string, targetLang: string): Promise<string> {
    const urlParams = new URLSearchParams({
      client: 'gtx',
      sl: this.normalizeLanguageCode(sourceLang),
      tl: this.normalizeLanguageCode(targetLang),
      dt: 't',
    });

    const bodyParams = new URLSearchParams({ q: text });

    const response = await fetch(`${GOOGLE_TRANSLATE_URL}?${urlParams}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: bodyParams.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google Translate API error: ${response.status} - ${errorText.slice(0, 200)}`);
    }

    const data = await response.json() as unknown[][];
    return this.parseResponse(data);
  }

  private normalizeLanguageCode(lang: string): string {
    const langMap: Record<string, string> = {
      'ko': 'ko',
      'en': 'en',
      'ja': 'ja',
      'zh': 'zh-CN',
      'zh-cn': 'zh-CN',
      'zh-tw': 'zh-TW',
    };
    return langMap[lang.toLowerCase()] || lang;
  }

  private parseResponse(data: unknown[][]): string {
    if (!Array.isArray(data) || !Array.isArray(data[0])) {
      throw new Error('Invalid response from Google Translate');
    }

    const sentences = data[0] as Array<[string, string]>;
    return sentences
      .filter(sentence => Array.isArray(sentence) && sentence[0])
      .map(sentence => sentence[0])
      .join('');
  }
}
