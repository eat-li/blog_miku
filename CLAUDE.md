# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Mizuki** is a feature-rich static blog template built with **Astro 6.x** + **TypeScript** + **Svelte** + **Tailwind CSS v4**. It's a fork/evolution of [Fuwari](https://github.com/saicaca/fuwari) with many additional features (anime tracking, diary, friends, albums, Live2D mascot, music player, etc.). Static output deployed to Vercel/GitHub Pages.

## Common Commands

| Command | Action |
|---|---|
| `pnpm dev` | Dev server at `localhost:4321` (auto-syncs content first) |
| `pnpm build` | Production build → `dist/` (runs anime update → astro build → pagefind → font compress) |
| `pnpm preview` | Preview production build locally |
| `pnpm check` | Astro type/error checking |
| `pnpm lint` | Lint and auto-fix with Biome |
| `pnpm format` | Format code with Biome |
| `pnpm type-check` | TypeScript type checking (`tsc --noEmit`) |
| `pnpm new-post <filename>` | Scaffold a new blog post |

**Package manager:** pnpm (enforced, pinned to `pnpm@11.1.3`). No npm/yarn.

## Architecture

### Configuration-Driven Design

All site behavior is controlled through **18 modular config files** in `src/config/`. The barrel file `src/config/index.ts` re-exports everything. Key configs:

- `siteConfig.ts` — Core site settings (title, lang, theme, feature toggles, banner, fonts)
- `sidebarConfig.ts` — Sidebar widget layout/ordering (left/right/drawer placement)
- `navBarConfig.ts` — Navigation menu links
- `profileConfig.ts` — User profile (avatar, name, bio, social links)
- `commentConfig.ts` — Comment system (Twikoo or Giscus)
- `musicConfig.ts` — Music player (Meting or local mode)

When adding new configurable features, follow the existing pattern: create a dedicated config file in `src/config/`, define a TypeScript interface in `src/types/`, and re-export from `index.ts`.

### Content Collections

Blog posts use Astro content collections with Zod schema validation defined in `src/content.config.ts`. Frontmatter fields: title, published (date), description, image, tags, category, draft, pinned, comment, lang, permalink, encryption fields.

Special pages live in `src/content/spec/` (about, friends, diary, etc.).

### Component Organization (Atomic Design)

```
src/components/
  atoms/       — Small reusable: Badge, Button, Chip, Icon, Image, Link, Loader
  organisms/   — Structural: Navbar, Footer
  features/    — Feature-specific: anime, archive, auth, diary, friends, projects, settings, etc.
  widgets/     — Sidebar widgets: profile, announcement, categories, tags, toc, music-player, etc.
  layout/      — Layout pieces: Banner, RightSideBar
  control/     — UI controls: FloatingControls, ThemeSwitch, PageProgressBar
  comment/     — Comment system integration
  misc/        — FullscreenWallpaper, ConfigCarrier, IconifyLoader
```

### Widget/Sidebar System

`WidgetManager` (`src/utils/widget-manager.ts`) dynamically loads, sorts, and renders sidebar components based on `sidebarLayoutConfig`. Components are mapped by type string (e.g., `"profile"`, `"categories"`) to file paths, supporting left/right/drawer placement with responsive breakpoints.

### Swup Page Transitions

SPA-like transitions via Swup. `src/scripts/swup-manager.ts` orchestrates hooks with sub-modules:
- `scripts/core/` — config, hooks
- `scripts/effects/` — sakura, transition
- `scripts/handlers/` — back-to-top, fancybox, panel, scroll

### i18n System

Translation keys in `src/i18n/i18nKey.ts`, language files for EN/JA/ZH-CN/ZH-TW. The `i18n()` function resolves based on `siteConfig.lang`.

### Markdown Pipeline

12+ custom remark/rehype plugins in `src/plugins/`: admonitions, GitHub repo cards, Mermaid diagrams, KaTeX math, image width extraction, table wrapping, content extraction, directives. Expressive Code handles code blocks with custom language badges and copy buttons.

## Key Conventions

### TypeScript Path Aliases

```
@/*           → src/*
@components/* → src/components/*
@assets/*     → src/assets/*
@utils/*      → src/utils/*
@constants/*  → src/constants/*
@i18n/*       → src/i18n/*
@layouts/*    → src/layouts/*
```

### Linting/Formatting (Biome)

- **Indentation:** Tabs
- **Quotes:** Double quotes
- **Semicolons:** Always
- **Trailing commas:** Always
- **Line width:** 80
- Svelte/Astro files get relaxed lint rules

### Styling

- **Tailwind CSS v4** as primary styling (imported in `src/styles/main.css` with `@import "tailwindcss"`)
- **Stylus** for some legacy/component-specific styles
- **PostCSS** with `postcss-import` and `postcss-nesting`
- Custom theme defined in `@theme` block in `main.css`
- 20+ modular CSS files imported for specific features

### Svelte Components

Interactive UI pieces (music player, search, theme switch, settings panel) use Svelte with `client:idle` or `client:visible` Astro directives for hydration. Use `vitePreprocess` from `svelte.config.js`.

### Static Output

This is a **static site** (`output: "static"` in astro config). No SSR. All pages are pre-rendered at build time. Pagefind search index is generated post-build.

## Behavioral Guidelines

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

### 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

### 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

### 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

If the project has no test infrastructure and the task is exploratory, state success criteria in plain language instead (e.g., "verify: running `pnpm build` completes without errors").

### 5. Security Baseline

**Never commit keys or sensitive credentials to the repository.**

- All API keys, tokens, passwords, private keys, database connection strings, and similar secrets **must** be managed via environment variables or `.env` files.
- Ensure `.env` is added to `.gitignore`.
- **If any sensitive information needs to be included in the code to function, you must ask me first before committing. Do not decide on your own.**
- If you discover sensitive data that has already been committed, immediately alert me so I can rotate the key and clean up the Git history.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.
