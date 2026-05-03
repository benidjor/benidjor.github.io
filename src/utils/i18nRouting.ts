import type { CollectionEntry } from 'astro:content';

export function getDefaultLocale(): string {
  return import.meta.env.LOCALE || 'en';
}

export function getPostLang(post: CollectionEntry<'posts'>): string {
  return post.data.lang || getDefaultLocale();
}

export function isDefaultLangPost(post: CollectionEntry<'posts'>): boolean {
  if (post.data.translated_from) return false;
  return true;
}

export function getBaseSlug(slug: string): string {
  const langSuffixMatch = slug.match(/^(.+)_([a-z]{2})$/);
  if (langSuffixMatch) {
    return langSuffixMatch[1];
  }
  return slug;
}

export function getPostUrl(post: CollectionEntry<'posts'>, baseUrl: string): string {
  const isTranslation = !!post.data.translated_from;
  const baseSlug = getBaseSlug(post.slug);

  if (isTranslation) {
    const lang = getPostLang(post);
    return `${baseUrl}${lang}/posts/${baseSlug}`;
  }
  return `${baseUrl}posts/${baseSlug}`;
}

export function getPostsForLocale(
  posts: CollectionEntry<'posts'>[],
  locale?: string,
): CollectionEntry<'posts'>[] {
  const targetLocale = locale || getDefaultLocale();
  const originals = posts.filter(p => !p.data.translated_from);

  return originals.map(original => {
    const baseSlug = getBaseSlug(original.slug);

    if (original.data.lang === targetLocale) {
      return original;
    }

    const translation = posts.find(p =>
      p.data.translated_from === baseSlug && p.data.lang === targetLocale,
    );

    return translation || original;
  });
}

export function getTranslations(
  posts: CollectionEntry<'posts'>[],
  currentPost: CollectionEntry<'posts'>,
): Array<{ lang: string; post: CollectionEntry<'posts'> }> {
  const currentSlug = currentPost.slug;
  const baseSlug = getBaseSlug(currentSlug);
  const isOriginal = !currentPost.data.translated_from;

  if (isOriginal) {
    return posts
      .filter(p => p.data.translated_from === baseSlug)
      .map(post => ({
        lang: post.data.lang || 'unknown',
        post,
      }));
  } else {
    const originalSlug = currentPost.data.translated_from;
    const results: Array<{ lang: string; post: CollectionEntry<'posts'> }> = [];

    const original = posts.find(p => getBaseSlug(p.slug) === originalSlug && !p.data.translated_from);
    if (original) {
      results.push({ lang: original.data.lang || 'unknown', post: original });
    }

    const otherTranslations = posts.filter(p =>
      p.data.translated_from === originalSlug && p.slug !== currentSlug,
    );
    otherTranslations.forEach(post => {
      results.push({ lang: post.data.lang || 'unknown', post });
    });

    return results;
  }
}
