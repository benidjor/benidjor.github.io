# Blog Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement five UX/IA changes from `docs/superpowers/specs/2026-05-04-blog-redesign-design.md`: Material accent purple→green, new Reading theme, single-column recent posts, first-class Categories axis (Projects/TIL), and homepage greeting suffix.

**Architecture:** Surgical changes layered on the existing Astro 5.x SSG. Theme tokens via CSS custom properties (`[data-design-theme]` attribute selectors). Content classification via an additive `category` zod field. Categories follow the existing `/tags` pattern — single default-locale route, no `[lang]` variant. No changes to the markdown sync pipeline or build infrastructure.

**Tech Stack:** Astro 5.x, TypeScript (strict), Vitest, Zod content collections, `smol-toml` for config, CSS custom properties.

---

## Spec correction (single divergence from spec)

The spec drafted `/[lang]/categories/...` mirror routes. **The current site only has `[lang]` mirrors for `/posts/`** (`src/pages/[lang]/posts/[...slug].astro`); `/tags/` lives only at the default locale and reads strings via `t()` against `getDefaultLocale()`. To stay consistent with the existing pattern, this plan creates only the default-locale `/categories/` and `/categories/[slug]/` routes. No `[lang]` mirror is created. If a future change adds `[lang]` mirrors for tags/categories together, that is a separate plan.

---

## File Structure

**New files:**
- `src/utils/relativeDate.ts` — pure function returning a localized relative-time string for the homepage recent-posts hint (Change 3).
- `src/utils/__tests__/relativeDate.test.ts` — vitest covering boundaries (24h, 7d, 30d, 365d cutoff) for ko + en (Change 3).
- `src/pages/categories/index.astro` — Categories landing page (Change 4).
- `src/pages/categories/[slug].astro` — per-category page with intro copy and post list (Change 4).

**Modified files:**
- `src/styles/global.css` — Material accent token swap (Change 1) + new `[data-design-theme="reading"]` block (Change 2) + scoped serif override for reading theme content (Change 2).
- `src/components/ThemeSelector.astro` — add `reading` option as the 4th `<li>` (Change 2).
- `src/i18n/translations/en.ts` — add `reading`, `readingDesc`, `categories`, `categoriesPageTitle`, `categoriesPageSubtitle`, `categoryPageTitle`, `categoryPostsCount`, `noPostsInCategory`, `backToCategories`, `category` keys (Changes 2 & 4). Type updated automatically via `keyof typeof en`.
- `src/i18n/translations/ko.ts` — Korean values for the same keys.
- `src/pages/index.astro` — single-column recent posts + relative-time hint, removal of `ResizeObserver` script (Change 3) + greeting suffix span (Change 5).
- `src/layouts/BaseLayout.astro` — `Categories` link added to header nav between `Posts` and `Tags` (Change 4).
- `src/layouts/PostLayout.astro` — optional `Category:` badge near `.post__meta` (Change 4).
- `setting.toml` — `name_suffix = " 입니다."` under `[intro]` (Change 5) + new `[categories]` table (Change 4).
- `astro.config.mjs` — inject `import.meta.env.CATEGORIES` from `setting.toml` (Change 4).
- `src/env.d.ts` — type the new `INTRO.name_suffix` and `CATEGORIES` env (Changes 4 & 5).
- `src/content/config.ts` — add optional `category: z.enum(['projects', 'til'])` field (Change 4).

**Out-of-repo (Obsidian vault) edits — Task 13:**
- `/Users/aryijq/Documents/obsidian-vault/01 Projects/01-07 blog/서울-도시데이터-플랫폼-시리즈-왜-무엇을-어떻게.md` → add `category: projects` to frontmatter.
- `/Users/aryijq/Documents/obsidian-vault/01 Projects/01-07 blog/블로그를-다시-시작하는-이유.md` → add `category: til`.
- `about.md` is intentionally **not** given a category.

---

## Implementation order

Per the spec (§Implementation order), tasks are ordered so each step is independently verifiable, smallest/most-isolated first. Categories last because they touch the most surface.

| # | Task | Change |
|---|---|---|
| 1 | Material accent purple → green | 1 |
| 2 | Homepage greeting suffix | 5 |
| 3 | Relative-date helper (TDD) | 3 (helper) |
| 4 | Recent posts: single-column layout | 3 (page) |
| 5 | Reading theme: i18n keys & ThemeSelector option | 2 (chrome) |
| 6 | Reading theme: CSS block & serif scope | 2 (theme) |
| 7 | Categories: zod schema | 4 |
| 8 | Categories: setting.toml + astro.config.mjs + env.d.ts | 4 |
| 9 | Categories: i18n keys | 4 |
| 10 | Categories: `/categories/index.astro` | 4 |
| 11 | Categories: `/categories/[slug].astro` | 4 |
| 12 | Categories: header nav link & post page badge | 4 |
| 13 | Vault frontmatter migration & sync | 4 |
| 14 | Final smoke test across themes & locales | all |

---

## Task 1: Material accent purple → green

**Files:**
- Modify: `src/styles/global.css:499-507`

- [ ] **Step 1: Replace Material light accent tokens**

In `src/styles/global.css`, find the `[data-design-theme="material"]` block and replace lines 499–500:

```css
  --accent: #00A173;
  --accent-hover: #00CE93;
```

(was `#6750A4` / `#7965AF`)

- [ ] **Step 2: Replace Material dark accent tokens**

In the same file, find `[data-design-theme="material"][data-theme="dark"]` and replace lines 506–507:

```css
  --accent: #00CE93;
  --accent-hover: #7FE7C0;
```

(was `#D0BCFF` / `#E8DEF8`)

- [ ] **Step 3: Build to verify no syntax errors**

Run: `npm run build`
Expected: build succeeds, `dist/` produced, no CSS parser errors.

- [ ] **Step 4: Visual smoke**

Run: `npm run dev`
Open http://localhost:4321, click the theme selector, switch to **Material**, toggle light/dark. Confirm the accent (logo background, intro__name box, button hover) is now emerald green (not purple). Stop the dev server.

- [ ] **Step 5: Commit**

```bash
git add src/styles/global.css
git commit -m "feat(theme): switch material accent from purple to green"
```

---

## Task 2: Homepage greeting suffix

**Files:**
- Modify: `setting.toml` (`[intro]` table)
- Modify: `src/pages/index.astro` (frontmatter + template + style)
- Modify: `src/env.d.ts` (`IntroConfig` interface)

