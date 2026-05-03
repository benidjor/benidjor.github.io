/// <reference types="astro/client" />

interface IntroConfig {
  name?: string;
  role?: string;
  greeting?: string;
  description?: string;
  intro_tags?: string[];
}

interface ImportMetaEnv {
  readonly BLOG_NAME: string;
  readonly LOCALE: 'en' | 'ko';
  readonly INTRO: IntroConfig;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
