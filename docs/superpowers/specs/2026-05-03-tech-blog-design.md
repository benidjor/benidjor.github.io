# 기술 블로그 (`benidjor.github.io`) 설계 문서

- **작성일**: 2026-05-03
- **작성 목적**: 신입 데이터 엔지니어 취업 어필용 기술 블로그를 girok-md 템플릿 기반으로 새로 구축하기 위한 설계
- **상태**: Draft (사용자 검토 대기)
- **대상 레포**: `https://github.com/benidjor/benidjor.github.io` (기존 Docusaurus 콘텐츠는 갈아엎고 재구축)

---

## 1. 개요와 성공 기준

### 1.1 목적

1. **취업 어필**: 신입 데이터 엔지니어 채용 담당자/실무자에게 본인의 데이터 엔지니어링 역량, 프로젝트 접근 방식, 사고 과정, 문제 해결 능력을 보여주는 채널.
2. **포트폴리오 아카이빙**: 진행 중인 `seoul-citydata-platform` 프로젝트의 의사결정·아키텍처·트러블슈팅을 시리즈로 정리.
3. **학습 기록**: 학습한 내용을 체계적으로 남겨 본인의 성장 흐름을 보여줌.

### 1.2 메시지

- **Hero (한 줄 카피)**: *"당장의 효율보다, 끝까지 파고들어 답을 찾고 기록합니다."*
- **부연**: *데이터 엔지니어로 성장하기 위한 학습과 회고.*

### 1.3 성공 기준 (MVP)

- `https://benidjor.github.io` 에 접속하면 About + Projects 1편 + TIL 1편이 노출되는 상태.
- 채용 담당자가 첫 화면에서 (a) 누구인지, (b) 무엇을 만들고 있는지, (c) 어떻게 사고하는 사람인지 한눈에 파악 가능.
- 댓글·조회수·검색 기능이 모두 작동.
- vault에서 `publish: true` 토글 + `npm run sync` + `git push` 단 3단계로 새 글이 사이트에 반영되는 발행 흐름 확립.

---

## 2. 결정 요약

| 영역 | 결정 |
|---|---|
| 레포 전략 | 기존 `benidjor.github.io` main을 `archive-docusaurus-2024` 브랜치로 보존 후 갈아엎기 |
| 마이그레이션 | 기존 Docusaurus 콘텐츠 중 살릴 글 없음 |
| 작성 도구 | 옵시디언 vault (`/Users/aryijq/Documents/obsidian-vault`) |
| 작성 → 발행 흐름 | vault → blog 레포 단방향 sync |
| sync 트리거 | 로컬 수동 명령 (`npm run sync`) |
| vault 백업 | `benidjor/obsidian-vault` private 레포 (기존 워크플로우 유지) |
| 카테고리 구조 | **B**: Projects / TIL 2축 + 태그 (girok-md엔 카테고리 없음 → 태그로 구현) |
| 발행 표시 | vault 마크다운 frontmatter에 `publish: true` |
| 발행 위치 규칙 | PARA 폴더 위치 그대로 유지 (별도 발행 폴더 X) |
| 언어 | 한국어 단일 (`locale = "ko"`) |
| 도메인 | `benidjor.github.io` (커스텀 도메인은 Phase 2) |
| 댓글 | Giscus (켬) |
| 조회수 | GoatCounter (켬) |
| 검색 | Pagefind (켬, girok-md 기본) |
| 구현 접근법 | **1**: girok-md 공식 흐름 그대로, 자체 코드 최소 |
| 안전망 전략 | **C**: `exclude_tags` + 비공개 노트 `private` 태그 부착 + `git diff` 사후 확인 디스플린 |

---

## 3. 시스템 아키텍처

### 3.1 전체 데이터 흐름