- [ ] **Step 1: Add the type field**

In `src/env.d.ts`, change the `IntroConfig` interface so `name_suffix` is recognized:

```ts
interface IntroConfig {
  name?: string;
  role?: string;
  greeting?: string;
  description?: string;
  intro_tags?: string[];
  name_suffix?: string;
}
```

- [ ] **Step 2: Add the config value**

In `setting.toml`, edit the `[intro]` section to include the suffix:

```toml
[intro]
greeting = "안녕하세요,"
name = "benidjor"
name_suffix = " 입니다."
role = "Data Engineer"
description = """당장의 효율보다, 끝까지 파고들어 답을 찾고 기록합니다.
데이터 엔지니어로 성장하기 위한 학습과 회고."""
intro_tags = ["Spark", "Airflow", "Kafka", "Iceberg", "Trino", "Snowflake"]
```

- [ ] **Step 3: Read the suffix in the page frontmatter**

In `src/pages/index.astro`, in the frontmatter block (around lines 13–18), add the suffix read after `introTags`:

```ts
const introTags = intro.intro_tags || [];
const introNameSuffix = intro.name_suffix || '';
```

- [ ] **Step 4: Render the conditional sibling span**

In `src/pages/index.astro`, replace the existing greeting block (around lines 44–47):

```astro
<h1 class="intro__greeting">
  {introGreeting}<br />
  <span class="intro__name">{introName}</span>{introNameSuffix && (
    <span class="intro__name-suffix">{introNameSuffix}</span>
  )}
</h1>
```

- [ ] **Step 5: Add the suffix style**

In the `<style>` block of `src/pages/index.astro`, add a rule directly after `.intro__name` (around line 184):

```css
  .intro__name-suffix {
    display: inline-block;
    margin-left: var(--spacing-xs);
    color: var(--text-primary);
    font-weight: inherit;
  }
```

- [ ] **Step 6: Build & visual smoke**

Run: `npm run build`
Expected: build succeeds.

Run: `npm run dev`
Open http://localhost:4321 and confirm the hero reads "안녕하세요," on line 1 and "benidjor 입니다." on line 2, with `benidjor` in the colored accent box and `입니다.` as plain text immediately to its right. Stop the dev server.

- [ ] **Step 7: Commit**

```bash
git add setting.toml src/env.d.ts src/pages/index.astro
git commit -m "feat(home): add intro name_suffix for natural Korean greeting"
```

---

## Task 3: Relative-date helper (TDD)

**Files:**
- Create: `src/utils/relativeDate.ts`
- Create: `src/utils/__tests__/relativeDate.test.ts`

This helper takes a post date and a locale, and returns a short relative-time string. Returns `null` for dates older than 365 days (homepage suppresses the hint past a year).

- [ ] **Step 1: Write the failing tests**

Create `src/utils/__tests__/relativeDate.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { getRelativeDate } from '../relativeDate';

const FIXED_NOW = new Date('2026-05-04T00:00:00Z').getTime();

describe('getRelativeDate', () => {
  it('returns "오늘" for a date today (ko)', () => {
    const date = new Date('2026-05-04T08:00:00Z');
    expect(getRelativeDate(date, 'ko-KR', FIXED_NOW)).toBe('오늘');
  });

  it('returns "today" for a date today (en)', () => {
    const date = new Date('2026-05-04T08:00:00Z');
    expect(getRelativeDate(date, 'en-US', FIXED_NOW)).toBe('today');
  });

  it('returns "1일 전" exactly 1 day ago (ko)', () => {
    const date = new Date('2026-05-03T00:00:00Z');
    expect(getRelativeDate(date, 'ko-KR', FIXED_NOW)).toBe('1일 전');
  });

  it('returns "1 day ago" exactly 1 day ago (en)', () => {
    const date = new Date('2026-05-03T00:00:00Z');
    expect(getRelativeDate(date, 'en-US', FIXED_NOW)).toBe('1 day ago');
  });

  it('returns "6일 전" within the same week (ko)', () => {
    const date = new Date('2026-04-28T00:00:00Z');
    expect(getRelativeDate(date, 'ko-KR', FIXED_NOW)).toBe('6일 전');
  });

  it('returns weeks for 7 to 29 days ago (ko)', () => {
    const date = new Date('2026-04-20T00:00:00Z'); // 14 days ago
    expect(getRelativeDate(date, 'ko-KR', FIXED_NOW)).toBe('2주 전');
  });

  it('returns weeks for 7 to 29 days ago (en)', () => {
    const date = new Date('2026-04-20T00:00:00Z'); // 14 days ago
    expect(getRelativeDate(date, 'en-US', FIXED_NOW)).toBe('2 weeks ago');
  });

  it('returns months for 30+ days ago (ko)', () => {
    const date = new Date('2026-02-04T00:00:00Z'); // ~89 days ago
    expect(getRelativeDate(date, 'ko-KR', FIXED_NOW)).toBe('3개월 전');
  });

  it('returns months for 30+ days ago (en)', () => {
    const date = new Date('2026-02-04T00:00:00Z');
    expect(getRelativeDate(date, 'en-US', FIXED_NOW)).toBe('3 months ago');
  });

  it('returns null for dates older than 365 days', () => {
    const date = new Date('2025-04-01T00:00:00Z'); // ~398 days ago
    expect(getRelativeDate(date, 'ko-KR', FIXED_NOW)).toBeNull();
    expect(getRelativeDate(date, 'en-US', FIXED_NOW)).toBeNull();
  });

  it('returns null for future dates', () => {
    const date = new Date('2026-05-05T00:00:00Z');
    expect(getRelativeDate(date, 'ko-KR', FIXED_NOW)).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/utils/__tests__/relativeDate.test.ts`
Expected: all tests FAIL with "Cannot find module '../relativeDate'" or similar.

- [ ] **Step 3: Implement the helper**

Create `src/utils/relativeDate.ts`:

```ts
const DAY_MS = 24 * 60 * 60 * 1000;

type SupportedLocale = 'ko-KR' | 'en-US';

interface Phrases {
  today: string;
  daysAgo: (n: number) => string;
  weeksAgo: (n: number) => string;
  monthsAgo: (n: number) => string;
}

const phrases: Record<SupportedLocale, Phrases> = {
  'ko-KR': {
    today: '오늘',
    daysAgo: (n) => `${n}일 전`,
    weeksAgo: (n) => `${n}주 전`,
    monthsAgo: (n) => `${n}개월 전`,
  },
  'en-US': {
    today: 'today',
    daysAgo: (n) => `${n} day${n === 1 ? '' : 's'} ago`,
    weeksAgo: (n) => `${n} week${n === 1 ? '' : 's'} ago`,
    monthsAgo: (n) => `${n} month${n === 1 ? '' : 's'} ago`,
  },
};

function resolveLocale(locale: string): SupportedLocale {
  return locale === 'en-US' ? 'en-US' : 'ko-KR';
}

export function getRelativeDate(date: Date, locale: string, now: number = Date.now()): string | null {
  const diffMs = now - date.getTime();
  if (diffMs < 0) return null;

  const days = Math.floor(diffMs / DAY_MS);
  if (days > 365) return null;

  const p = phrases[resolveLocale(locale)];
  if (days === 0) return p.today;
  if (days < 7) return p.daysAgo(days);
  if (days < 30) return p.weeksAgo(Math.floor(days / 7));
  return p.monthsAgo(Math.floor(days / 30));
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/utils/__tests__/relativeDate.test.ts`
Expected: all 11 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/utils/relativeDate.ts src/utils/__tests__/relativeDate.test.ts
git commit -m "feat(utils): add localized relative-date helper for homepage hints"
```

---

## Task 4: Recent posts — single-column layout

**Files:**
- Modify: `src/pages/index.astro` (frontmatter, template, style, script)

- [ ] **Step 1: Reduce post count and import the helper**

In `src/pages/index.astro`, change the frontmatter top region. Replace the import block and the `recentPosts` slice. After the change, lines ~1–28 read:

```ts
---
import { getCollection } from 'astro:content';
import BaseLayout from '../layouts/BaseLayout.astro';
import { getTagStyle } from '../utils/tagColor';
import { t } from '../i18n';
import { getPostsForLocale, getPostUrl } from '../utils/i18nRouting';
import { getRelativeDate } from '../utils/relativeDate';

const base = import.meta.env.BASE_URL;
const baseUrl = base.endsWith('/') ? base : `${base}/`;
const dateLocale = t('dateLocale');
const blogName = import.meta.env.BLOG_NAME || 'My Blog';

const intro = import.meta.env.INTRO || {};
const introName = intro.name || 'Your Name';
const introRole = intro.role || 'Developer';
const introGreeting = intro.greeting || "Hello, I'm";
const introDescription = intro.description || 'Welcome to my blog.';
const introTags = intro.intro_tags || [];
const introNameSuffix = intro.name_suffix || '';

const allPosts = await getCollection('posts');
const recentPosts = getPostsForLocale(allPosts)
  .sort((a, b) => {
    const dateDiff = new Date(b.data.date).getTime() - new Date(a.data.date).getTime();
    if (dateDiff !== 0) return dateDiff;
    return (b.data.publish_sync_at ?? '').localeCompare(a.data.publish_sync_at ?? '');
  })
  .slice(0, 5);
---
```

(Note: `introNameSuffix` was already added in Task 2; this step keeps it and adds `getRelativeDate` import + `slice(0, 5)`.)

- [ ] **Step 2: Add the relative-time hint to the meta block**

In the same file, replace the existing `.post-card__meta` block (around lines 82–90) with:

```astro
<div class="post-card__meta">
  <time class="post-card__date">
    {new Date(post.data.date).toLocaleDateString(dateLocale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })}
  </time>
  {(() => {
    const rel = getRelativeDate(new Date(post.data.date), dateLocale);
    return rel ? <span class="post-card__relative">· {rel}</span> : null;
  })()}
</div>
```

- [ ] **Step 3: Switch to single-column grid and add relative-hint style**

In the same file's `<style>` block, replace `.recent-posts__list` (around lines 319–323):

```css
  .recent-posts__list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-lg);
  }
```

Then, immediately after `.post-card__date` (around lines 359–365), add:

```css
  .post-card__relative {
    font-family: var(--font-mono);
    font-size: var(--font-size-xs);
    color: var(--text-muted);
  }
```

Also remove the now-redundant `.recent-posts__list { grid-template-columns: 1fr }` rule from the `@media (max-width: 768px)` block (around line 452–454):

```css
  @media (max-width: 768px) {
    .intro__greeting {
      font-size: var(--font-size-4xl);
    }

    .intro__role {
      font-size: var(--font-size-lg);
    }

    .intro__desc {
      font-size: var(--font-size-base);
    }

    .section-header {
      flex-direction: column;
      align-items: flex-start;
      gap: var(--spacing-md);
    }

    .post-card__meta {
      flex-wrap: wrap;
    }
  }
```

(i.e. drop the `.recent-posts__list { grid-template-columns: 1fr }` rule that was inside this media query.)

- [ ] **Step 4: Remove the ResizeObserver script**

In the same file, **delete the entire `<script>` block** (lines 114–147). Its responsibility (column-aware card visibility) is no longer needed because the list is single-column with a fixed slice.

- [ ] **Step 5: Build & visual smoke**

Run: `npm run build`
Expected: build succeeds.

Run: `npm run dev`
Open http://localhost:4321. Confirm:
- Recent posts section shows posts stacked vertically (single column at all widths).
- At most 5 cards visible.
- Each card's meta line shows the absolute date AND a relative hint like `· 1일 전` (when within 365 days).
- Resize the browser window: layout stays single-column, no JS error in console.

Stop the dev server.

- [ ] **Step 6: Commit**

```bash
git add src/pages/index.astro
git commit -m "feat(home): single-column recent posts with relative-time hint"
```

---

## Task 5: Reading theme — i18n keys & ThemeSelector option

**Files:**
- Modify: `src/i18n/translations/en.ts`
- Modify: `src/i18n/translations/ko.ts`
- Modify: `src/components/ThemeSelector.astro`

- [ ] **Step 1: Add English keys**

In `src/i18n/translations/en.ts`, in the "Design theme selector" group (after `glassmorphismDesc`, around line 45), add:

```ts
  glassmorphism: 'Glassmorphism',
  glassmorphismDesc: 'Translucent glass effect',
  reading: 'Reading',
  readingDesc: 'Serif type, warm paper, content-first',
```

- [ ] **Step 2: Add Korean keys**

In `src/i18n/translations/ko.ts`, in the same group (around line 47), add:

```ts
  glassmorphism: 'Glassmorphism',
  glassmorphismDesc: '반투명 유리 효과',
  reading: 'Reading',
  readingDesc: '세리프 본문, 따뜻한 종이 톤, 콘텐츠 중심',
