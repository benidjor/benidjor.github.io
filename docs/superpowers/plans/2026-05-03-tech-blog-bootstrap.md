# Tech Blog Bootstrap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `https://benidjor.github.io` as a Korean tech blog using the girok-md template, integrated with an Obsidian vault → blog repo one-way sync, achieving MVP (About + Projects 1 + TIL 1) in Day 1~3.

**Architecture:** girok-md (Astro 5.x) static site generator template, hosted on GitHub Pages. User writes posts in Obsidian vault (`/Users/aryijq/Documents/obsidian-vault`), toggles `publish: true` on intended posts, runs `npm run sync` locally to copy them into `src/content/posts/`, then `git push` triggers GitHub Actions to build and deploy.

**Tech Stack:** Astro 5.x, TypeScript, remark-obsidian, Pagefind (search), Giscus (comments), GoatCounter (analytics), GitHub Pages, GitHub Actions.

**Spec:** `/Users/aryijq/Documents/01_DE_project/benidjor.github.io/docs/superpowers/specs/2026-05-03-tech-blog-design.md`

**Repo working directory:** `/Users/aryijq/Documents/01_DE_project/benidjor.github.io/` (already has `.git` and the spec committed)

---

## Notes on this plan

- **Task types:**
  - **[AUTO]** = automated bash/edit step
  - **[USER]** = action requiring user interaction (browser, Obsidian, GitHub UI). Bot can prepare instructions; user executes.
- **No traditional TDD here.** Verification = "run command, check expected output" or "open browser, check expected screen". Each task ends with explicit verification.
- **Commits:** small and frequent. Most tasks end with a commit.
- **All file paths are absolute** unless inside the blog repo (then relative to its root `/Users/aryijq/Documents/01_DE_project/benidjor.github.io/`).

---

## Task 1: Archive existing main branch on remote (USER)

**Goal:** Preserve the existing Docusaurus content of `benidjor/benidjor.github.io` to a new branch `archive-docusaurus-2024` before we overwrite `main`.

**Files:** None (GitHub remote operation only)

- [ ] **Step 1: Find current main branch HEAD sha**

Run:
```bash
gh api repos/benidjor/benidjor.github.io/branches/main --jq '.commit.sha'
```

Expected output: a 40-char sha string. **Save this sha** for the next step (call it `OLD_MAIN_SHA`).

- [ ] **Step 2: Create archive branch pointing to OLD_MAIN_SHA**

Replace `<OLD_MAIN_SHA>` with the sha from Step 1, then run:
```bash
gh api -X POST repos/benidjor/benidjor.github.io/git/refs \
  -f ref="refs/heads/archive-docusaurus-2024" \
  -f sha="<OLD_MAIN_SHA>"
```

Expected output: JSON containing `"ref": "refs/heads/archive-docusaurus-2024"`.

- [ ] **Step 3: Verify the archive branch exists**

Run:
```bash
gh api repos/benidjor/benidjor.github.io/branches/archive-docusaurus-2024 --jq '.name'
```

Expected output: `archive-docusaurus-2024`

- [ ] **Step 4: Confirm we are NOT yet deleting main**

We will overwrite `main` later via force-push (Task 9). Do NOT delete or modify `main` here. Verify main still exists:
```bash
gh api repos/benidjor/benidjor.github.io/branches/main --jq '.name'
```
Expected output: `main`

**Note:** No commit yet — this is a remote-only branch creation.

---

## Task 2: Merge girok-md template into the blog repo working directory

**Goal:** Pull the girok-md template files into `/Users/aryijq/Documents/01_DE_project/benidjor.github.io/`, preserving the existing `docs/` folder (which holds the spec).

**Files:**
- Modify: directory tree of `/Users/aryijq/Documents/01_DE_project/benidjor.github.io/` (adds template files alongside `docs/`)

- [ ] **Step 1: Confirm we're in the right directory and it has the spec**

Run:
```bash
ls /Users/aryijq/Documents/01_DE_project/benidjor.github.io/docs/superpowers/specs/
```

Expected output should include: `2026-05-03-tech-blog-design.md`

- [ ] **Step 2: Clone girok-md template to /tmp**

Run:
```bash
rm -rf /tmp/girok-md
cd /tmp
git clone --depth=1 https://github.com/7loro/girok-md
rm -rf /tmp/girok-md/.git
ls /tmp/girok-md/
```

Expected output should include: `package.json`, `setting.toml`, `astro.config.mjs`, `src`, `scripts`, `public`.

