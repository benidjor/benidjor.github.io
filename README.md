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

## Credits

- Template: [girok-md](https://github.com/7loro/girok-md) (MIT)
- Fonts: [Pretendard](https://github.com/orioncactus/pretendard), [D2Coding](https://github.com/naver/d2codingfont) (both SIL OFL)