```

- [ ] **Step 3: Add the 4th theme option**

In `src/components/ThemeSelector.astro`, after the `glassmorphism` `<li>` (around lines 46–55), insert a new `<li>` so the list ends with reading:

```astro
    <li
      class="theme-selector__option"
      role="option"
      data-design-theme="glassmorphism"
      tabindex="0"
    >
      <span class="theme-selector__option-icon">○</span>
      <span class="theme-selector__option-name">{t('glassmorphism')}</span>
      <span class="theme-selector__option-desc">{t('glassmorphismDesc')}</span>
    </li>
    <li
      class="theme-selector__option"
      role="option"
      data-design-theme="reading"
      tabindex="0"
    >
      <span class="theme-selector__option-icon">○</span>
      <span class="theme-selector__option-name">{t('reading')}</span>
      <span class="theme-selector__option-desc">{t('readingDesc')}</span>
    </li>
```

No JS changes are needed: the existing `setDesignTheme` script works off the `data-design-theme` attribute.

- [ ] **Step 4: Build to verify TS types**

Run: `npm run build`
Expected: build succeeds. The `TranslationKey` type (derived from `keyof typeof en`) automatically picks up the new keys; if the build fails on a missing key in `ko`, recheck Step 2.

- [ ] **Step 5: Visual smoke (selector only — theme block comes in Task 6)**

Run: `npm run dev`
Open the theme selector dropdown in the header. Confirm a 4th entry "Reading" appears after "Glassmorphism" with the correct subtitle in the current locale. Selecting it sets `data-design-theme="reading"` on `<html>` (visible via DevTools), but the page may look unchanged because the CSS block is added in Task 6 — that is expected.

Stop the dev server.

- [ ] **Step 6: Commit**

```bash
git add src/i18n/translations/en.ts src/i18n/translations/ko.ts src/components/ThemeSelector.astro
git commit -m "feat(theme): expose reading option in theme selector"
```

---

## Task 6: Reading theme — CSS block & serif scope

**Files:**
- Modify: `src/styles/global.css`

- [ ] **Step 1: Add the reading theme block**

In `src/styles/global.css`, at the end of the file (after the existing `[data-design-theme="glassmorphism"][data-theme="dark"]` rules ending around line 618), append exactly this block:

```css

/* ============================================
 * Design Theme: Reading
 * ============================================ */
[data-design-theme="reading"] {
  --border-width: 1px;
  --radius: 4px;
  --shadow-offset: 0;
  --card-shadow: none;
  --card-hover-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
  --backdrop-blur: none;
  --surface-opacity: 1;

  --bg-primary: #FBF7F0;
  --bg-secondary: #F4EFE6;
  --border-color: #D9D2C5;
  --text-primary: #2A2722;
  --text-secondary: #5A544B;
  --text-muted: #8A8378;
  --shadow-color: rgba(42, 39, 34, 0.12);

  --accent: #6B5B3E;
  --accent-hover: #8A7651;

  --font-serif: 'Noto Serif KR', 'Source Serif Pro', Georgia, serif;
}

[data-design-theme="reading"][data-theme="dark"] {
  --bg-primary: #1F1B16;
  --bg-secondary: #2A251F;
  --border-color: #4A4238;
  --text-primary: #EDE5D5;
  --text-secondary: #BDB4A2;
  --text-muted: #8A8378;
  --shadow-color: rgba(0, 0, 0, 0.4);

  --accent: #D4B881;
  --accent-hover: #E8CFA0;
}

[data-design-theme="reading"] .post__content,
[data-design-theme="reading"] .post__content p,
[data-design-theme="reading"] .post__description,
[data-design-theme="reading"] .intro__desc {
  font-family: var(--font-serif);
}

[data-design-theme="reading"] .post-card,
[data-design-theme="reading"] .intro__name {
  box-shadow: none;
}

[data-design-theme="reading"] .post-card:hover {
  box-shadow: var(--card-hover-shadow);
  transform: translate(-1px, -1px);
}
```

Notes (informational, no separate edit needed):
- The `--font-serif` token falls back to system serif if `Noto Serif KR` is not loaded — no webfont preload added in this change (per spec §Cross-cutting concerns).
- `box-shadow: none` overrides apply to `.post-card` and `.intro__name` to neutralize the neo-brutalism-style hard shadow those classes carry by default in `index.astro`.
- This is the **global** stylesheet, so plain descendant selectors (`.post__content p`) are used — `:global(...)` is an Astro scoped-style construct that does not apply here.

- [ ] **Step 2: Build to verify CSS validity**

Run: `npm run build`
Expected: build succeeds, no parser errors.

- [ ] **Step 3: Visual smoke across modes and routes**

Run: `npm run dev`. In the theme selector, switch to **Reading**.

Confirm on `/`:
- Background is warm cream (`#FBF7F0`), not white.
- The "당장의 효율보다..." description renders in a serif font.
- Cards are flat (no hard shadow); on hover, a subtle 1–2px shadow appears.
- The intro name box (e.g. "benidjor") has no hard shadow.

Confirm on a post detail page:
- Body paragraphs render in serif.
- The hard shadow on tables/images is gone or minimal (default neo-brutalism shadows still appear because they are set in `PostLayout.astro` style block — this is acceptable and out of scope; the spec defines reading theme as content-first body, not a full reskin of post chrome).

Toggle dark mode (header sun/moon button). Confirm dark variant uses the brown ink palette.

Stop the dev server.

- [ ] **Step 4: Commit**

```bash
git add src/styles/global.css
git commit -m "feat(theme): add reading theme with warm paper palette and serif body"
```

---

## Task 7: Categories — zod schema

**Files:**
- Modify: `src/content/config.ts`

- [ ] **Step 1: Add the optional category enum**

Replace the contents of `src/content/config.ts` with:

```ts
import { defineCollection, z } from 'astro:content';

// Category slugs must match `[categories].order` in setting.toml.
// Update both when adding a category.
const CATEGORY_SLUGS = ['projects', 'til'] as const;

const posts = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.date(),
    tags: z.array(z.string()).optional(),
    summary: z.string().optional(),
    aliases: z.array(z.string()).optional(),
    created: z.string().optional(),
    modified: z.string().optional(),
    lang: z.string().optional(),
    translated_from: z.string().optional(),
    translate_sync_at: z.string().optional(),
    publish_sync_at: z.string().optional(),
    category: z.enum(CATEGORY_SLUGS).optional(),
  }),
});

export const collections = { posts };
```