- [ ] **Step 3: Rsync template files into blog repo, excluding docs/**

Run:
```bash
rsync -av --exclude='docs/' /tmp/girok-md/ \
  /Users/aryijq/Documents/01_DE_project/benidjor.github.io/
```

Expected output: a list of files transferred (package.json, setting.toml, src/..., etc.).

- [ ] **Step 4: Verify spec still intact and template files present**

Run:
```bash
cd /Users/aryijq/Documents/01_DE_project/benidjor.github.io/
ls
ls docs/superpowers/specs/
```

Expected: `setting.toml`, `package.json`, `src`, `scripts`, `public`, `docs`, etc. AND spec file still in place.

- [ ] **Step 5: Add origin remote**

Run:
```bash
cd /Users/aryijq/Documents/01_DE_project/benidjor.github.io/
git remote add origin git@github.com:benidjor/benidjor.github.io.git
git remote -v
```

Expected output:
```
origin	git@github.com:benidjor/benidjor.github.io.git (fetch)
origin	git@github.com:benidjor/benidjor.github.io.git (push)
```

- [ ] **Step 6: Install dependencies**

Run:
```bash
cd /Users/aryijq/Documents/01_DE_project/benidjor.github.io/
npm install
```

Expected output: `added N packages` with no error. Build a brief note of any warnings (probably benign deprecation messages — fine to ignore).

- [ ] **Step 7: Clean up /tmp**

Run:
```bash
rm -rf /tmp/girok-md
```

- [ ] **Step 8: Commit the template integration**

Run:
```bash
cd /Users/aryijq/Documents/01_DE_project/benidjor.github.io/
git add -A
git commit -m "feat: integrate girok-md template into blog repo

Merged via rsync from upstream https://github.com/7loro/girok-md
(default branch). Excluded docs/ to preserve the design spec.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
git log --oneline
```

Expected output: 3 commits — initial spec, spec clarification, and this integration.

---

## Task 3: Configure setting.toml with confirmed values (Phase A — comments/analytics OFF)

**Goal:** Set the core 5 keys + `[intro]` block. Keep Giscus/GoatCounter `enabled = false` for now; we will turn them on after IDs are issued in Tasks 7~8.

**Files:**
- Modify: `setting.toml` (root of blog repo)

- [ ] **Step 1: Read current setting.toml to confirm structure**

Run:
```bash
cd /Users/aryijq/Documents/01_DE_project/benidjor.github.io/
cat setting.toml | head -80
```

Expected: see the template defaults (`source_root_path = "/source"`, `blog_name = "Casper Blog"`, etc.)

- [ ] **Step 2: Replace setting.toml content**

Open `/Users/aryijq/Documents/01_DE_project/benidjor.github.io/setting.toml` and replace the entire content with:

```toml
# girok.md Configuration File
# Knowledge becomes a map when shared.

# === Core ===
source_root_path = "/Users/aryijq/Documents/obsidian-vault"
blog_name = "benidjor's devlog"
site_url = "https://benidjor.github.io"
locale = "ko"

# === Intro (homepage hero) ===
[intro]
greeting = "안녕하세요,"
name = "benidjor"
role = "Data Engineer"
description = """당장의 효율보다, 끝까지 파고들어 답을 찾고 기록합니다.
데이터 엔지니어로 성장하기 위한 학습과 회고."""
intro_tags = ["Spark", "Airflow", "Kafka", "Iceberg", "Trino", "Snowflake"]

# === Posts ===
[posts]
# Safety: posts tagged with these are excluded from sync
# even if publish: true is set.
exclude_tags = ["private", "draft", "personal"]

[posts.translate]
enabled = false

# === Comments (Giscus) — Phase A: disabled, will enable after Task 7 ===
[comments]
enabled = false
provider = "giscus"

[comments.giscus]
repo = "benidjor/benidjor.github.io"
repo_id = ""
category = "Comments"
category_id = ""
mapping = "pathname"
strict = "0"
reactions_enabled = "1"
emit_metadata = "0"
input_position = "top"
theme = "preferred_color_scheme"
lang = "ko"

# === Analytics (GoatCounter) — Phase A: disabled, will enable after Task 8 ===
[analytics]
enabled = false
provider = "goatcounter"

[analytics.goatcounter]
site_code = ""
show_view_count = true
```

- [ ] **Step 3: Verify TOML parses by running build prep**

Run:
```bash
cd /Users/aryijq/Documents/01_DE_project/benidjor.github.io/
node -e "const t = require('smol-toml'); console.log(t.parse(require('fs').readFileSync('setting.toml','utf8')).blog_name);"
```

Expected output: `benidjor's devlog`

- [ ] **Step 4: Commit**

Run:
```bash
git add setting.toml
git commit -m "config: set core blog settings (comments/analytics off for now)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Tag private notes in vault to prevent accidental publishing

**Goal:** Add `tags: ["private"]` to vault folders that contain non-public material (employment docs, work logs, etc.) so even if `publish: true` is accidentally toggled, sync will exclude them via `exclude_tags`.

**Files:**
- Modify (vault): `.md` files inside the following folders:
  - `/Users/aryijq/Documents/obsidian-vault/01 Projects/01-01 채용_제출/`
  - `/Users/aryijq/Documents/obsidian-vault/01 Projects/01-02 채용_미제출/`
  - `/Users/aryijq/Documents/obsidian-vault/01 Projects/01-04 이력서/`
  - `/Users/aryijq/Documents/obsidian-vault/01 Projects/01-05 피드백_멘토링/`
  - `/Users/aryijq/Documents/obsidian-vault/02 Areas/02-01 업무일지/`
- Create: `/Users/aryijq/Documents/01_DE_project/benidjor.github.io/scripts/local/tag-private-notes.py` (one-time helper script, not part of the blog runtime)

- [ ] **Step 1: Create a directory for local-only helper scripts**

Run:
```bash
mkdir -p /Users/aryijq/Documents/01_DE_project/benidjor.github.io/scripts/local/
```

- [ ] **Step 2: Write the helper script**

Create `/Users/aryijq/Documents/01_DE_project/benidjor.github.io/scripts/local/tag-private-notes.py` with the following content:

```python
#!/usr/bin/env python3
"""
One-time helper: add `tags: ["private"]` to all .md files in given vault folders.

Behavior:
  - If a file has YAML frontmatter (between ---/---), merge "private" into its tags.
  - If a file has no frontmatter, prepend a frontmatter block with tags: ["private"].
  - Idempotent: re-running won't duplicate the "private" tag.

Usage:
  python3 scripts/local/tag-private-notes.py --dry-run
  python3 scripts/local/tag-private-notes.py --apply
"""

import argparse
import re
import sys
from pathlib import Path

VAULT = Path("/Users/aryijq/Documents/obsidian-vault")
PRIVATE_FOLDERS = [
    VAULT / "01 Projects" / "01-01 채용_제출",
    VAULT / "01 Projects" / "01-02 채용_미제출",
    VAULT / "01 Projects" / "01-04 이력서",
    VAULT / "01 Projects" / "01-05 피드백_멘토링",
    VAULT / "02 Areas" / "02-01 업무일지",
]

FRONTMATTER_RE = re.compile(r"^---\n(.*?)\n---\n", re.DOTALL)
TAGS_LINE_RE = re.compile(r"^tags:\s*(\[.*?\])\s*$", re.MULTILINE)


def add_private_tag(content: str) -> tuple[str, bool]:
    """Return (new_content, was_modified)."""
    m = FRONTMATTER_RE.match(content)
    if m:
        fm = m.group(1)
        tags_match = TAGS_LINE_RE.search(fm)
        if tags_match:
            tags_raw = tags_match.group(1)
            if '"private"' in tags_raw or "'private'" in tags_raw:
                return content, False  # already tagged
            new_tags = tags_raw.rstrip("]").rstrip() + ', "private"]'
            new_fm = TAGS_LINE_RE.sub(f"tags: {new_tags}", fm, count=1)
        else:
            new_fm = fm.rstrip() + '\ntags: ["private"]'
        new_content = f"---\n{new_fm}\n---\n" + content[m.end():]
        return new_content, True
    else:
        new_content = '---\ntags: ["private"]\n---\n\n' + content
        return new_content, True


def main():
    ap = argparse.ArgumentParser()
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument("--dry-run", action="store_true")
    g.add_argument("--apply", action="store_true")
    args = ap.parse_args()

    total = 0
    modified = 0
    for folder in PRIVATE_FOLDERS:
        if not folder.exists():
            print(f"[skip] {folder} not found")
            continue
        for md in folder.rglob("*.md"):
            total += 1
            text = md.read_text(encoding="utf-8")
            new_text, changed = add_private_tag(text)
            if changed:
                modified += 1
                print(f"[{'WOULD MODIFY' if args.dry_run else 'MODIFY'}] {md}")
                if args.apply:
                    md.write_text(new_text, encoding="utf-8")
            else:
                print(f"[ok] {md}")
    print(f"\nTotal: {total} file(s), {modified} would change.")


if __name__ == "__main__":
    main()
```

- [ ] **Step 3: Run dry-run first to see what would change**

Run:
```bash
cd /Users/aryijq/Documents/01_DE_project/benidjor.github.io/
python3 scripts/local/tag-private-notes.py --dry-run
```

Expected output: a list of files that would be modified, with a final count.

- [ ] **Step 4: Inspect ONE sample file before committing**

Pick the first file from the dry-run output and `cat` it to confirm the script's plan looks reasonable:
```bash
head -10 "<one-of-the-listed-paths>"
```

If it looks fine, proceed.

- [ ] **Step 5: Apply the change**

Run:
```bash
cd /Users/aryijq/Documents/01_DE_project/benidjor.github.io/
python3 scripts/local/tag-private-notes.py --apply
```

Expected output: list of `[MODIFY]` lines.

- [ ] **Step 6: Verify by inspecting one modified file**

Run:
```bash
head -8 "/Users/aryijq/Documents/obsidian-vault/02 Areas/02-01 업무일지/$(ls '/Users/aryijq/Documents/obsidian-vault/02 Areas/02-01 업무일지/' | head -1)"
```

Expected: the file starts with `---\ntags: ["private"]\n---` (or includes `"private"` in an existing tags array).

- [ ] **Step 7: Run the script again to confirm idempotency**

```bash
python3 scripts/local/tag-private-notes.py --apply
```

Expected: every line shows `[ok]` (no `[MODIFY]`), confirming the script is idempotent.

- [ ] **Step 8: Commit the helper script (vault changes are NOT in this repo, but in the vault repo)**

Run:
```bash
cd /Users/aryijq/Documents/01_DE_project/benidjor.github.io/
git add scripts/local/tag-private-notes.py
git commit -m "chore(scripts): add one-time vault private-tag helper

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

- [ ] **Step 9: Commit the vault changes in the vault repo**

Run:
```bash
cd /Users/aryijq/Documents/obsidian-vault/
git add -A
git commit -m "chore: tag private notes for blog publishing safety"
git push
```

Expected: commits pushed to `benidjor/obsidian-vault` private repo.

---

## Task 5: Create About post in the vault

**Goal:** Add `about.md` inside the vault under a dedicated blog folder, with `publish: true`. This will be the first post that gets sync'd.

**Files:**
- Create: `/Users/aryijq/Documents/obsidian-vault/01 Projects/01-07 blog/about.md`

- [ ] **Step 1: Create the folder**

Run:
```bash
mkdir -p "/Users/aryijq/Documents/obsidian-vault/01 Projects/01-07 blog/"
```

- [ ] **Step 2: Write the About post**

Create the file `/Users/aryijq/Documents/obsidian-vault/01 Projects/01-07 blog/about.md` with this content:

```markdown
---
title: About
publish: true
date: 2026-05-03
tags: ["projects", "meta"]
---

# benidjor

당장의 효율보다, 끝까지 파고들어 답을 찾고 기록합니다.
데이터 엔지니어로 성장하기 위한 학습과 회고.

## Contact

- GitHub: [benidjor](https://github.com/benidjor)
- Email: benidjor@gmail.com
- LinkedIn: [Sangteck Jeon](https://www.linkedin.com/in/sangteck-jeon/)
```

- [ ] **Step 3: Verify**

Run:
```bash
cat "/Users/aryijq/Documents/obsidian-vault/01 Projects/01-07 blog/about.md"
```

Expected: the file content as written above.

- [ ] **Step 4: Commit in vault repo**

Run:
```bash
cd /Users/aryijq/Documents/obsidian-vault/
git add "01 Projects/01-07 blog/about.md"
git commit -m "post: add About"
git push
```

---

## Task 6: First sync + local preview verification

**Goal:** Confirm the sync mechanism works end-to-end on a single post (About), and the local dev server renders correctly.

**Files:**
- Auto-managed: `src/content/posts/`, `public/assets/` (sync output, do NOT edit)

- [ ] **Step 1: Run sync**

Run:
```bash
cd /Users/aryijq/Documents/01_DE_project/benidjor.github.io/
npm run sync
```

Expected: console output mentions about.md being synced. No errors.

- [ ] **Step 2: Verify the synced file exists**

Run:
```bash
ls src/content/posts/
```

Expected: at least one file (likely `about.md` or similar; exact filename depends on girok-md's slug rules).

- [ ] **Step 3: Run dev server**

Run (in a separate terminal or background):
```bash
npm run dev
```

Expected output: a line like `Local: http://localhost:4321/`.

- [ ] **Step 4: Open localhost in browser and verify [USER]**

Open http://localhost:4321/ and check:

| Item | Expected |
|---|---|
| Hero section | "안녕하세요, benidjor 입니다." style, with description "당장의 효율보다…" + tags chips (Spark, Airflow, Kafka, Iceberg, Trino, Snowflake) |
| Blog name in header | `benidjor's devlog` |
| Post list shows About | yes |
| Click About | renders the markdown content + Contact list |
| `/tags/projects/` | shows About listed (because `tags: ["projects", "meta"]`) |
| Dark mode toggle (if present in girok-md) | works |

If any of the above fail, **stop and debug** before proceeding. Most likely issue: TOML typo, vault path wrong, or About frontmatter typo.

- [ ] **Step 5: Stop dev server**

`Ctrl+C` in the dev terminal.

- [ ] **Step 6: Commit the synced posts (first time only)**

Note: `src/content/posts/` is sync output but we still want it in git so GitHub Actions can build it.

Run:
```bash
cd /Users/aryijq/Documents/01_DE_project/benidjor.github.io/
git status
git add -A
git commit -m "post: first sync (About)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: Set up Giscus and enable comments (USER + AUTO)

**Goal:** Issue Giscus identifiers, fill them in `setting.toml`, and turn comments on.

**Files:**
- Modify: `setting.toml` (Giscus block)

- [ ] **Step 1: Enable Discussions on the GitHub repo [USER]**

In a browser, go to: https://github.com/benidjor/benidjor.github.io/settings

- Scroll to **Features** section
- Check the **Discussions** checkbox
- Click "Set up discussions" if prompted

Verify: a new "Discussions" tab appears in the repo navigation.

- [ ] **Step 2: Create a "Comments" discussion category [USER]**

Go to https://github.com/benidjor/benidjor.github.io/discussions

- Click the gear/settings icon next to "Categories"
- Create a new category named **Comments** with format **"Announcement"** (Giscus recommends this — only maintainers can create, anyone can reply)
- Save

- [ ] **Step 3: Get repo_id and category_id from giscus.app [USER]**

Go to https://giscus.app

- Repository field: enter `benidjor/benidjor.github.io`. Wait for it to validate (green check).
- Discussion category: select **Comments**.
- Mapping: select **pathname**.
- Other settings: leave defaults (these will be overridden by `setting.toml`).
- Scroll down to the section "Enable giscus" — it shows a `<script>` snippet. **From this snippet, copy:**
  - `data-repo-id="..."` → this is `repo_id`
  - `data-category-id="..."` → this is `category_id`

Save these two values.

- [ ] **Step 4: Update setting.toml with Giscus IDs and enable comments [AUTO]**

Edit `setting.toml`:

Find this block:
```toml
[comments]
enabled = false
provider = "giscus"
```

Change `enabled = false` to `enabled = true`.

Find:
```toml
[comments.giscus]
repo = "benidjor/benidjor.github.io"
repo_id = ""
category = "Comments"
category_id = ""
```

Replace `repo_id = ""` with `repo_id = "<value from Step 3>"` and `category_id = ""` with `category_id = "<value from Step 3>"`.

- [ ] **Step 5: Verify config loads**

Run:
```bash
cd /Users/aryijq/Documents/01_DE_project/benidjor.github.io/
node -e "const t=require('smol-toml');const c=t.parse(require('fs').readFileSync('setting.toml','utf8'));console.log(c.comments.enabled, c.comments.giscus.repo_id ? 'has repo_id' : 'missing');"
```

Expected: `true has repo_id`

- [ ] **Step 6: Commit**

Run:
```bash
git add setting.toml
git commit -m "config: enable Giscus comments

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 8: Set up GoatCounter and enable analytics (USER + AUTO)

**Goal:** Create a free GoatCounter account, get the site_code, fill it in `setting.toml`, and enable analytics.

**Files:**
- Modify: `setting.toml` (GoatCounter block)

- [ ] **Step 1: Sign up at GoatCounter [USER]**

Go to https://www.goatcounter.com/signup

- **Code (subdomain)**: pick something like `benidjor` (this becomes `benidjor.goatcounter.com`)
- Email: benidjor@gmail.com
- Site URL: https://benidjor.github.io
- Submit

After signup, the **site code** is the subdomain you picked (e.g., `benidjor`).

- [ ] **Step 2: Update setting.toml with site_code and enable analytics [AUTO]**

Edit `setting.toml`:

Find:
```toml
[analytics]
enabled = false
provider = "goatcounter"
```

Change `enabled = false` to `enabled = true`.

Find:
```toml
[analytics.goatcounter]
site_code = ""
show_view_count = true
```

Replace `site_code = ""` with `site_code = "<value from Step 1>"`.

- [ ] **Step 3: Verify**

Run:
```bash
cd /Users/aryijq/Documents/01_DE_project/benidjor.github.io/
node -e "const t=require('smol-toml');const c=t.parse(require('fs').readFileSync('setting.toml','utf8'));console.log(c.analytics.enabled, c.analytics.goatcounter.site_code);"
```

Expected: `true <your_subdomain>` (e.g., `true benidjor`).

- [ ] **Step 4: Commit**

Run:
```bash
git add setting.toml
git commit -m "config: enable GoatCounter analytics

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 9: Push to GitHub and configure Pages deployment (USER + AUTO)

**Goal:** Force-push the new blog repo to `main`, then enable GitHub Pages with "GitHub Actions" as the source.

**Files:**
- Remote: branches on `benidjor/benidjor.github.io`

- [ ] **Step 1: Verify all expected commits are local**

Run:
```bash
cd /Users/aryijq/Documents/01_DE_project/benidjor.github.io/
git log --oneline
```

Expected: at least 7 commits — spec, spec clarification, plan (next task), template integration, settings, helper script, About sync, Giscus, GoatCounter (the order may differ slightly).

- [ ] **Step 2: Add the plan file (this document) and commit if not yet committed**

```bash
git add docs/superpowers/plans/2026-05-03-tech-blog-bootstrap.md
git diff --cached --stat
```

If there's a staged change:
```bash
git commit -m "docs: add tech blog bootstrap implementation plan

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

If nothing to commit (already committed earlier), skip.

- [ ] **Step 3: Force-push main to overwrite the existing Docusaurus content**

⚠ This is destructive on `main`. The archive branch from Task 1 has preserved the old content; verify once more before force-push:

```bash
gh api repos/benidjor/benidjor.github.io/branches/archive-docusaurus-2024 --jq '.name'
```
Expected: `archive-docusaurus-2024`

If confirmed, force-push:
```bash
cd /Users/aryijq/Documents/01_DE_project/benidjor.github.io/
git push -u origin main --force
```

Expected: a force-push success message. The remote `main` now matches local.

- [ ] **Step 4: Verify the remote received our content**

Run:
```bash
gh api repos/benidjor/benidjor.github.io/contents/setting.toml --jq '.size'
```

Expected: a positive integer (size in bytes), confirming the file is on the remote.

- [ ] **Step 5: Enable GitHub Pages with Actions source [USER]**

In a browser, go to: https://github.com/benidjor/benidjor.github.io/settings/pages

- Under **Source**, select **GitHub Actions**
- Save

- [ ] **Step 6: Trigger a workflow run if needed [USER]**

The push from Step 3 should have already triggered the deploy workflow. Verify:

Go to https://github.com/benidjor/benidjor.github.io/actions

You should see a running or recently completed workflow. If nothing is running, trigger manually:
- Click the workflow name → "Run workflow" button → main branch → run.

Wait until it shows green ✅. Approximate time: 1~3 minutes.

- [ ] **Step 7: Verify the live site [USER]**

Open https://benidjor.github.io/ in a browser.

Expected:

| Item | Expected |
|---|---|
| Page loads (no 404) | yes |
| Hero displays "당장의 효율보다…" | yes |
| About post is listed/accessible | yes |
| Comment section on About post | shows Giscus widget (may take a moment to load) |
| Open browser dev tools → Network tab | a request to `<site_code>.goatcounter.com/count` fires |

If anything is broken: check the Actions log for build errors, fix locally, recommit, push.

---

## Task 10: Verify About page navigation and decide on header customization

**Goal:** Confirm whether the About post is reachable from a top-level navigation (header menu, sidebar, or footer). If not, decide whether to keep the current behavior (About reachable only via tags page) or add a fallback custom page.

**Files:**
- Possibly create: `src/pages/about.astro` (only if girok-md doesn't expose About in the nav by default)

- [ ] **Step 1: Visually inspect the live site for About link [USER]**

Open https://benidjor.github.io/ and look at the header, footer, and sidebar.

- Is there a link labeled "About" or similar?
  - **YES** → skip the rest of this task. Go to Task 11.
  - **NO** → continue to Step 2 to add a fallback.

- [ ] **Step 2 [conditional]: Add an explicit /about/ page**

If About is not in the nav, create a fallback Astro page that re-routes to the synced About post. Create `src/pages/about.astro` with this content:

```astro
---
import { getCollection } from 'astro:content';

const posts = await getCollection('posts');
const aboutPost = posts.find((p) =>
  p.slug.toLowerCase().includes('about')
);

if (!aboutPost) {
  // Fallback: 404 if no About post found
  return Astro.redirect('/404');
}

return Astro.redirect(`/posts/${aboutPost.slug}/`);
---
```

> ⚠ The exact path prefix (`/posts/`) depends on girok-md's routing. Inspect the URL of the working About post (Step 1) and replace `/posts/${aboutPost.slug}/` to match. Example: if About lives at `https://benidjor.github.io/post/about/`, use `/post/${aboutPost.slug}/`.

- [ ] **Step 3 [conditional]: Verify locally**

```bash
npm run dev
```

Open http://localhost:4321/about/ — it should redirect to the About post.

- [ ] **Step 4 [conditional]: Commit, push, verify on live**

```bash
git add src/pages/about.astro
git commit -m "feat: add /about/ redirect to About post

Fallback because girok-md template does not expose About in nav by default.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
git push
```

Wait for Actions to deploy, then verify https://benidjor.github.io/about/ redirects to the About post.

---

## Task 11: Write Projects post — seoul-citydata-platform intro (USER, content authoring)

**Goal:** Author the first Projects post: a series-entry intro to the seoul-citydata-platform.

**Files:**
- Create: `/Users/aryijq/Documents/obsidian-vault/01 Projects/01-06 서울 도시데이터 플랫폼/seoul-citydata-platform-intro.md` (or a similarly named file in this folder)

**Source material:**
- `/Users/aryijq/Documents/01_DE_project/seoul-citydata-platform/docs/portfolio/`
- `/Users/aryijq/Documents/01_DE_project/seoul-citydata-platform/docs/architecture/`

- [ ] **Step 1: Skim the source material to extract the entry-post outline [USER]**

Read briefly:
```bash
ls /Users/aryijq/Documents/01_DE_project/seoul-citydata-platform/docs/portfolio/
ls /Users/aryijq/Documents/01_DE_project/seoul-citydata-platform/docs/architecture/
```

Pick out:
- Why this project exists (problem statement)
- High-level architecture diagram or description
- Three key design decisions (e.g., why this DB, why this orchestrator, why this storage format)

- [ ] **Step 2: Author the post [USER]**

Create the file with this skeleton (fill in your own content):

```markdown
---
title: "서울 도시데이터 플랫폼 시리즈 ① — 왜, 무엇을, 어떻게"
publish: true
date: 2026-05-03
tags: ["projects", "seoul-citydata", "data-platform"]
---

# 서울 도시데이터 플랫폼 시리즈 ① — 왜, 무엇을, 어떻게

> 이 글은 `seoul-citydata-platform` 프로젝트의 시리즈 진입글입니다.
> 후속편에서는 데이터 모델링, Airflow DAG 설계, 운영 트러블슈팅 등을 다룹니다.

## 왜 만드는가

(서울 열린데이터광장의 한계, 본인이 풀고 싶은 문제, 가설을 1~3 문단으로)

## 시스템 한눈에 보기

(아키텍처 다이어그램 또는 한 문단 설명)

![architecture](architecture.png)

## 핵심 의사결정 3가지

### 1. <결정 1: 예> Trino over Presto, 그리고 Iceberg 위에서

> **왜?** (의사결정 근거 — 트레이드오프, 대안, 선택 이유)

### 2. <결정 2>

> **왜?**

### 3. <결정 3>

> **왜?**

## 다음 글에서 다룰 것

- 데이터 모델링 ([[seoul-citydata-platform-data-model]])
- Airflow DAG 설계
- 운영 트러블슈팅 사례
```

Replace placeholders with actual content. Keep ~800~1500 자 (Korean) for the intro.

- [ ] **Step 3: If you reference an image, place it next to the .md file**

Obsidian convention: image embeds use `![[image.png]]` and the image is in the same folder (or vault attachments folder). Either form works; girok-md's remark-obsidian handles both.

If you want to use a local image:
```bash
cp /path/to/your/diagram.png "/Users/aryijq/Documents/obsidian-vault/01 Projects/01-06 서울 도시데이터 플랫폼/architecture.png"
```

In the markdown, reference as: `![architecture](architecture.png)` or `![[architecture.png]]`.

- [ ] **Step 4: Commit in vault repo**

```bash
cd /Users/aryijq/Documents/obsidian-vault/
git add -A
git commit -m "post: seoul-citydata-platform series 1 (intro)"
git push
```

---

## Task 12: Sync + preview + push Projects post

**Goal:** Run sync to pull the Projects post into the blog repo, preview locally, then push to deploy.

**Files:**
- Auto-managed: `src/content/posts/`, `public/assets/`

- [ ] **Step 1: Sync**

```bash
cd /Users/aryijq/Documents/01_DE_project/benidjor.github.io/
npm run sync
```

Expected: console mentions the new post being synced.

- [ ] **Step 2: Local preview [USER]**

```bash
npm run dev
```

Open http://localhost:4321/ and verify:

| Item | Expected |
|---|---|
| Post appears on home/list page | yes |
| Click → renders all sections | yes |
| Image (if any) displays | yes |
| Tags include `projects`, `seoul-citydata`, `data-platform` | yes |
| `/tags/projects/` shows both About + this post | yes |
| Wikilinks to future posts (e.g., `[[seoul-citydata-platform-data-model]]`) | broken link — expected, since target doesn't exist yet — should be visually obvious |

`Ctrl+C` to stop dev server.

- [ ] **Step 3: Run safety net check (git diff)**

```bash
git status
git diff --stat
```

Verify only intended files changed: `src/content/posts/seoul-citydata-platform-intro.md` (or similar) and possibly `public/assets/architecture.png`.

If anything unexpected appears (e.g., a private vault note slipped in), **abort and investigate**.

- [ ] **Step 4: Commit and push**

```bash
git add -A
git commit -m "post: seoul-citydata-platform series 1 (intro)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
git push origin main
```

- [ ] **Step 5: Verify live deployment [USER]**

Wait ~2 minutes, then open https://benidjor.github.io/ and confirm the new post appears.

Spot-check the live post for: image rendering, tag links, comments section (Giscus), view counter (GoatCounter — may take a few page loads to register).

---

## Task 13: Write TIL post — infrastructure-validation demo (USER, content authoring)

**Goal:** Write a light TIL post that exercises tags, Callouts, and basic markdown features as a smoke test of the publishing pipeline.

**Files:**
- Create: `/Users/aryijq/Documents/obsidian-vault/01 Projects/01-07 blog/why-i-restart-this-blog.md` (or similar)

- [ ] **Step 1: Author the post [USER]**

Create the file with this skeleton (you can adjust the content but keep the structure):

```markdown
---
title: "블로그를 다시 시작하는 이유"
publish: true
date: 2026-05-03
tags: ["til", "meta", "retrospective"]
---

# 블로그를 다시 시작하는 이유

## 다시 시작하는 까닭

> [!NOTE]
> 이 글은 신설된 블로그의 TIL 진입글이자, 발행 파이프라인 동작 검증글입니다.

(왜 docusaurus 블로그를 갈아엎고 girok-md 로 새로 시작했는지 1~2 문단)

## 기록의 원칙

당장의 효율보다, 끝까지 파고들어 답을 찾고 기록한다.

- 배운 것은 잊지 않기 위해
- 부딪힌 문제는 끝까지 파고들기 위해
- 데이터 엔지니어로 성장하기 위해

## 블로그 사용법

- **Projects**: 만든 것의 시리즈 글이 모입니다 → [Projects](/tags/projects/)
- **TIL**: 학습/회고/단편 트러블슈팅 → [TIL](/tags/til/)

## 마치며

> [!QUOTE]
> 기록은 다음 길을 비춥니다.
```

- [ ] **Step 2: Commit in vault repo**

```bash
cd /Users/aryijq/Documents/obsidian-vault/
git add "01 Projects/01-07 blog/why-i-restart-this-blog.md"
git commit -m "post: TIL — why i restart this blog"
git push
```

---

## Task 14: Sync + preview + push TIL post

**Goal:** Same flow as Task 12, for the TIL post. This is also a verification of Callout rendering.

**Files:**
- Auto-managed: `src/content/posts/`, `public/assets/`

- [ ] **Step 1: Sync**

```bash
cd /Users/aryijq/Documents/01_DE_project/benidjor.github.io/
npm run sync
```

- [ ] **Step 2: Local preview [USER]**

```bash
npm run dev
```

Open http://localhost:4321/ and verify:

| Item | Expected |
|---|---|
| New TIL post is listed | yes |
| Callout `> [!NOTE]` renders as a styled note box | yes |
| Callout `> [!QUOTE]` renders as styled quote | yes |
| Tags include `til`, `meta`, `retrospective` | yes |
| `/tags/til/` shows the post | yes |
| Internal links `/tags/projects/` and `/tags/til/` work | yes |

`Ctrl+C` to stop dev server.

- [ ] **Step 3: Diff check + commit**

```bash
git status
git diff --stat
git add -A
git commit -m "post: TIL — why i restart this blog

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
git push origin main
```

- [ ] **Step 4: Verify live [USER]**

Wait ~2 minutes, open https://benidjor.github.io/, confirm post appears.

---

## Task 15: End-to-end MVP verification (USER)

**Goal:** Walk through the live site as a first-time visitor (e.g., a recruiter) and confirm every promised capability works.

**Files:** None (browser only)

- [ ] **Step 1: Visitor walkthrough on https://benidjor.github.io/**

Open the home page and verify each item:

| # | Item | Expected | Pass? |
|---|---|---|---|
| 1 | Hero shows greeting + name + role + description + intro_tags | ✅ | |
| 2 | Header shows blog name "benidjor's devlog" | ✅ | |
| 3 | List of posts (About, Projects intro, TIL post) | ✅ | |
| 4 | Click Projects post → reads cleanly | ✅ | |
| 5 | Click TIL post → Callouts render | ✅ | |
| 6 | About page reachable (header link or via /tags/projects/ or via /about/) | ✅ | |
| 7 | Click `/tags/projects/` → shows About + Projects intro | ✅ | |
| 8 | Click `/tags/til/` → shows TIL post | ✅ | |
| 9 | Click `/tags/seoul-citydata/` → shows Projects intro | ✅ | |
| 10 | Pagefind search box (Cmd+K or visible search bar) → search "Spark" → relevant posts surface | ✅ | |
| 11 | On a post page, scroll to bottom → Giscus comment widget loads | ✅ | |
| 12 | On a post page, view counter displays (or at least the request fires — check Network tab) | ✅ | |
| 13 | Dark mode (auto follows system preference) | ✅ | |
| 14 | Mobile view (browser dev tools → mobile emulation) → readable | ✅ | |
| 15 | Page source: `<meta property="og:title">` and similar OG tags present | ✅ | |
| 16 | `/sitemap.xml` is reachable and lists posts | ✅ | |

If any items fail, file follow-ups (or fix on the spot if minor). Document failures in the conversation.

- [ ] **Step 2: Test the comment flow [USER]**

On any post, leave a test comment via Giscus (login with GitHub if needed). It should appear in the GitHub Discussion under "Comments" category.

After verifying, you can delete the test comment from the GitHub Discussions UI (optional).

- [ ] **Step 3: Confirm GoatCounter is recording**

Open https://`<your_site_code>`.goatcounter.com/

Expected: a dashboard with 1+ pageviews. (May take a few minutes after your visits to register.)

---

## Task 16: Externalize the blog URL

**Goal:** Make the blog discoverable from the channels recruiters/peers use.

**Files:**
- Modify (external): GitHub profile README, LinkedIn profile, resume

- [ ] **Step 1: Update GitHub profile README [USER]**

If you have a `benidjor/benidjor` profile README repo, edit it to include:
- A link to https://benidjor.github.io/
- A short description like "데이터 엔지니어로 성장하기 위한 학습과 회고를 기록합니다."

If no profile README exists, create one with `gh repo create benidjor/benidjor --public` then add a `README.md`.

- [ ] **Step 2: Update LinkedIn profile [USER]**

Go to https://www.linkedin.com/in/sangteck-jeon/ → Edit "About" / "Featured" sections to include https://benidjor.github.io/ as a featured link.

- [ ] **Step 3: Update resume [USER]**

In your resume (Notion / Google Docs / whatever you use), add the blog URL near the top under contact info or links section.

- [ ] **Step 4: Confirm at least one external channel surfaces the blog [USER]**

Pick one (LinkedIn or GitHub profile) and verify the link is visible to a logged-out viewer (open an incognito tab).

---

## Task 17: Final commit and PR-equivalent summary

**Goal:** Wrap up the bootstrap with a clean state and a brief summary of what was built.

**Files:**
- Modify (optional): `README.md` of the blog repo

- [ ] **Step 1: Replace girok-md's default README with a brief project README**

Edit `/Users/aryijq/Documents/01_DE_project/benidjor.github.io/README.md`:

```markdown
# benidjor's devlog

A personal tech blog built on the [girok-md](https://github.com/7loro/girok-md) template, deployed at https://benidjor.github.io/.

## Authoring workflow

Posts are written in an Obsidian vault (private). Posts with `publish: true` in their frontmatter are pulled into this repo by `npm run sync`, then committed and pushed. GitHub Actions builds the Astro site and deploys to GitHub Pages.

## Local commands

| Command | Purpose |
|---|---|
| `npm run sync` | Pull `publish: true` posts from the vault into `src/content/posts/` |
| `npm run dev` | Start a local preview at http://localhost:4321/ |
| `npm run build` | Production build into `dist/` |

## Design and plan

- Spec: [docs/superpowers/specs/2026-05-03-tech-blog-design.md](docs/superpowers/specs/2026-05-03-tech-blog-design.md)
- Plan: [docs/superpowers/plans/2026-05-03-tech-blog-bootstrap.md](docs/superpowers/plans/2026-05-03-tech-blog-bootstrap.md)
```

- [ ] **Step 2: Commit and push**

```bash
git add README.md
git commit -m "docs: replace template README with project-specific one

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
git push
```

- [ ] **Step 3: Final state check**

Run:
```bash
cd /Users/aryijq/Documents/01_DE_project/benidjor.github.io/
git log --oneline | head -20
git status
```

Expected: working tree clean, log shows the spec → plan → bootstrap series of commits.

- [ ] **Step 4: Mark MVP complete**

Verify https://benidjor.github.io/ is live with About + Projects 1 + TIL 1, comments work, view counts work, search works.

🎉 MVP done.

---

## Phase 2 candidates (NOT part of this plan)

These are deferred — open a new spec/plan when ready:

- seoul-citydata-platform 시리즈 후속 4~5편
- recipe-platform 회고 시리즈
- Learning Spark 챕터별 정리
- 커스텀 도메인 도입
- Sync wrapper (B 옵션) 도입
- Lint 스크립트 (1차 태그 누락 검증)
- Google Search Console 등록
- About 외 메타 페이지

---

## Self-review notes (post-write)

**Spec coverage check:**
- §3 architecture & data flow → covered by Tasks 2, 6, 12, 14
- §5 setting.toml values → Task 3 (Phase A) + Task 7, 8 (enable comments/analytics)
- §6 Projects/TIL tag strategy → Task 5 (about), Task 11 (projects), Task 13 (til), Task 15 (verify tag pages)
- §7 About implementation → Task 5 + Task 10 (verify nav, fallback if needed)
- §8.1 first-setup procedure → Tasks 1~10 (1:1 mapping)
- §8.2 per-post workflow → modeled by Tasks 12, 14 (and described in Task 17 README)
- §9 safety nets → exclude_tags in Task 3, private tags in Task 4, git diff in Tasks 12, 14
- §10 MVP scope → Tasks 5, 11, 13 (3 posts)
- §11 operations → Task 17 README

**Placeholder scan:** none. All steps include exact paths, commands, and expected outputs. Conditional steps (Task 10 Step 2~4) are marked `[conditional]` and only run if the verify step finds the issue.

**Type/name consistency:** consistent throughout — `setting.toml`, `src/content/posts/`, `public/assets/`, `npm run sync` / `dev` / `build` referenced uniformly.
