# AGENTS.md - girok-md

> Project conventions for AI coding agents

## Project Overview

**girok-md** is an Astro 5.x-based SSG that transforms Obsidian markdown files into a static blog.

- **Framework**: Astro 5.x (Static Site Generator)
- **Language**: TypeScript (strict mode)
- **Testing**: Vitest
- **Search**: Pagefind (client-side)
- **Package Manager**: npm (ES modules)

---

## Build/Run Commands

```bash
# Development server (localhost:4321)
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Sync markdown files (source → content/posts)
npm run sync

# Run tests
npm test                           # All tests
npx vitest run                     # Run without watch mode
npx vitest run scripts/__tests__/sync.test.ts   # Single file
npx vitest -t "should convert"     # Match by test name pattern

# Pagefind indexing (included in postbuild)
npx pagefind --site dist
```

---

## Project Structure

```
girok-md/
├── src/
│   ├── components/       # Astro components (.astro)
│   ├── layouts/          # Page layouts
│   ├── pages/            # Routes (file-based routing)
│   ├── content/
│   │   └── posts/        # Synced markdown (auto-generated)
│   ├── i18n/             # Internationalization (en, ko)
│   ├── styles/           # Global CSS
│   └── utils/            # Utility functions
├── scripts/
│   ├── sync.ts           # Markdown sync script
│   └── __tests__/        # Test files
├── public/               # Static files (images, robots.txt)
├── setting.toml          # Blog configuration
├── astro.config.mjs      # Astro configuration
├── tsconfig.json         # TypeScript config (extends astro/strict)
└── vitest.config.ts      # Vitest configuration
```

---

## Code Style Guidelines

### TypeScript

```typescript
// ✅ Interface definitions - use explicit types
export interface ParsedDocument {
  slug: string;
  title: string;
  date: Date;
  modified: Date;
  content: string;
  frontmatter: Record<string, unknown>;
  filePath: string;
}

// ✅ Functions - explicit return types
export function generateSlug(filePath: string, title?: string): string {
  // implementation
}

// ✅ Use generic types
const index = new Map<string, ParsedDocument>();

// ❌ No any types - as any, @ts-ignore, @ts-expect-error are forbidden
```

### Import Order

```typescript
// 1. Node.js built-in modules
import { readFileSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';

// 2. External libraries
import matter from 'gray-matter';
import { parse } from 'smol-toml';

// 3. Internal project modules
import { type TranslationKey } from './translations/en';
```

### Astro Components

```astro
---
// Define Props interface
interface Props {
  title: string;
  description?: string;
}

// Destructure props (with defaults)
const { title, description = 'Default' } = Astro.props;

// Access environment variables
const base = import.meta.env.BASE_URL;
---

<div class="component">
  <!-- template -->
</div>

<style>
  /* Component-scoped CSS */
</style>
```

### Formatting Rules

- **Indentation**: 2 spaces
- **Line length**: Max 150 characters
- **Trailing commas**: Always use
- **Semicolons**: Always use
- **Quotes**: Prefer single quotes (except in templates)

```typescript
// ✅ Correct example
const config = {
  name: 'girok-md',
  version: '1.0.0',
  features: [
    'wikilinks',
    'callouts',
    'images',  // trailing comma
  ],
};
```

### Naming Conventions

| Type | Style | Example |
|------|-------|---------|
| File (TS) | camelCase | `tagColor.ts` |
| File (Astro) | PascalCase | `TagList.astro` |
| Function | camelCase | `processWikilinks()` |
| Interface/Type | PascalCase | `ParsedDocument` |
| Constant | camelCase or UPPER_SNAKE | `settingPath` |
| CSS Class | BEM variant | `header__logo`, `tag-list` |

### Error Handling

```typescript
// ✅ try-catch with explicit error handling
export function parseDocument(filePath: string): ParsedDocument | null {
  try {
    const raw = readFileSync(filePath, 'utf-8');
    const { data, content } = matter(raw);
    // ...
    return { slug, title, date, modified, content, frontmatter: data, filePath };
  } catch {
    return null;  // Return null on failure
  }
}

// ✅ User-friendly error messages (CLI)
if (!existsSync(resolvedPath)) {
  console.error(`❌ Source path does not exist: ${resolvedPath}`);
  process.exit(1);
}
```

---

## Testing Guidelines

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { generateSlug, type ParsedDocument } from '../sync.ts';

// Test helper function
function createMockDoc(overrides: Partial<ParsedDocument> = {}): ParsedDocument {
  return {
    slug: 'test-doc',
    title: 'Test Doc',
    // ... defaults
    ...overrides,
  };
}

describe('generateSlug', () => {
  it('should convert title to lowercase slug', () => {
    expect(generateSlug('/path/file.md', 'Hello World')).toBe('hello-world');
  });

  it('should handle Korean characters', () => {
    expect(generateSlug('/path/file.md', '안녕하세요')).toBe('안녕하세요');
  });
});
```

---

## Content Collections (Astro)

```typescript
// src/content/config.ts
import { defineCollection, z } from 'astro:content';

const posts = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.date(),
    tags: z.array(z.string()).optional(),
    description: z.string().optional(),
    aliases: z.array(z.string()).optional(),
  }),
});

export const collections = { posts };
```

---

## Internationalization (i18n)

```typescript
// src/i18n/index.ts
export type Locale = 'en' | 'ko';

// Type-safe translation keys
export function t(key: TranslationKey, params?: Record<string, string | number>): string;

// Usage example
t('postsPageSubtitle', { count: 10 });  // "10 posts"
```

---

## Key Patterns

### Wikilink Processing

```typescript
// [[document]] or [[document|display text]] pattern
const wikilinkPattern = /(?<!!)\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;
```

### Image Embeds

```typescript
// ![[filename]] or ![[filename|width]] pattern
const imagePattern = /!\[\[([^\]|]+)(?:\|(\d+))?\]\]/g;
```

### Callout Syntax

```markdown
> [!NOTE] Title
> Content
```

---

## Important Notes

1. **src/content/posts/ is auto-generated** - Do not edit directly, use `npm run sync`
2. **setting.toml** is the source of truth for blog configuration
3. **public/assets/** is automatically managed during sync
4. Minimize real filesystem access in tests (use mocks)

---

## Commit Messages

```
feat: Add new feature
fix: Bug fix
docs: Documentation changes
style: Code formatting, missing semicolons, etc.
refactor: Code improvements without functionality changes
test: Add or modify tests
chore: Build, configuration changes

Use commit message using english as it is opensource project
```