```
┌─────────────────────────────────────────────────────────────────────┐
│ 1) 작성 (옵시디언)                                                    │
│    /Users/aryijq/Documents/obsidian-vault/                           │
│      00 Inbox / 01 Projects / 02 Areas / 03 Resources / 04 Archives  │
│      └─ publish: true 가 켜진 .md 파일들                             │
└─────────────────────────────────────────────────────────────────────┘
              │ 발행 결정 (사용자가 frontmatter 토글)
              ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 2) sync (로컬 수동 명령)                                              │
│    blog 레포에서:  npm run sync                                       │
│    - setting.toml 의 source_root_path 를 따라 vault 스캔             │
│    - publish: true 인 .md 만 src/content/posts/ 로 복사              │
│    - exclude_tags 에 매칭되는 글은 제외                              │
│    - 위키링크/Callout/이미지 임베드 → 표준 마크다운으로 변환         │
│    - 이미지를 public/assets/ 로 복사                                 │
└─────────────────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 3) 미리보기 (로컬)                                                    │
│    npm run dev → http://localhost:4321                               │
│    - 글이 의도대로 렌더링되는지, 태그/링크/이미지 깨짐 없는지 확인   │
└─────────────────────────────────────────────────────────────────────┘
              │ 이상 없음 확인
              ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 4) 커밋 & 푸시 (blog 레포)                                            │
│    git status / git diff 로 발행 대상 최종 확인 (안전망 C)           │
│    git add -A && git commit && git push origin main                  │
└─────────────────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 5) 자동 빌드 & 배포 (GitHub Actions → GitHub Pages)                  │
│    - Astro 빌드: src/content/posts → dist/                           │
│    - Pagefind 인덱스 생성 (postbuild)                                │
│    - GitHub Pages 가 dist 를 https://benidjor.github.io 에 서빙      │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.2 시스템 경계

- **vault (입력)**: 사용자의 콘텐츠 저장소. 비공개 노트 다수 + `publish: true`인 공개 후보 일부. PARA 구조 유지.
- **blog 레포 (변환·전시)**: girok-md 템플릿 기반. `setting.toml`이 단일 진입점. `src/content/posts/`는 sync 결과물(직접 편집 X).
- **GitHub Pages (배포)**: 정적 사이트 호스팅. 빌드는 GitHub Actions가 담당.

### 3.3 핵심 원칙

- **단방향성**: vault → blog 레포는 단방향. blog의 `src/content/posts/`를 직접 편집하지 않음 (sync가 덮어씀).
- **단일 진실의 원천 (Single Source of Truth)**: vault.
- **단일 작성 규칙**: vault에서만 글을 쓴다. blog 레포는 발행 인프라일 뿐.

---

## 4. 디렉토리 구조

### 4.1 blog 레포 (girok-md 템플릿 기반)

```
benidjor.github.io/                 ← GitHub Pages 루트
├── setting.toml                    ← 거의 모든 설정의 단일 진입점 ★
├── astro.config.mjs                ← Astro 프레임워크 설정
├── package.json                    ← npm scripts (sync / dev / build 등)
├── scripts/
│   ├── sync.ts                     ← npm run sync 의 본체 (수정 X)
│   ├── translate.ts                ← (사용 안 함)
│   └── clean.ts
├── src/
│   ├── content/
│   │   ├── config.ts               ← frontmatter 스키마
│   │   └── posts/                  ← ★ sync 결과물 (직접 편집 X)
│   ├── pages/
│   ├── components/
│   └── ...
├── public/
│   └── assets/                     ← ★ sync가 옮긴 이미지 (직접 편집 X)
├── .github/
│   └── workflows/                  ← GitHub Actions: 빌드 + Pages 배포
└── README.md
```

**사용자가 직접 편집하는 곳**: `setting.toml` 단 하나.
**자동 관리되는 곳**: `src/content/posts/`, `public/assets/` (sync 결과물).

### 4.2 vault (입력 측)

```
/Users/aryijq/Documents/obsidian-vault/    ← source_root_path
├── 00 Inbox/
├── 01 Projects/
│   ├── 01-01 채용_제출/                    ← private (블로그 발행 X)
│   ├── 01-04 이력서/                       ← private (블로그 발행 X)
│   ├── 01-06 서울 도시데이터 플랫폼/      ← Projects 시드 (publish: true 토글 시 발행)
│   └── ...
├── 02 Areas/
│   ├── 02-01 업무일지/                     ← private (블로그 발행 X)
│   └── 02-02 도구_환경설정/
├── 03 Resources/
│   ├── 03-01 Spark강의/                    ← TIL 시드
│   ├── 03-03 데이터_엔지니어링_입문/      ← TIL 시드
│   ├── 03-05 Docker강의/                   ← TIL 시드
│   └── ...
├── 04 Archives/
└── ...
```

**원칙**: PARA 구조 유지. 발행 대상은 위치가 아니라 frontmatter `publish: true`로 결정.

---

## 5. `setting.toml` 구체값

```toml
# === 핵심 5블록 ===
source_root_path = "/Users/aryijq/Documents/obsidian-vault"
blog_name = "benidjor's devlog"
site_url = "https://benidjor.github.io"
locale = "ko"

