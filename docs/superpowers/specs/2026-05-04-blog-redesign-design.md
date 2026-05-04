# Blog redesign — accent color, reading theme, recent posts layout, categories

- **Date:** 2026-05-04
- **Status:** Draft (awaiting review)
- **Scope:** Four independent UX/IA improvements bundled into a single spec because they
  touch overlapping files (theme tokens, header nav, content schema, homepage).

## Background

The blog (Astro 5.x SSG, see `CLAUDE.md`) is now in production with two demo posts and an
About page. After dogfooding, the author identified four issues:

1. The Material theme's accent (purple `#6750A4`) does not match the desired brand tone.
2. Only three design themes (`neo-brutalism`, `material`, `glassmorphism`) exist; none of
   them prioritize long-form reading.
3. The homepage's recent-posts section uses a responsive grid
   (`repeat(auto-fit, minmax(300px, 1fr))` at `src/pages/index.astro:321`). With multiple
   columns, the chronological order (left→right→next row) is not visually obvious.
4. Top-level navigation only exposes `Home / Posts / Tags`. Posts are classified by
   tags — including type-of-post tags `projects` and `til` — but there is no first-class
   "category" concept. A recruiter or peer engineer landing on the site cannot quickly
   see "projects vs TIL" as separate streams.
5. The Korean homepage greeting reads `안녕하세요,` / `benidjor` — grammatically dangling.
   The author wants `benidjor 입니다.` to close the sentence naturally.

The five changes are tackled together because they share files (theme CSS, header,
homepage, i18n strings, intro config) and a single design pass keeps the visual language
coherent.

## Goals

- Replace Material's purple accent with a high-saturation emerald green that fits the
  author's intended tone.
- Add a fourth theme optimized for readability of long-form posts.
- Make chronological order of recent posts unambiguous on the homepage.
- Promote `projects` and `til` from tags to a real **Category** axis, with their own
  navigation, landing pages, and intro copy targeted at a recruiter / engineer audience.

## Non-goals

- No new analytics/SEO work; no changes to comments, view counts, or search indexing.
- No new locales; existing `ko` (default) + `en` translations are extended, not added to.
- No changes to the markdown sync pipeline (`scripts/sync.ts`) beyond what zod schema
  requires. Frontmatter passthrough already works.
- No automatic migration of existing tags. Tags stay as-is; categories are additive.
- No more than two initial categories (`projects`, `til`). Adding more is out of scope
  but the design must not block it.

---

## Change 1 — Material theme accent: purple → green

### Tokens

Replace the four Material accent slots in `src/styles/global.css` (current values at
lines 499–507):

| Selector | Token | Old | New |
|---|---|---|---|
| `[data-design-theme="material"]` | `--accent` | `#6750A4` | `#00A173` |
| `[data-design-theme="material"]` | `--accent-hover` | `#7965AF` | `#00CE93` |
| `[data-design-theme="material"][data-theme="dark"]` | `--accent` | `#D0BCFF` | `#00CE93` |
| `[data-design-theme="material"][data-theme="dark"]` | `--accent-hover` | `#E8DEF8` | `#7FE7C0` |

`#7FE7C0` is a generated lighter tint of `#00CE93` for the dark hover state, chosen so
that the dark hover is perceivably brighter than the dark base (mirrors how the existing
purple dark hover `#E8DEF8` is brighter than `#D0BCFF`).

### Rationale & contrast

User-supplied palette: `#00A173`, `#00CE93`. WCAG checks (informational, used to assign
slots, not as hard pass criteria):

- `#00A173` on white ≈ 3.7:1 — AA Large only; suitable for buttons / borders / icons,
  marginal for body text. The accent is currently used for borders, button backgrounds,
  and link/title accents on hover — it is **not** the body text color, so this is OK.
- `#00CE93` on white ≈ 2.1:1 — too light for foreground text on white; used here only as
  a hover state where the contrast change is what matters, not standalone legibility.
- `#00CE93` on `#1a1a1a` ≈ 9.5:1 — strong; correct as the dark-mode base.