- [ ] **Step 2: Build to verify the schema accepts existing posts**

Run: `npm run build`
Expected: build succeeds. Existing posts have no `category` field; the field is optional, so they pass validation.

- [ ] **Step 3: Commit**

```bash
git add src/content/config.ts
git commit -m "feat(content): add optional category field to post schema"
```

---

## Task 8: Categories — config plumbing

**Files:**
- Modify: `setting.toml`
- Modify: `astro.config.mjs`
- Modify: `src/env.d.ts`

- [ ] **Step 1: Add the categories table to setting.toml**

In `setting.toml`, after the `[posts]` section (or anywhere before `[comments]`, the placement is not load-bearing), add:

```toml
# === Categories ===
[categories]
order = ["projects", "til"]

[categories.projects]
label_ko = "Projects"
label_en = "Projects"
description_ko = "데이터 엔지니어링 실무 / 사이드 프로젝트 시리즈."
description_en = "Data engineering work and side-project series."

[categories.til]
label_ko = "TIL"
label_en = "TIL"
description_ko = "오늘 배운 것 — 짧은 호흡의 학습 기록."
description_en = "Today I learned — short, frequent learning notes."
```

- [ ] **Step 2: Inject CATEGORIES into vite define**

In `astro.config.mjs`, in the `vite.define` block (around lines 50–57), add the `CATEGORIES` line:

```js
  vite: {
    define: {
      'import.meta.env.BLOG_NAME': JSON.stringify(settings.blog_name),
      'import.meta.env.LOCALE': JSON.stringify(settings.locale || 'en'),
      'import.meta.env.INTRO': JSON.stringify(settings.intro || {}),
      'import.meta.env.CATEGORIES': JSON.stringify(settings.categories || { order: [] }),
      'import.meta.env.COMMENTS': JSON.stringify(settings.comments || { enabled: false }),
      'import.meta.env.ANALYTICS': JSON.stringify(settings.analytics || { enabled: false }),
    },
  },
```

- [ ] **Step 3: Type the env**

Replace `src/env.d.ts` contents with:

```ts
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
```

- [ ] **Step 4: Build to verify config wiring**

Run: `npm run build`
Expected: build succeeds. No "Cannot read property X of undefined" errors.

- [ ] **Step 5: Commit**

```bash
git add setting.toml astro.config.mjs src/env.d.ts
git commit -m "feat(config): wire categories config into vite env"
```

---

## Task 9: Categories — i18n keys

**Files:**
- Modify: `src/i18n/translations/en.ts`
- Modify: `src/i18n/translations/ko.ts`

- [ ] **Step 1: Add English keys**

In `src/i18n/translations/en.ts`, after the "Tags page" group (after `backToTags`, around line 20), add a new "Categories page" group:

```ts
  // Categories page
  categories: 'Categories',
  category: 'Category',
  categoriesPageTitle: 'Categories',
  categoriesPageSubtitle: '{count} categories',
  categoryPageTitle: 'Category: {category}',
  categoryPostsCount: '{count} posts',
  noPostsInCategory: 'No posts in this category.',
  backToCategories: '← Categories',
```

- [ ] **Step 2: Add Korean keys**

In `src/i18n/translations/ko.ts`, after `backToTags` (around line 22), add the matching block:

```ts
  // Categories page
  categories: '카테고리',
  category: '카테고리',
  categoriesPageTitle: '카테고리',
  categoriesPageSubtitle: '{count}개의 카테고리',
  categoryPageTitle: '카테고리: {category}',
  categoryPostsCount: '{count}개의 포스트',
  noPostsInCategory: '이 카테고리의 포스트가 없습니다.',
  backToCategories: '← 카테고리',
```

- [ ] **Step 3: Build to verify all keys exist in both locales**

Run: `npm run build`
Expected: build succeeds. If the build fails with "Property 'X' is missing in type Record<TranslationKey, string>", the corresponding key was forgotten in `ko.ts`.

- [ ] **Step 4: Commit**

```bash
git add src/i18n/translations/en.ts src/i18n/translations/ko.ts
git commit -m "feat(i18n): add categories translation keys"
```

---

## Task 10: Categories — `/categories/index.astro`

**Files:**
- Create: `src/pages/categories/index.astro`

- [ ] **Step 1: Create the categories landing page**

Create `src/pages/categories/index.astro`:

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';
import { t, getLocale } from '../../i18n';
import { getPostsForLocale } from '../../utils/i18nRouting';

interface CategoryEntry {
  label_ko: string;
  label_en: string;
  description_ko: string;
  description_en: string;
}

const base = import.meta.env.BASE_URL;
const baseUrl = base.endsWith('/') ? base : `${base}/`;
const locale = getLocale();

const categoriesConfig = import.meta.env.CATEGORIES || { order: [] };
const order: string[] = categoriesConfig.order || [];

const allPosts = await getCollection('posts');
const posts = getPostsForLocale(allPosts);

const categories = order.map((slug) => {
  const entry = categoriesConfig[slug] as CategoryEntry | undefined;
  const label = entry ? (locale === 'ko' ? entry.label_ko : entry.label_en) : slug;
  const description = entry ? (locale === 'ko' ? entry.description_ko : entry.description_en) : '';
  const count = posts.filter((post) => post.data.category === slug).length;
  return { slug, label, description, count };
});
---

<BaseLayout title={t('categoriesPageTitle')} description={t('categoriesPageTitle')}>
  <div class="container">
    <div class="categories-page">
      <h1 class="categories-page__title">{t('categoriesPageTitle')}</h1>
      <p class="categories-page__subtitle">
        {t('categoriesPageSubtitle', { count: categories.length })}
      </p>

      <div class="categories-page__list">
        {categories.map((cat) => (
          <a href={`${baseUrl}categories/${cat.slug}`} class="category-card">
            <h2 class="category-card__title">{cat.label}</h2>
            <p class="category-card__count">
              {t('categoryPostsCount', { count: cat.count })}
            </p>
            <p class="category-card__description">{cat.description}</p>
          </a>
        ))}
      </div>
    </div>
  </div>
</BaseLayout>