# === Intro (메인 페이지 자기소개 영역) ===
[intro]
greeting = "안녕하세요,"
name = "benidjor"
role = "Data Engineer"
description = """당장의 효율보다, 끝까지 파고들어 답을 찾고 기록합니다.
데이터 엔지니어로 성장하기 위한 학습과 회고."""
intro_tags = ["Spark", "Airflow", "Kafka", "Iceberg", "Trino", "Snowflake"]

# === 발행 옵션 ===
[posts]
# 비공개 노트의 의도치 않은 발행을 막는 안전망.
# 해당 태그가 붙은 글은 publish: true 여도 sync 제외.
exclude_tags = ["private", "draft", "personal"]

[posts.translate]
enabled = false   # 한국어 단일

# === 댓글 (Giscus) ===
[comments]
enabled = true
provider = "giscus"

[comments.giscus]
repo = "benidjor/benidjor.github.io"
repo_id = ""              # ⏳ giscus.app 발급 후 채움
category = "Comments"
category_id = ""          # ⏳ giscus.app 발급 후 채움
mapping = "pathname"
strict = "0"
reactions_enabled = "1"
emit_metadata = "0"
input_position = "top"
theme = "preferred_color_scheme"
lang = "ko"

# === 조회수 (GoatCounter) ===
[analytics]
enabled = true
provider = "goatcounter"

[analytics.goatcounter]
site_code = ""            # ⏳ GoatCounter 가입 후 채움
show_view_count = true
```

> ⏳ 표시는 첫 셋업 시 외부 서비스 발급 후 채워야 하는 값.

---

## 6. 콘텐츠 분류 — Projects / TIL 태그 전략

### 6.1 2단 태그 구조

```
┌─────────────────────────────────────────────────┐
│ 1차 태그 (필수, 정확히 1개)                      │
│   - "projects"  → 만든 것 (시리즈 글)           │
│   - "til"       → 배운 것 (단편 글)             │
├─────────────────────────────────────────────────┤
│ 2차 태그 (선택, 1~3개)                           │
│   - 주제 키워드: "spark", "airflow", "kafka",   │
│     "trino", "iceberg", "snowflake",            │
│     "seoul-citydata", "recipe-platform",        │
│     "retrospective", "trouble-shooting", ...    │
└─────────────────────────────────────────────────┘
```

### 6.2 작성 규칙

- 모든 글 frontmatter에 `tags: ["projects" 또는 "til", ...]` 필수.
- 1차 태그가 빠진 글은 분류되지 않음 (sync 후 사이트에서 발견 시 수동 보완).
- 태그 표기는 **영문 소문자 + 하이픈 구분** (예: `seoul-citydata`, `trouble-shooting`).
- 글 1편당 권장: 1차 태그 1개 + 2차 태그 1~3개.

### 6.3 분류 회색지대 처리 룰

> "이 글이 프로젝트 컨텍스트를 모르는 사람에게도 유용한가?" → Yes면 `til`, No면 `projects`.

예시:
- "Airflow KubernetesExecutor에서 Pod이 안 뜨는 이유 분석" → `til` (범용)
- "seoul-citydata-platform에서 백필 잡 OOM 해결한 이야기" → `projects` (프로젝트 맥락 필수)
- 같은 사건도 다른 각도로 양쪽에서 쓸 수 있음.

### 6.4 UX (girok-md 자동 라우팅)

- `/tags/projects/` → "Projects" 묶음 페이지
- `/tags/til/` → "TIL" 묶음 페이지
- `/tags/spark/` → 주제별 묶음 페이지

헤더/사이드바에 **`Projects` / `TIL` 두 링크를 직접 두어** 각각 `/tags/projects/`, `/tags/til/`로 연결 → 시각적으로는 카테고리처럼 보임.

> ⚠ girok-md의 헤더 메뉴 커스텀 위치는 첫 셋업 시 확인. `setting.toml`에 `[nav]` 같은 섹션이 있으면 거기로, 없으면 `src/components/Header.astro` 등 코드 수정. 후자라면 접근법 1(공식 흐름 그대로) 원칙에서 약간 벗어나므로, 먼저 girok-md docs/이슈에서 헤더 커스텀 가이드 확인 후 결정.

---

## 7. About 페이지

### 7.1 구현 방식

옵션 A 채택: **마크다운 1편으로 작성**.

vault 안 적당한 위치(예: `01 Projects/01-07 blog/about.md`)에 다음 내용으로 작성:

```markdown
---
title: About
publish: true
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

