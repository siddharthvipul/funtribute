# Funtribute

UNICEF open source project discovery platform. Static Astro site deployed to `vipul.dev/funtribute/`.

## Tech Stack

- **Astro 6** (static SSG) + **React 19** (islands for interactive components) + **Tailwind CSS 4** + **TypeScript**
- Deployed via **GitHub Actions** to GitHub Pages with a daily cron rebuild
- Base URL: `/funtribute/` — all internal links MUST use `import.meta.env.BASE_URL` prefix

## Commands

```
npm run dev          # local dev server (needs projects.json to exist)
npm run build        # prebuild (GitHub data fetch) + astro build
npx tsx scripts/build-data.ts --dry-run   # generate mock data without GitHub API
npm test             # vitest: taxonomy + classifier unit tests
```

## Architecture (read files only when working on that area)

| Area | Key files | Notes |
|------|-----------|-------|
| **Types** | `src/types/index.ts` | All shared types: Project, SDG, FilterState, WizardState, etc. |
| **Data pipeline** | `scripts/build-data.ts`, `data/projects.yaml`, `src/data/load-projects.ts` | YAML registry -> GitHub enrichment -> `src/data/projects.json` (index) + `src/data/projects/{slug}.json` (full issue lists). Both gitignored. |
| **Issue classification** | `src/lib/classify/issue.ts`, `data/label-taxonomy.yaml` | Maps upstream labels onto facets, then falls back to heuristics for unlabeled issues. Every derived field carries `'label' \| 'inferred'` provenance. |
| **Tech taxonomy** | `src/lib/taxonomy/tech.ts`, `data/tech-taxonomy.yaml` | Canonical ids, aliases, parent hierarchy. Pure/bundleable — the catalog and wizard use `techIndex.match()` in the browser. |
| **Tests** | `tests/*.test.ts`, `tests/fixtures/` | Vitest. Fixtures are real captured GitHub responses, so upstream label drift shows up as a test diff. |
| **SDG reference** | `src/data/sdgs.ts`, `public/sdg-icons/` | 17 SDGs with colors, names, placeholder SVG icons |
| **Layout** | `src/layouts/Base.astro` | Header, footer, mobile nav, skip-nav link |
| **Landing page** | `src/pages/index.astro` | Hero, stats bar, two CTAs. Pure Astro, zero JS. |
| **Wizard** | `src/components/Wizard.tsx`, `src/pages/wizard.astro` | Multi-step guided discovery. React island (`client:load`). |
| **Catalog** | `src/components/Catalog.tsx`, `src/components/FilterSidebar.tsx`, `src/components/SearchBar.tsx`, `src/pages/browse.astro` | Browse/filter/search/sort. React island. |
| **Project detail** | `src/pages/projects/[slug].astro` | Dynamic static pages via `getStaticPaths()`. Pure Astro. |
| **Shared components** | `src/components/ProjectCard.tsx`, `src/components/SDGBadge.tsx`, `src/components/ContributionIcon.tsx` | Used by both Wizard and Catalog. |
| **CI/CD** | `.github/workflows/build-deploy.yml` | Build + deploy on push to main, daily 06:00 UTC cron. |

## Conventions

- **Internal links in .astro files**: use `const base = import.meta.env.BASE_URL;` then `` href={`${base}browse`} ``
- **Internal links in .tsx files**: use `` `${import.meta.env.BASE_URL}projects/${slug}` ``
- **Adding a project**: edit `data/projects.yaml` — the build script handles GitHub enrichment
- **GitLab projects**: set `platform: gitlab` in YAML — build script skips GitHub enrichment, uses curated data only
- **Tailwind 4**: uses CSS-based config via `@theme` in `src/styles/global.css`, NOT a `tailwind.config.mjs` file
- **UNICEF brand colors**: defined as `--color-unicef-blue`, `--color-unicef-dark`, etc. in global.css `@theme` block. Use as `text-unicef-blue`, `bg-unicef-dark`, etc.
- **React islands**: only Wizard and Catalog are React (`client:load`). Landing and detail pages are pure Astro — keep JS minimal.

## Data Model (quick reference)

Projects YAML fields: `name`, `slug`, `description`, `github`, `website`, `category` (unicef|venture-fund), `platform` (github|gitlab), `sdgs` (number[]), `tech`, `contribution_types`, `skill_level`, `tags`

YAML uses snake_case; TypeScript uses camelCase. The build script maps between them and **validates enum fields** — a typo like `skill_level: expert` fails the build rather than silently producing a project no filter matches.

`good_first_issues` is deliberately NOT a YAML field. It is computed from real issue data; when it was declared by hand it was wrong for three of six projects.

**Growing the taxonomies:** the build prints unmapped labels and unmapped tech. That report is the intended way to extend `data/label-taxonomy.yaml` and `data/tech-taxonomy.yaml` — check the upstream repo before adding an alias rather than guessing what a label means.

## Future Phases (not yet built)

- Phase 2: GitHub OAuth login, contributor profiles
- Phase 3: Badges, blockchain certificates
- Phase 4: Expand to Digital Public Goods beyond UNICEF

Full design spec: `docs/superpowers/specs/2026-04-16-funtribute-platform-design.md`

**Read `docs/issue-pipeline.md` before touching issue classification, the taxonomies, or the
tech filter** — it holds the design decisions, invariants, and baseline numbers that the code
alone doesn't explain.