<style>
  .categories-page {
    max-width: 800px;
    margin: 0 auto;
    padding: 0 var(--spacing-lg);
  }

  .categories-page__title {
    font-family: var(--font-display);
    font-size: var(--font-size-4xl);
    font-weight: 900;
    margin: 0 0 var(--spacing-md) 0;
    text-transform: uppercase;
  }

  .categories-page__subtitle {
    font-size: var(--font-size-lg);
    color: var(--text-secondary);
    margin: 0 0 var(--spacing-2xl) 0;
  }

  .categories-page__list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-lg);
  }

  .category-card {
    display: block;
    padding: var(--spacing-xl);
    border: var(--border-width) solid var(--border-color);
    background-color: var(--bg-secondary);
    text-decoration: none;
    color: var(--text-primary);
    transition: transform var(--transition-fast), box-shadow var(--transition-fast);
  }

  .category-card:hover {
    transform: translate(-2px, -2px);
    box-shadow: 4px 4px 0 var(--shadow-color);
    background-color: var(--bg-primary);
  }

  .category-card__title {
    margin: 0 0 var(--spacing-xs) 0;
    font-size: var(--font-size-2xl);
    color: var(--accent);
  }

  .category-card__count {
    margin: 0 0 var(--spacing-md) 0;
    font-family: var(--font-mono);
    font-size: var(--font-size-sm);
    color: var(--text-muted);
  }

  .category-card__description {
    margin: 0;
    color: var(--text-secondary);
    line-height: var(--line-height-normal);
  }
</style>
```

- [ ] **Step 2: Build & visual verify**

Run: `npm run build`
Expected: `dist/categories/index.html` is produced.

Run: `npm run dev`. Visit http://localhost:4321/categories/. Confirm:
- Two category cards (Projects, TIL) in the order from `setting.toml`.
- Each card shows label, post count, and Korean description (since locale is `ko`).
- Hover effect works.
- Clicking a card navigates to `/categories/projects` or `/categories/til` (404 expected — page not yet created in Task 11).

Stop the dev server.

- [ ] **Step 3: Commit**

```bash
git add src/pages/categories/index.astro
git commit -m "feat(categories): add categories landing page"
```

---

## Task 11: Categories — `/categories/[slug].astro`

**Files:**
- Create: `src/pages/categories/[slug].astro`

- [ ] **Step 1: Create the per-category page**

Create `src/pages/categories/[slug].astro`:

```astro
---
import type { CollectionEntry } from 'astro:content';
import { getCollection } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';
import { t, getLocale } from '../../i18n';
import { getPostsForLocale, getPostUrl } from '../../utils/i18nRouting';

interface CategoryEntry {
  label_ko: string;
  label_en: string;
  description_ko: string;
  description_en: string;
}

export async function getStaticPaths() {
  const categoriesConfig = import.meta.env.CATEGORIES || { order: [] };
  const order: string[] = categoriesConfig.order || [];

  const allPosts = await getCollection('posts');
  const posts = getPostsForLocale(allPosts);

  return order.map((slug) => ({
    params: { slug },
    props: {
      slug,
      posts: posts
        .filter((post) => post.data.category === slug)
        .sort((a, b) => {
          const dateDiff = new Date(b.data.date).getTime() - new Date(a.data.date).getTime();
          if (dateDiff !== 0) return dateDiff;
          return (b.data.publish_sync_at ?? '').localeCompare(a.data.publish_sync_at ?? '');
        }),
    },
  }));
}

interface Props {
  slug: string;
  posts: CollectionEntry<'posts'>[];
}

const { slug, posts } = Astro.props;

const base = import.meta.env.BASE_URL;
const baseUrl = base.endsWith('/') ? base : `${base}/`;
const dateLocale = t('dateLocale');
const locale = getLocale();

const categoriesConfig = import.meta.env.CATEGORIES || { order: [] };
const entry = categoriesConfig[slug] as CategoryEntry | undefined;
const label = entry ? (locale === 'ko' ? entry.label_ko : entry.label_en) : slug;
const description = entry ? (locale === 'ko' ? entry.description_ko : entry.description_en) : '';
---

<BaseLayout
  title={t('categoryPageTitle', { category: label })}
  description={description || t('categoryPageTitle', { category: label })}
>
  <div class="container">
    <div class="category-page">
      <div class="category-page__header">
        <a href={`${baseUrl}categories`} class="category-page__back">{t('backToCategories')}</a>
        <h1 class="category-page__title">{label}</h1>
        <p class="category-page__count">{t('categoryPostsCount', { count: posts.length })}</p>
        {description && <p class="category-page__description">{description}</p>}
      </div>

      <div class="category-page__posts">
        {posts.length > 0 ? (
          <div class="posts-list">
            {posts.map((post) => (
              <article class="post-card">
                <h2 class="post-card__title">
                  <a href={getPostUrl(post, baseUrl)}>{post.data.title}</a>
                </h2>
                <p class="post-card__date">
                  {new Date(post.data.date).toLocaleDateString(dateLocale, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
                {post.data.summary && (
                  <p class="post-card__summary">{post.data.summary}</p>
                )}
              </article>
            ))}
          </div>
        ) : (
          <p class="category-page__empty">{t('noPostsInCategory')}</p>
        )}
      </div>
    </div>
  </div>
</BaseLayout>

<style>
  .category-page {
    max-width: 800px;
    margin: 0 auto;
    padding: 0 var(--spacing-lg);
  }

  .category-page__header {
    margin-bottom: var(--spacing-2xl);
  }

  .category-page__back {
    display: inline-block;
    margin-bottom: var(--spacing-md);
    color: var(--text-secondary);
    text-decoration: none;
    font-weight: 600;
    transition: color var(--transition-fast);
  }

  .category-page__back:hover {
    color: var(--text-primary);
  }

  .category-page__title {
    font-family: var(--font-display);
    font-size: var(--font-size-4xl);
    font-weight: 900;
    margin: 0 0 var(--spacing-md) 0;
    text-transform: uppercase;
  }

  .category-page__count {
    font-size: var(--font-size-lg);
    color: var(--text-secondary);
    margin: 0 0 var(--spacing-md) 0;
  }

  .category-page__description {
    font-size: var(--font-size-base);
    color: var(--text-secondary);
    line-height: var(--line-height-relaxed);
    margin: 0;
    padding: var(--spacing-md);
    border-left: 3px solid var(--accent);
    background-color: var(--bg-secondary);
  }

  .category-page__empty {
    text-align: center;
    color: var(--text-secondary);
    padding: var(--spacing-2xl);
  }

  .posts-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-lg);
  }

  .post-card {
    padding: var(--spacing-lg);
    border: var(--border-width) solid var(--border-color);
    background-color: var(--bg-secondary);
    transition: transform var(--transition-fast), box-shadow var(--transition-fast);
  }

  .post-card:hover {
    transform: translate(-2px, -2px);
    box-shadow: 4px 4px 0 var(--shadow-color);
  }

  .post-card__title {
    margin: 0 0 var(--spacing-sm) 0;
    font-size: var(--font-size-xl);
  }

  .post-card__title a {
    text-decoration: none;
    color: var(--text-primary);
    transition: color var(--transition-fast);
  }

  .post-card__title a:hover {
    color: var(--accent);
  }

  .post-card__date {
    margin: 0 0 var(--spacing-md) 0;
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
  }

  .post-card__summary {
    margin: 0;
    color: var(--text-secondary);
    line-height: 1.6;
  }