### 7.2 검증 항목 (셋업 시)

- About 페이지가 헤더 메뉴 또는 푸터에 자연스럽게 노출되는지 확인.
- girok-md 기본 동작이 About 페이지를 위한 별도 페이지를 지원하지 않으면, **fallback**: `src/pages/about.astro` 커스텀 페이지 추가 (접근법 1 원칙에서 약간 벗어나는 예외 케이스).

---

## 8. 발행 워크플로우

### 8.1 첫 셋업 절차 (One-time)

```
1) GitHub: 기존 main 보존
   - main 브랜치를 archive-docusaurus-2024 브랜치로 복사 (sha 보존)

2) 로컬: girok-md 템플릿으로 새 작업 디렉토리 생성
   $ git clone https://github.com/7loro/girok-md /Users/aryijq/Documents/01_DE_project/benidjor.github.io
   $ cd /Users/aryijq/Documents/01_DE_project/benidjor.github.io
   $ rm -rf .git
   $ git init && git remote add origin git@github.com:benidjor/benidjor.github.io.git
   $ npm install

   (이미 이 디렉토리에 본 spec 문서가 있다면 충돌하지 않도록 spec은 유지)

3) setting.toml 편집 (섹션 5의 값으로)

4) vault 비공개 노트들에 tags: ["private"] 일괄 부착
   - 01-01 채용_제출 / 01-02 채용_미제출 / 01-04 이력서 /
     01-05 피드백_멘토링 / 02-01 업무일지 등

5) vault에 about.md 작성 + publish: true

6) 로컬 미리보기로 동작 확인
   $ npm run sync
   $ npm run dev    # http://localhost:4321

7) Giscus 발급
   - https://giscus.app 에서 benidjor/benidjor.github.io repo 등록
   - 레포 Settings → Discussions 활성화 → "Comments" 카테고리 생성
   - 발급된 repo_id, category_id 를 setting.toml 에 입력

8) GoatCounter 발급
   - https://goatcounter.com 무료 계정 생성 → site_code 입력

9) GitHub Pages 배포 활성화
   - 레포 Settings → Pages → Source: "GitHub Actions"

10) 첫 push
    $ git status && git diff   # 안전망 C (사후 확인)
    $ git add -A && git commit -m "feat: bootstrap blog with girok-md"
    $ git push -u origin main

11) Actions 탭에서 빌드 성공 확인
12) https://benidjor.github.io 접속 확인
```

### 8.2 정기 발행 워크플로우 (Per-post)

```
[옵시디언 vault 안에서]
  1. 글 작성 (어디든 PARA 폴더 안 OK)
  2. frontmatter:
     ---
     title: "글 제목"
     publish: true
     tags: ["til", "airflow", "trouble-shooting"]
     date: 2026-05-03
     ---

[blog 레포 디렉토리에서]
  3. $ npm run sync
     - 콘솔에 발행 대상 목록 표시
     - 의도와 다르면 Ctrl+C, 의도대로면 자동 진행
  4. $ npm run dev → 로컬 미리보기로 확인
  5. $ git status && git diff   # 안전망 C: 어떤 글이 추가/변경됐는지 확인
  6. 이상 없으면:
     $ git add -A && git commit -m "post: <글 제목>"
     $ git push origin main
  7. GitHub Actions 자동 빌드/배포 → 1~2분 내 사이트 반영
```

---

## 9. 안전망

