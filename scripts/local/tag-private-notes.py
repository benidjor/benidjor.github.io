#!/usr/bin/env python3
"""
One-time helper: add `tags: ["private"]` to all .md files in given vault folders.

Behavior:
  - If a file has YAML frontmatter (between ---/---), merge "private" into its tags.
    - Inline list (tags: ["a", "b"]) -> append , "private" to inline list.
    - Block list (tags:\n  - a\n  - b) -> append `  - private` to block list.
    - Empty tags: line -> replace with inline tags: ["private"].
    - No tags key -> append tags: ["private"] to frontmatter.
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
INLINE_TAGS_RE = re.compile(r"^tags:[ \t]*(\[.*?\])[ \t]*$", re.MULTILINE)
BLOCK_TAGS_RE = re.compile(
    r"^(tags:[ \t]*\n)((?:[ \t]+-[ \t]*[^\n]*\n)+)",
    re.MULTILINE,
)
EMPTY_TAGS_RE = re.compile(r"^tags:[ \t]*$", re.MULTILINE)


def _has_private_in_block(items_block: str) -> bool:
    for line in items_block.splitlines():
        m = re.match(r"^[ \t]+-[ \t]*(.+?)[ \t]*$", line)
        if m:
            val = m.group(1).strip().strip('"').strip("'")
            if val == "private":
                return True
    return False


def add_private_tag(content: str) -> tuple[str, bool]:
    """Return (new_content, was_modified)."""
    m = FRONTMATTER_RE.match(content)
    if not m:
        new_content = '---\ntags: ["private"]\n---\n\n' + content
        return new_content, True

    fm = m.group(1)
    # Normalize: ensure fm ends with \n so regexes can anchor block-list items at EOF.
    fm_norm = fm if fm.endswith("\n") else fm + "\n"

    inline_match = INLINE_TAGS_RE.search(fm_norm)
    if inline_match:
        tags_raw = inline_match.group(1)
        if '"private"' in tags_raw or "'private'" in tags_raw:
            return content, False
        if tags_raw.strip() == "[]":
            new_tags = '["private"]'
        else:
            new_tags = tags_raw.rstrip("]").rstrip() + ', "private"]'
        new_fm = INLINE_TAGS_RE.sub(f"tags: {new_tags}", fm_norm, count=1)
    else:
        block_match = BLOCK_TAGS_RE.search(fm_norm)
        if block_match:
            items = block_match.group(2)
            if _has_private_in_block(items):
                return content, False
            first_line = items.split("\n", 1)[0]
            indent_m = re.match(r"^([ \t]+)-", first_line)
            indent = indent_m.group(1) if indent_m else "  "
            new_items = items + f"{indent}- private\n"
            new_fm = fm_norm[:block_match.start(2)] + new_items + fm_norm[block_match.end(2):]
        elif EMPTY_TAGS_RE.search(fm_norm):
            new_fm = EMPTY_TAGS_RE.sub('tags: ["private"]', fm_norm, count=1)
        else:
            new_fm = fm_norm.rstrip() + '\ntags: ["private"]\n'

    # Reconstruct: FRONTMATTER_RE expects fm without trailing \n (closing \n---\n adds it).
    new_fm = new_fm.rstrip("\n")
    new_content = f"---\n{new_fm}\n---\n" + content[m.end():]
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