</style>
```

- [ ] **Step 2: Build & visual verify (will be empty until Task 13)**

Run: `npm run build`
Expected: `dist/categories/projects/index.html` and `dist/categories/til/index.html` produced.

Run: `npm run dev`. Visit `/categories/projects` and `/categories/til`. Both pages render but show "이 카테고리의 포스트가 없습니다." because no posts have a `category` field yet — that comes in Task 13.

Stop the dev server.

- [ ] **Step 3: Commit**

```bash
git add src/pages/categories/[slug].astro
git commit -m "feat(categories): add per-category listing page"
```

---

## Task 12: Categories — header nav link & post page badge

**Files:**
- Modify: `src/layouts/BaseLayout.astro`
- Modify: `src/layouts/PostLayout.astro`

- [ ] **Step 1: Add the Categories nav link**

In `src/layouts/BaseLayout.astro`, replace the `<nav>` block (lines 72–76):

```astro
         <nav class="header__nav">
           <a href={baseUrl} class="header__link">Home</a>
           <a href={`${baseUrl}posts`} class="header__link">Posts</a>
           <a href={`${baseUrl}categories`} class="header__link">Categories</a>
           <a href={`${baseUrl}tags`} class="header__link">Tags</a>
         </nav>
```

- [ ] **Step 2: Add a category badge to the post page**

In `src/layouts/PostLayout.astro`, the page uses `Astro.props` and does not currently receive `category`. We need to thread it through.

First, add `category` to the Props interface (around lines 20–30):

```ts
interface Props {
  title: string;
  description?: string;
  date?: Date;
  tags?: string[];
  headings?: Heading[];
  readingTime?: number;
  lang?: string;
  translations?: Translation[];
  currentUrl?: string;
  category?: string;
}
```

Then update the destructuring (line 32):

```ts
const { title, description, date, tags = [], headings = [], readingTime, lang, translations = [], currentUrl, category } = Astro.props;
```

Then, inside the `.post__meta` block, after the `<ViewCount path={currentPath} />` line (around line 78), append the badge:

```astro
          <ViewCount path={currentPath} />
          {category && (
            <a href={`${baseUrl}categories/${category}`} class="post__category">
              {t('category')}: {category}
            </a>
          )}
```

Add the style at the end of the existing `<style>` block (just before the closing `</style>`):

```css
  .post__category {
    font-family: var(--font-mono);
    font-size: var(--font-size-sm);
    padding: var(--spacing-xs) var(--spacing-sm);
    background-color: var(--bg-secondary);
    color: var(--text-secondary);
    border: 2px solid var(--border-color);
    text-decoration: none;
    transition: transform var(--transition-fast), box-shadow var(--transition-fast), background-color var(--transition-fast);
  }

  .post__category:hover {
    transform: translate(-1px, -1px);
    box-shadow: 2px 2px 0 var(--shadow-color);
    background-color: var(--accent);
    color: #000000;
  }
```

- [ ] **Step 3: Pass `category` from the default-locale post route to PostLayout**

In `src/pages/posts/[...slug].astro`:

First, add `category` to the destructured fields (line 19):

```ts
const { title, summary, date, tags, lang, category } = post.data;
```

Then add the prop to the `<PostLayout>` call (between `lang={lang}` and `translations=...`, around line 36):

```astro
<PostLayout
  title={title}
  description={hasSummaryCallout ? undefined : summary}
  date={date}
  tags={tags}
  headings={headings}
  readingTime={readingTime}
  lang={lang}
  category={category}
  translations={translations.map(t => ({ lang: t.lang, url: getPostUrl(t.post, baseUrl) }))}
  currentUrl={currentUrl}
>
  <Content />
</PostLayout>
```

- [ ] **Step 4: Pass `category` from the translated-locale post route to PostLayout**

In `src/pages/[lang]/posts/[...slug].astro`, make the same two edits — add `category` to the destructure (line 22):

```ts
const { title, summary, date, tags, lang, category } = post.data;
```

And to the `<PostLayout>` call (around line 39):

```astro
<PostLayout
  title={title}
  description={hasSummaryCallout ? undefined : summary}
  date={date}
  tags={tags}
  headings={headings}
  readingTime={readingTime}
  lang={lang}
  category={category}
  translations={translations.map(t => ({ lang: t.lang, url: getPostUrl(t.post, baseUrl) }))}
  currentUrl={currentUrl}
>
  <Content />
