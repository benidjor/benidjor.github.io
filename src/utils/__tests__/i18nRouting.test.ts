import { describe, it, expect, vi } from 'vitest';

vi.mock('astro:content', () => ({}));

import {
  getBaseSlug,
  getPostUrl,
  getPostLang,
  isDefaultLangPost,
  getPostsForLocale,
  getTranslations,
} from '../i18nRouting';

interface MockPost {
  slug: string;
  data: {
    lang?: string;
    translated_from?: string;
    [key: string]: unknown;
  };
}

function createPost(slug: string, overrides: Partial<MockPost['data']> = {}): MockPost {
  return {
    slug,
    data: {
      lang: undefined,
      translated_from: undefined,
      ...overrides,
    },
  };
}

describe('getBaseSlug', () => {
  it('should return slug as-is when no language suffix', () => {
    expect(getBaseSlug('my-post')).toBe('my-post');
  });

  it('should strip language suffix from slug', () => {
    expect(getBaseSlug('my-post_ko')).toBe('my-post');
    expect(getBaseSlug('my-post_en')).toBe('my-post');
    expect(getBaseSlug('my-post_ja')).toBe('my-post');
  });

  it('should not strip non-language suffixes', () => {
    expect(getBaseSlug('my-post_v2')).toBe('my-post_v2');
    expect(getBaseSlug('my-post_abc')).toBe('my-post_abc');
  });

  it('should handle slugs with multiple underscores', () => {
    expect(getBaseSlug('my_long_post_ko')).toBe('my_long_post');
  });

  it('should handle single character slug', () => {
    expect(getBaseSlug('a')).toBe('a');
  });

  it('should handle slug with dashes', () => {
    expect(getBaseSlug('hello-world-post_en')).toBe('hello-world-post');
  });

  it('should handle korean slug', () => {
    expect(getBaseSlug('안녕하세요_ko')).toBe('안녕하세요');
  });
});

describe('getPostLang', () => {
  it('should return post lang when set', () => {
    const post = createPost('test', { lang: 'ko' });
    expect(getPostLang(post as never)).toBe('ko');
  });

  it('should fallback to default locale when lang not set', () => {
    const post = createPost('test', { lang: undefined });
    const result = getPostLang(post as never);
    expect(typeof result).toBe('string');
  });
});

describe('isDefaultLangPost', () => {
  it('should return true when no translated_from', () => {
    const post = createPost('my-post');
    expect(isDefaultLangPost(post as never)).toBe(true);
  });

  it('should return false when translated_from is set', () => {
    const post = createPost('my-post_ko', { translated_from: 'my-post' });
    expect(isDefaultLangPost(post as never)).toBe(false);
  });
});

describe('getPostUrl', () => {
  it('should return standard URL for original posts', () => {
    const post = createPost('my-post', { lang: 'en' });
    expect(getPostUrl(post as never, '/')).toBe('/posts/my-post');
  });

  it('should include language prefix for translations', () => {
    const post = createPost('my-post_ko', {
      lang: 'ko',
      translated_from: 'my-post',
    });
    expect(getPostUrl(post as never, '/')).toBe('/ko/posts/my-post');
  });

  it('should handle baseUrl with trailing slash', () => {
    const post = createPost('test-post', { lang: 'en' });
    expect(getPostUrl(post as never, '/blog/')).toBe('/blog/posts/test-post');
  });

  it('should strip language suffix from slug in URL', () => {
    const post = createPost('hello-world_ja', {
      lang: 'ja',
      translated_from: 'hello-world',
    });
    expect(getPostUrl(post as never, '/')).toBe('/ja/posts/hello-world');
  });
});

describe('getPostsForLocale', () => {
  it('should return original posts when no translations exist', () => {
    const posts = [
      createPost('post-1', { lang: 'en' }),
      createPost('post-2', { lang: 'en' }),
    ];
    const result = getPostsForLocale(posts as never[], 'en');
    expect(result).toHaveLength(2);
  });

  it('should substitute translation when available for target locale', () => {
    const original = createPost('my-post', { lang: 'en' });
    const translation = createPost('my-post_ko', {
      lang: 'ko',
      translated_from: 'my-post',
    });
    const posts = [original, translation];

    const result = getPostsForLocale(posts as never[], 'ko');
    expect(result).toHaveLength(1);
    expect((result[0] as unknown as MockPost).slug).toBe('my-post_ko');
  });

  it('should return original when no translation for target locale', () => {
    const original = createPost('my-post', { lang: 'en' });
    const translation = createPost('my-post_ko', {
      lang: 'ko',
      translated_from: 'my-post',
    });
    const posts = [original, translation];

    const result = getPostsForLocale(posts as never[], 'ja');
    expect(result).toHaveLength(1);
    expect((result[0] as unknown as MockPost).slug).toBe('my-post');
  });

  it('should not include translation posts as separate entries', () => {
    const original = createPost('my-post', { lang: 'en' });
    const koTranslation = createPost('my-post_ko', {
      lang: 'ko',
      translated_from: 'my-post',
    });
    const jaTranslation = createPost('my-post_ja', {
      lang: 'ja',
      translated_from: 'my-post',
    });
    const posts = [original, koTranslation, jaTranslation];

    const result = getPostsForLocale(posts as never[], 'en');
    expect(result).toHaveLength(1);
  });
});

describe('getTranslations', () => {
  it('should find translations for an original post', () => {
    const original = createPost('my-post', { lang: 'en' });
    const koTranslation = createPost('my-post_ko', {
      lang: 'ko',
      translated_from: 'my-post',
    });
    const posts = [original, koTranslation];

    const result = getTranslations(posts as never[], original as never);
    expect(result).toHaveLength(1);
    expect(result[0].lang).toBe('ko');
  });

  it('should find multiple translations for an original post', () => {
    const original = createPost('my-post', { lang: 'en' });
    const koTranslation = createPost('my-post_ko', {
      lang: 'ko',
      translated_from: 'my-post',
    });
    const jaTranslation = createPost('my-post_ja', {
      lang: 'ja',
      translated_from: 'my-post',
    });
    const posts = [original, koTranslation, jaTranslation];

    const result = getTranslations(posts as never[], original as never);
    expect(result).toHaveLength(2);
    expect(result.map(r => r.lang).sort()).toEqual(['ja', 'ko']);
  });

  it('should return empty array when no translations exist', () => {
    const original = createPost('my-post', { lang: 'en' });
    const result = getTranslations([original] as never[], original as never);
    expect(result).toHaveLength(0);
  });

  it('should find original and other translations from a translated post', () => {
    const original = createPost('my-post', { lang: 'en' });
    const koTranslation = createPost('my-post_ko', {
      lang: 'ko',
      translated_from: 'my-post',
    });
    const jaTranslation = createPost('my-post_ja', {
      lang: 'ja',
      translated_from: 'my-post',
    });
    const posts = [original, koTranslation, jaTranslation];

    const result = getTranslations(posts as never[], koTranslation as never);
    expect(result).toHaveLength(2);
    const langs = result.map(r => r.lang).sort();
    expect(langs).toEqual(['en', 'ja']);
  });

  it('should return unknown when lang is not set', () => {
    const original = createPost('my-post');
    const translation = createPost('my-post_ko', {
      translated_from: 'my-post',
    });
    const posts = [original, translation];

    const result = getTranslations(posts as never[], original as never);
    expect(result).toHaveLength(1);
    expect(result[0].lang).toBe('unknown');
  });
});