| 가드 | 작동 |
|---|---|
| **(1) 비공개 노트의 의도치 않은 발행** | `[posts] exclude_tags = ["private", "draft", "personal"]` + 비공개 노트에 `private` 태그 부착 |
| **(2) 1차 태그 누락** | 사후 발견 시 수동 보완 (Phase 2에서 lint 스크립트로 자동화 가능) |
| **(3) sync 직전 발행 대상 확인** | girok-md `npm run sync` 콘솔 출력 신뢰. 부족하면 Phase 2에서 `sync:dry` wrapper 도입 |
| **(4) commit 직전 발행 내용 확인** | 안전망 C: `git status && git diff` 디스플린 |
| **(5) 빌드 실패 시 배포 중단** | GitHub Actions 기본 동작 (이전 빌드 유지) |
| **(6) vault 자체 백업** | `benidjor/obsidian-vault` private 레포 (기존) |

### 안전망 승격 기준 (C → B)

다음 중 하나 발생 시 sync wrapper(B 옵션) 추가를 고려:
- 의도치 않은 발행 사고 1회 발생
- 1차 태그 누락 사후 보완이 잦음
- 발행 빈도가 주 5회 이상으로 증가

---

## 10. 첫 출시 (MVP) 스코프

### 10.1 MVP 정의

> "benidjor.github.io에 접속하면, 누군가에게 보여줘도 부끄럽지 않은 상태."
>
> = About + Projects 1편 + TIL 1편 + 인프라 풀 셋

### 10.2 포함 / 제외

| | 포함 ✅ | 제외 ❌ (Phase 2) |
|---|---|---|
| 인프라 | girok-md 셋업, setting.toml, GitHub Pages 배포, Giscus, GoatCounter | 커스텀 도메인, lint 스크립트, sync wrapper |
| 콘텐츠 | About 1편, Projects 1편, TIL 1편 (총 3편) | 시리즈 글 다편, 과거 프로젝트 회고, Learning Spark 정리 |
| UX | Hero, 태그 페이지, 검색, 댓글, 조회수 | 헤더 메뉴 커스텀(필요 시), 다크모드 미세 조정 |
| SEO | 자동 sitemap, 기본 OG 태그 | Search Console 등록, 외부 SEO 검증 |

### 10.3 MVP 콘텐츠 3편

- **MVP-1: About** — 옵션 A (마크다운 1편). 작성 시간 ~30분.
- **MVP-2: Projects 1편 (`seoul-citydata-platform` 소개)**
  - 시드 자료: `/Users/aryijq/Documents/01_DE_project/seoul-citydata-platform/docs/portfolio/`, `docs/architecture/`
  - 형식: "왜 만드는가 / 시스템 한눈에 보기 / 핵심 의사결정 3가지"
  - 시리즈 1편 = 진입글. 후속편은 Phase 2.
  - 작성 시간 ~2~4시간.
- **MVP-3: TIL 1편 — 인프라 검증용 데모 글**
  - 후보: 가벼운 학습 메모 또는 "블로그 첫 글: 왜 다시 시작하는가"
  - 목적: 콘텐츠 깊이보다 **태그/이미지/Callout/검색/댓글 동작 검증**
  - 작성 시간 ~30분~1시간.

### 10.4 MVP 일정 (Day 1~3 페이스)

```
[Day 1 — 인프라 셋업]
  ① archive-docusaurus-2024 브랜치 보존
  ② girok-md clone, setting.toml 편집
  ③ vault 비공개 노트에 private 태그 일괄 부착
  ④ vault에 about.md 작성
  ⑤ 로컬 sync + dev 미리보기
  ⑥ Giscus, GoatCounter 발급 → setting.toml 채움
  ⑦ GitHub Pages 배포 활성화 + 첫 push
  ⑧ 사이트 접속 확인 (About + Hero만)

[Day 2 — Projects 1편]
  ⑨ MVP-2 작성 (seoul-citydata-platform 소개)
  ⑩ sync + 미리보기 + push

[Day 3 — TIL 1편 + 마무리]
  ⑪ MVP-3 작성 (인프라 검증용 데모)
  ⑫ sync + push
  ⑬ 태그 페이지 / 검색 / 댓글 / 조회수 동작 확인
  ⑭ 이력서 / LinkedIn / GitHub README에 블로그 URL 추가
```

---

## 11. 운영

### 11.1 일상 운영 (요약)

