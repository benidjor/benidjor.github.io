import { en, type TranslationKey } from './translations/en';
import { ko } from './translations/ko';

export type Locale = 'en' | 'ko';

const translations: Record<Locale, Record<TranslationKey, string>> = {
  en,
  ko,
};

function getInitialLocale(): Locale {
  const envLocale = import.meta.env.LOCALE as string | undefined;
  if (envLocale === 'ko' || envLocale === 'en') return envLocale;
  return 'en';
}

let currentLocale: Locale = getInitialLocale();

export function setLocale(locale: Locale): void {
  currentLocale = locale;
}

export function getLocale(): Locale {
  return currentLocale;
}

// t('postsPageSubtitle', { count: 10 }) => "10 posts"
export function t(key: TranslationKey, params?: Record<string, string | number>): string {
  const translation = translations[currentLocale][key] || translations.en[key] || key;

  if (!params) return translation;

  return Object.entries(params).reduce(
    (str, [param, value]) => str.replace(new RegExp(`\\{${param}\\}`, 'g'), String(value)),
    translation,
  );
}

export { type TranslationKey };