### Files touched

- `src/styles/global.css` (4 token swaps).

No JS or template changes needed; everything keys off CSS variables.

---

## Change 2 — Add a fourth theme: `reading`

### Intent

A theme tuned for long-form reading: serif body type, warm neutral background, generous
line height, no hard shadow / no glass blur, single low-saturation accent. Differentiated
from the existing three by being the only "content-first, decoration-minimal" theme.

### Tokens (new selector block in `src/styles/global.css`)

```css
[data-design-theme="reading"] {
  --border-width: 1px;
  --radius: 4px;
  --shadow-offset: 0;
  --card-shadow: none;
  --card-hover-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
  --backdrop-blur: none;
  --surface-opacity: 1;

  --bg-primary: #FBF7F0;        /* warm paper */
  --bg-secondary: #F4EFE6;
  --border-color: #D9D2C5;
  --text-primary: #2A2722;
  --text-secondary: #5A544B;
  --text-muted: #8A8378;
  --shadow-color: rgba(42, 39, 34, 0.12);

  --accent: #6B5B3E;            /* warm bronze */
  --accent-hover: #8A7651;

  --font-serif: 'Noto Serif KR', 'Source Serif Pro', Georgia, serif;
  --font-display: var(--font-serif);
  --line-height-relaxed: 1.85;
}

[data-design-theme="reading"][data-theme="dark"] {
  --bg-primary: #1F1B16;
  --bg-secondary: #2A251F;
  --border-color: #4A4238;
  --text-primary: #EDE5D5;
  --text-secondary: #BDB4A2;
  --text-muted: #8A8378;
  --accent: #D4B881;
  --accent-hover: #E8CFA0;
}
```

Body text uses `var(--font-serif)` only inside the article body and homepage intro under
this theme — not the whole page — to keep navigation and meta UI consistent across themes.
This is implemented by overriding `body` font-family scoped to `[data-design-theme="reading"] .post-content`
and `[data-design-theme="reading"] .intro__desc` rather than replacing globally.

### ThemeSelector wiring

`src/components/ThemeSelector.astro` adds a fourth `<li role="option" data-design-theme="reading">`
entry. New i18n keys in both `src/i18n/translations/en.ts` and `ko.ts`:

- `reading: 'Reading'`
- `readingDesc` — en: `'Serif type, warm paper, content-first'`; ko: `'세리프 본문, 따뜻한 종이 톤, 콘텐츠 중심'`

The `TranslationKey` union type updates accordingly.

### Default theme

Default remains `neo-brutalism` (set in `src/layouts/BaseLayout.astro:54` via the
inline FOUC-prevention script). Reading theme is opt-in via the selector and persisted
in `localStorage` like the others.

### Files touched

- `src/styles/global.css` — add `[data-design-theme="reading"]` block (light + dark)
  plus scoped serif font override.
- `src/components/ThemeSelector.astro` — add fourth option.
- `src/i18n/translations/en.ts`, `src/i18n/translations/ko.ts` — add `reading`,
  `readingDesc` keys.

---

## Change 3 — Recent posts: single-column ordered list

### Current behavior

`src/pages/index.astro:319-323` uses
`grid-template-columns: repeat(auto-fit, minmax(300px, 1fr))` and a JS `ResizeObserver`
(lines 114–146) computes `columns × 2 rows` cards to display. On wide viewports this
produces 2–3 columns, which obscures chronological order.

### New behavior

- Change the grid to `grid-template-columns: 1fr` at all breakpoints so the list stacks
  vertically with the newest at the top.
- Replace the JS-driven `columns × 2 rows` count with a **fixed limit of 5** posts (the
  current `slice(0, 9)` becomes `slice(0, 5)` in the frontmatter computation; the
  `adjustPostCount` script and its `ResizeObserver` are removed).
- Card layout adapts to the wider single-column container: the card body keeps its
  current internal layout but tags can wrap onto a single row more comfortably.