- **발행**: vault 작성 → `publish: true` → `npm run sync` → `git diff` → push
- **수정**: vault 글 수정 → sync → push (sync가 덮어씀, 별도 작업 X)
- **삭제**: vault에서 `publish: false` 또는 글 제거 → sync → push
  > ⚠ 발행된 글의 URL은 외부 인용/SEO 인덱스가 있을 수 있으므로 신중

### 11.2 백업 정책

| 대상 | 백업 위치 |
|---|---|
| vault (콘텐츠 원본) | `benidjor/obsidian-vault` private 레포 (이미 운영 중) |
| blog 레포 | GitHub `benidjor/benidjor.github.io` (매 push마다) |
| 빌드 결과물 (`dist/`) | 별도 백업 X (매번 재빌드) |

### 11.3 실패 복구 시나리오

**(1) GitHub Actions 빌드 실패**
- 사이트는 이전 빌드 유지 (자동 fallback)
- 로컬 `npm run build`로 재현 → 수정 → 재push

**(2) sync 실패**
- 콘솔 로그로 원인 확인
- 미커밋 부분 결과물은 `git checkout -- .`로 폐기

**(3) 의도치 않은 발행 (사고 비용 가장 큼)**
- 즉시 대응:
  ```
  1. vault에서 publish: true → false
  2. npm run sync
  3. git commit + push
  4. 1~2분 내 사이트에서 글 사라짐
  ```
- 검색엔진 인덱스/SNS 캐시는 별도 처리 (Search Console URL 제거 도구 등)

**(4) GitHub Pages 자체 다운**
- status.github.com 확인. 사용자 대응 불필요.

### 11.4 girok-md 업데이트 정책

- girok-md는 템플릿이라 자동 업데이트 안 됨.
- 분기 1회 또는 새 기능 필요 시 upstream 변경사항을 cherry-pick / 수동 머지.
- MVP 단계에서는 업데이트 무시 OK.

### 11.5 모니터링

- **사이트 가용성**: 본인 가끔 접속 확인 (외부 uptime 모니터링은 Phase 2)
- **트래픽**: GoatCounter 대시보드
- **댓글**: GitHub Notifications (Giscus = GitHub Discussions)

---

## 12. Phase 2 후보 (MVP 이후)

- `seoul-citydata-platform` 시리즈 후속 4~5편
- `recipe-platform` 회고 시리즈
- `Learning Spark` 챕터별 정리 — 책+프로젝트 연결 형식
  - 시드: `/Users/aryijq/Documents/02_DE_study/book-review/01-Learning-Spark/`
  - 위치 결정 필요: vault로 이동? 별도 처리?
- 커스텀 도메인 도입
- Sync wrapper (B 옵션) 도입 — 발행 빈도/사고 발생 시
- Lint 스크립트 — 1차 태그 누락 검증
- Google Search Console 등록
- About 외 메타 페이지 (Projects 시리즈 안내, "이 블로그 사용법" 등)

---

## 13. 미해결 / 외부 의존 항목

| 항목 | 처리 시점 | 비고 |
|---|---|---|
| Giscus `repo_id`, `category_id` | 첫 셋업 (Day 1) | https://giscus.app 발급 |
| GoatCounter `site_code` | 첫 셋업 (Day 1) | https://goatcounter.com 가입 |
| girok-md 헤더 메뉴 커스텀 위치 | 첫 셋업 시 확인 | `setting.toml [nav]` vs 코드 수정 |
| About 페이지 노출 방식 검증 | 첫 셋업 시 확인 | 마크다운 1편으로 OK인지, fallback 필요한지 |
| Learning Spark 자료(vault 밖) 처리 | Phase 2 | vault 이동 vs 별도 처리 |

---

## 14. 본 문서 위치

- **Spec 위치**: `/Users/aryijq/Documents/01_DE_project/benidjor.github.io/docs/superpowers/specs/2026-05-03-tech-blog-design.md`
- 이 디렉토리는 첫 셋업 절차의 **2단계** (girok-md clone) 시점에 blog 레포가 됩니다. spec은 그대로 보존되어 새 레포의 일부가 됩니다.
- 만약 girok-md clone이 빈 디렉토리를 요구한다면, spec을 임시로 다른 곳으로 옮기고 clone 완료 후 다시 옮길 수 있습니다 (셋업 시 결정).
