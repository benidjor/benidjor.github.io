/// <reference types="astro/client" />

interface IntroConfig {
  name?: string;
  role?: string;
  greeting?: string;
  description?: string;
  intro_tags?: string[];
  name_suffix?: string;
}

interface CategoryEntry {
  label_ko: string;
  label_en: string;
  description_ko: string;
  description_en: string;
}

interface CategoriesConfig {
  order: string[];
  [slug: string]: CategoryEntry | string[] | undefined;
}

interface ImportMetaEnv {
  readonly BLOG_NAME: string;
  readonly LOCALE: 'en' | 'ko';
  readonly INTRO: IntroConfig;
  readonly CATEGORIES: CategoriesConfig;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