- Add a relative-time hint next to the existing absolute date inside `.post-card__meta`,
  e.g. `2026-05-03 · 1일 전`. The relative time is computed at build time from
  `post.data.date` so it does not change per visitor and remains static-friendly. Locale
  follows `dateLocale` (Korean: `1일 전`, `3주 전`, `2개월 전`; English: `1 day ago`,
  etc.). For posts older than ~12 months the relative hint is omitted.
- The "View all posts" link in `.section-header` stays unchanged.

### Why 5 (not 4 or 9)

The homepage already has the intro hero above the fold; a single column of 5 cards keeps
the section scannable in one viewport-and-a-bit on a typical laptop, and the Posts page
still exists for the full archive. 5 also reads as "a handful, latest" rather than a
deliberate grid count.

### Files touched

- `src/pages/index.astro`:
  - Frontmatter: change `slice(0, 9)` → `slice(0, 5)` (line 27).
  - Template: optionally add `<span>` for relative-time inside `.post-card__meta` (line 82–90).
  - `<style>`: change `.recent-posts__list { grid-template-columns: 1fr }`; remove
    the `@media (max-width: 768px)` override that already sets `1fr` (now redundant).
  - `<script>`: remove `adjustPostCount`, `ResizeObserver`, and the `astro:page-load`
    listener entirely (no longer needed).
- A small helper for relative time is added inline in the index frontmatter (10–15 lines)
  rather than introducing a new util file, since it's only used here.

---

## Change 4 — First-class Categories axis

### Concept

Promote post-type from a tag to a dedicated **Category** axis. Tags continue to mean
"topics / technologies" (`spark`, `airflow`, `seoul-citydata`, `meta`, ...). Categories
mean "kind of writing" (`projects`, `til`).

A post has **at most one** category (optional — the About page has none). A post may
still carry the same string as a tag for backward compatibility, but the canonical
classifier is `category`.

### Initial categories

Defined in `setting.toml` so they remain a single source of truth (consistent with how
`blog_name`, `intro`, etc. work):