</PostLayout>
```

Note: a translated post carries its own `category` field in frontmatter (no automatic inheritance from the original). For now both vault posts are Korean originals only, so this is informational; translations created later should set `category` on the translated file too.

- [ ] **Step 5: Build & visual verify**

Run: `npm run build`
Expected: build succeeds.

Run: `npm run dev`. Confirm:
- Header nav reads "Home / Posts / Categories / Tags".
- Visiting a post that does NOT have `category` (everything currently) renders without the badge — no error.

Stop the dev server. (Posts will gain badges after Task 13.)

- [ ] **Step 6: Commit**

```bash
git add src/layouts/BaseLayout.astro src/layouts/PostLayout.astro src/pages/posts/[...slug].astro src/pages/[lang]/posts/[...slug].astro
git commit -m "feat(categories): expose categories in nav and on post pages"
```

---

## Task 13: Vault frontmatter migration & sync

**Files:**
- Edit (in vault, NOT in repo): `/Users/aryijq/Documents/obsidian-vault/01 Projects/01-07 blog/서울-도시데이터-플랫폼-시리즈-왜-무엇을-어떻게.md`
- Edit (in vault, NOT in repo): `/Users/aryijq/Documents/obsidian-vault/01 Projects/01-07 blog/블로그를-다시-시작하는-이유.md`

⚠️ **Important — Do NOT edit `src/content/posts/*.md` directly.** Per `CLAUDE.md` and memory, that directory is auto-generated by `npm run sync` from the vault and direct edits will be overwritten on next sync.

- [ ] **Step 1: Locate vault files**

Confirm the source vault path matches `setting.toml.source_root_path = "/Users/aryijq/Documents/obsidian-vault"` and the per-memory blog folder `01 Projects/01-07 blog/`. List candidates:

Run:
```bash
ls -1 "/Users/aryijq/Documents/obsidian-vault/01 Projects/01-07 blog/"
```
Expected: includes `서울-도시데이터-플랫폼-시리즈-왜-무엇을-어떻게.md` and `블로그를-다시-시작하는-이유.md` (file names may differ slightly in vault — match by content, not by filename).

If the file name in the vault differs from the synced filename, find it via:
```bash
grep -l 'title: "서울 도시데이터 플랫폼 시리즈' "/Users/aryijq/Documents/obsidian-vault/01 Projects/01-07 blog/"*.md
grep -l 'title: 블로그를 다시 시작하는 이유' "/Users/aryijq/Documents/obsidian-vault/01 Projects/01-07 blog/"*.md
```

- [ ] **Step 2: Add `category: projects` to the seoul-citydata post**

Open the seoul-citydata post in the vault and add `category: projects` to its frontmatter (anywhere in the YAML block, e.g. after `lang: ko`):

```yaml
---
title: 서울 도시데이터 플랫폼 시리즈 ① — 왜, 무엇을, 어떻게
date: 2026-05-03
publish: true
publish_sync_at: "2026-05-04 01:43:23"
lang: ko
category: projects
tags:
  - projects
  - seoul-citydata
  - data-platform
---
```

(Leaving `projects` in the `tags` array is intentional per spec §Out of scope — no tag cleanup in this change.)

- [ ] **Step 3: Add `category: til` to the meta post**

Open the "블로그를 다시 시작하는 이유" post in the vault and add:

```yaml
---
title: 블로그를 다시 시작하는 이유
date: 2026-05-03
publish: true
publish_sync_at: "2026-05-04 01:47:52"
lang: ko
category: til
tags:
  - til
  - meta
  - retrospective
---
```

- [ ] **Step 4: Run sync**

Run: `npm run sync`
Expected: incremental sync detects the modified files (their `modified` mtime is newer than `publish_sync_at`) and rewrites `src/content/posts/서울-도시데이터-플랫폼-시리즈-왜-무엇을-어떻게.md` and `src/content/posts/블로그를-다시-시작하는-이유.md` with the new frontmatter, updating `publish_sync_at`. About is untouched.

If sync reports "no changes," manually verify the vault frontmatter was saved with `category:` present.

- [ ] **Step 5: Build & visual verify categories pages now show posts**

Run: `npm run build`
Expected: build succeeds. Zod validates `category: 'projects'` and `category: 'til'`.

Run: `npm run dev`. Visit:
- `/categories/projects` — shows the seoul-citydata post.
- `/categories/til` — shows the "블로그를 다시 시작하는 이유" post.
- The original post page (`/posts/서울-도시데이터-플랫폼-시리즈-왜-무엇을-어떻게/`) shows a "카테고리: projects" badge.
- `/categories/` shows post counts: Projects (1), TIL (1).

Stop the dev server.

- [ ] **Step 6: Commit the synced repo files**

```bash
git add src/content/posts/서울-도시데이터-플랫폼-시리즈-왜-무엇을-어떻게.md src/content/posts/블로그를-다시-시작하는-이유.md
git commit -m "content: assign categories to existing posts (projects, til)"
```

(The vault edits live outside the repo — `01-07 blog/` is in the obsidian-vault git, not the blog repo, per project memory.)

---

## Task 14: Final smoke test across themes & locales

**Files:** none (verification only)

- [ ] **Step 1: Run the test suite**

Run: `npx vitest run`
Expected: all tests pass, including the new `relativeDate` tests and the existing `sync.test.ts` / `translate.test.ts`.

- [ ] **Step 2: Production build**

Run: `npm run build`
Expected: build succeeds, pagefind index produced (postbuild hook), no warnings about missing translation keys or zod validation failures.

- [ ] **Step 3: Cross-theme & cross-locale visual smoke**

Run: `npm run preview` (serves the prod build).

For each theme (Neo-Brutalism / Material / Glassmorphism / Reading) in both light and dark mode, walk:
- `/` — intro greeting reads "안녕하세요, / benidjor 입니다.", recent posts in single column with relative-time hints.
- `/categories/` — landing page lists Projects + TIL with counts.
- `/categories/projects` — shows the seoul-citydata post with intro description visible.
- `/categories/til` — shows the meta post.
- A post detail page — category badge appears, content renders.
- `/posts` — post list works.
- `/tags` — tags page works (tags `projects`/`til` still present, intentional).

Confirm no console errors. Confirm Material accent is green in all 4 places it appears (logo, intro__name, button hover, link hover). Confirm Reading theme uses serif body and warm paper background.

- [ ] **Step 4: Lighthouse / regression sanity (optional)**

If desired, run a quick Lighthouse pass on `/` and a post page in the prod preview. No regression vs baseline expected — single-column posts and removal of `ResizeObserver` should slightly improve layout-shift scores.

- [ ] **Step 5: Final commit (if any leftover formatting / lockfile updates)**

```bash
git status
# If clean, no commit needed.
# If there are leftover changes (formatting, generated files), inspect and commit deliberately.
```

---

## Self-review notes (already applied)

- Spec §Implementation order has been re-numbered to 5 items reflecting Change 5.
- Spec §Change 4 referenced `[lang]/categories/...` mirror routes; this plan deliberately diverges to follow the existing `/tags/` pattern (default-locale only). Documented at the top of this plan.
- All TS types referenced (`IntroConfig`, `CategoriesConfig`, `Props` for PostLayout) are defined in tasks before they are used.
- All i18n keys used in Astro pages (`reading`, `readingDesc`, `categories`, `category`, `categoriesPageTitle`, `categoriesPageSubtitle`, `categoryPageTitle`, `categoryPostsCount`, `noPostsInCategory`, `backToCategories`) are added in Tasks 5 & 9 before being referenced in Tasks 10–12.
- The `getRelativeDate` signature (Task 3) matches its call in Task 4 (`getRelativeDate(new Date(post.data.date), dateLocale)` — `now` defaults to `Date.now()`).
- `setting.toml.categories.order` and the `CATEGORY_SLUGS` const in `src/content/config.ts` (Task 7) are documented as a coupling point that must be updated together when adding a category.