```toml
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

`astro.config.mjs` reads this and injects `import.meta.env.CATEGORIES` (mirrors the
existing pattern for `BLOG_NAME` / `INTRO` etc.). Adding a third category later is
"add an entry to `setting.toml`" only.

### Frontmatter & schema

Add to `src/content/config.ts`:

```ts
category: z.enum(['projects', 'til']).optional(),
```

The enum is hard-coded for now (matches `setting.toml.categories.order`). A later change
can broaden this if a third category is added; documented as a known coupling point.

Existing posts get one-line edits in the **vault source** (per memory
`project_vault_folder_layout.md`, the canonical location is
`/Users/aryijq/Documents/obsidian-vault/01 Projects/01-07 blog/`):

- `서울-도시데이터-플랫폼-시리즈...md` → add `category: projects`.
- `블로그를-다시-시작하는-이유.md` → add `category: til`.
- `about.md` → no `category` (intentional; About is meta).

The `projects` / `til` strings can remain in `tags:` for now (no migration is required;
tag pages keep working). A follow-up cleanup can remove them from tags once Categories
are live, but that is out of scope for this change.

### Pages

Two new Astro pages under `src/pages/categories/`:

- `index.astro` — landing page that lists each category with its label, description, and
  post count, in `setting.toml.categories.order`. Links to `/categories/[slug]`. Uses
  the same card visual language as `/tags/index.astro` for consistency.
- `[slug].astro` — per-category page. At top, renders the category description as intro
  copy (this is the recruiter-facing context). Below, renders posts whose
  `data.category === slug`, sorted newest-first using the same comparator as the
  homepage and Posts page (`date desc`, then `publish_sync_at desc` as tiebreaker —
  see `git log` for `bb5edaa feat(ui): mobile header fix, sticky nav, font unification, sort tiebreaker`).
  `getStaticPaths` generates one route per `setting.toml.categories.order` entry.

i18n routing: per `src/utils/i18nRouting.ts`, default locale is at `/`, other locales at
`/[lang]/`. Categories follow the same convention: `/categories/projects` (default
locale) and `/[lang]/categories/projects` (others). The `[slug].astro` page includes the
locale dimension via the same helpers used by `/posts/` and `/tags/`.

### Header navigation

`src/layouts/BaseLayout.astro` (lines 71–76) gains a `Categories` link between `Posts`
and `Tags`. Final order: `Home / Posts / Categories / Tags`.

A "directly expose Projects and TIL as siblings of Posts" variant (e.g.
`Home / Projects / TIL / Posts / Tags`) was considered and rejected: it scales poorly
once a third category is added, and on mobile the nav already wraps to a second row
(`@media (max-width: 768px)` in `BaseLayout.astro`) — adding two more items would
strain that layout.

### i18n keys

Added to `en.ts` and `ko.ts`:

- `categories: 'Categories'` / `'카테고리'`
- `categoriesPageTitle`, `categoriesPageSubtitle` (parameterized with `{count}`)
- `category` (singular, used as a label on post cards if shown)
- `postCount` reuses the existing key if present; otherwise added.

Category `label_*` and `description_*` come from `setting.toml`, not from the i18n
translation files, because they are content (per-blog) rather than UI chrome.

### Tag/category coexistence

- Tags pages (`/tags`, `/tags/[tag]`) continue to work and still surface `projects` /
  `til` as tags **if those strings remain in `tags:`**. We do not strip them in this
  change.
- Post detail pages (`/posts/[slug]`) optionally render a small "Category: Projects"
  badge near the date. This is a single line addition in `PostLayout.astro`; gracefully
  hidden when `category` is undefined.

### Files touched

- `setting.toml` — add `[categories]` section and per-category sub-tables.
- `astro.config.mjs` — read and inject `CATEGORIES`.
- `src/env.d.ts` — type declaration for the `CATEGORIES` env var.
- `src/content/config.ts` — add `category` to the zod schema.
- `src/pages/categories/index.astro` — new.
- `src/pages/categories/[slug].astro` — new.
- `src/pages/[lang]/categories/index.astro` — new (mirrors default-locale page).
- `src/pages/[lang]/categories/[slug].astro` — new.
- `src/layouts/BaseLayout.astro` — add Categories nav link.
- `src/layouts/PostLayout.astro` — render optional category badge.
- `src/i18n/translations/en.ts`, `ko.ts` — new keys.
- Vault sources (per memory: `01-07 blog/`) — frontmatter additions on two posts.

### Out of scope (explicit)

- Auto-removing `projects` / `til` from existing `tags:` arrays.
- A third category (e.g. `notes`, `talks`).
- A multi-category-per-post model.
- Category RSS feeds.

---

---

## Change 5 — Homepage greeting suffix

### Intent

Close the dangling Korean greeting `안녕하세요, / benidjor` so it reads as a complete
sentence: `안녕하세요, / benidjor 입니다.`. The English fallback `Hello, I'm benidjor`
already reads naturally and should not gain a Korean particle, so the suffix is rendered
as a separate, optional span that the author can leave empty for English-only setups.

### Approach

- Add a new optional field `name_suffix` to the `[intro]` table in `setting.toml`.
  Value for this site: `" 입니다."`. Leading space is intentional (it sits between the
  name box and the suffix text).
- `astro.config.mjs` already injects the entire `[intro]` table as `import.meta.env.INTRO`,
  so no config-loader change is needed; the new key flows through automatically.
- In `src/pages/index.astro` frontmatter, read `intro.name_suffix` with a default of `''`
  alongside the other `intro.*` reads (line 13–18 region).
- In the template (line 44–47 region), append a new sibling span **after** the existing
  `<span class="intro__name">{introName}</span>`, only when the suffix is non-empty:

  ```astro
  <h1 class="intro__greeting">
    {introGreeting}<br />
    <span class="intro__name">{introName}</span>{introNameSuffix && (
      <span class="intro__name-suffix">{introNameSuffix}</span>
    )}
  </h1>
  ```

- Add a small style block for `.intro__name-suffix`: same base font as the heading, no
  background, no rotation, no shadow — it is plain text. It inherits color from the
  heading. This keeps the strong "tilted accent box" only on the English-readable name
  while the Korean particle reads as natural body type next to it.

### Why a separate span (not concatenated into `name`)

- `name` is reused outside the homepage hero (e.g. in SEO defaults via
  `intro.name`, derived display strings). Embedding `" 입니다."` into `name` would leak
  Korean particles into contexts where only the bare identifier is appropriate.
- The visual treatment is intentionally different: `intro__name` has a colored
  background and rotation; the suffix should not.
- The field is optional, so an English-only deployment of this template can leave it
  empty and get clean rendering.

### Files touched

- `setting.toml` — add `name_suffix = " 입니다."` to `[intro]`.
- `src/pages/index.astro` — read `intro.name_suffix`, render conditional sibling span,
  add `.intro__name-suffix` style.

### Out of scope

- Locale-specific suffixes (`name_suffix_ko` / `name_suffix_en`). The current suffix is
  shared across locales; this is acceptable because the site's primary locale is `ko`
  and the English fallback can leave it empty if it ever needs to diverge.
- Restructuring `intro.greeting` itself.

---

## Cross-cutting concerns

### Single source of truth

Both `setting.toml` (categories) and `src/content/config.ts` (zod enum) hold the list of
valid category slugs. They must agree. This is documented at the top of
`src/content/config.ts` with a comment pointing at `setting.toml`. Long-term we could
generate one from the other, but for two values it is overkill.

### Theme additions and the `reading` theme

The reading theme adds a serif font dependency. If `Noto Serif KR` is not loaded by the
existing font pipeline, the design falls back to `Source Serif Pro` → Georgia → generic
serif. Loading a new webfont is a separate decision; for this change we rely on system
serif fallbacks unless the implementation plan explicitly adds the font preload. This
keeps the theme zero-network-cost by default.

### Backward compatibility

- Posts without `category` remain valid (zod field is optional).
- The `material` theme's purple is replaced, not parameterized; users who liked the
  purple lose it. This is an intentional, project-owner decision.
- localStorage values for `design-theme` from previous sessions still resolve to one of
  the now-four themes; `reading` does not collide with any prior key.

## Testing strategy

### Unit / integration (vitest)

- `src/content/config.ts` — verify the new `category` enum accepts `projects`/`til` and
  rejects unknown strings (covered by Astro content collection validation; add an
  explicit test if `scripts/__tests__/` already covers schema).
- A new test for the relative-time helper used on the homepage (in/out of the 12-month
  threshold; `1일 전` boundary at 24h).

### Visual / smoke

- Run `npm run dev` and verify each theme (`neo-brutalism`, `material`, `glassmorphism`,
  `reading`) in both light and dark modes on the homepage and a post page.
- Verify Material accent appears as green in both modes (no purple remnants).
- Verify recent posts on `/` are a single column with newest on top.
- Verify `/categories`, `/categories/projects`, `/categories/til` render with the
  expected posts and intro copy. Category navigation appears in the header.
- Verify the Korean `dateLocale` is used for the relative-time hint on the default
  locale and the English locale uses English.
- Verify mobile breakpoints (`<= 768px`, `<= 480px`) still work for header nav and the
  recent posts list.

### Build

- `npm run build` must pass with no zod or TypeScript errors.
- `npm run sync` from the vault must succeed after frontmatter additions.

## Implementation order (suggestion for the plan)

The plan should sequence these so that each step is independently verifiable:

1. Change 1 (Material accent) — smallest, isolated to one CSS file.
2. Change 5 (greeting suffix) — single page edit + one config field; trivial.
3. Change 3 (recent posts) — touches one page, removes JS, easy to verify visually.
4. Change 2 (reading theme) — isolated additions; new selector block + selector option.
5. Change 4 (categories) — largest; introduces new pages, schema, nav, frontmatter
   edits, and i18n keys. Done last so earlier changes are not blocked.

## Open questions

None at spec time. All four changes are scoped above with explicit non-goals.
