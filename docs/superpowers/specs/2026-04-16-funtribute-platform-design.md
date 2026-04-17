# Funtribute Platform Design Spec

## Context

UNICEF needs a single entry point that helps people discover and contribute to open source projects in the UNICEF ecosystem — both UNICEF's own projects and UNICEF Venture Fund-supported companies. Contributors range from experienced open source developers to complete newcomers. Each project maintains its own contribution workflow; Funtribute acts as a discovery funnel, guiding people to the right project based on their interests (SDGs), skills (tech stack), and preferred contribution type (code, docs, design, etc.). Eventually, the platform will expand to include Digital Public Goods (DPGs) beyond UNICEF.

## MVP Scope

**In scope:** Project discovery and filtering — guided wizard for newcomers, browsable catalog for experienced contributors, project detail pages with GitHub issue surfacing.

**Out of scope for MVP:** User accounts/profiles, badges, certificates, blockchain, contribution tracking. These are planned for future phases but the architecture must not block them.

## Data Model

### Project Registry (`data/projects.yaml`)

A curated YAML file in the repo. Each project entry:

```yaml
- name: Primero
  slug: primero
  description: An application for child protection case management and GBV incident monitoring
  github: primeroIMS/primero
  website: https://www.primero.org
  category: unicef  # "unicef" | "venture-fund"
  sdgs: [16, 5]     # Peace/Justice, Gender Equality
  tech: [ruby, rails, react, docker]
  contribution_types: [code, docs, testing, translation]
  skill_level: [intermediate, advanced]
  tags: [child-protection, case-management]
  good_first_issues: true
```

**Seed projects:**
- **UNICEF projects:** Primero, HOPE, GeoSight
- **Venture Fund:** Somleng/OpenEWS, Rumsan/Rahat, Statwig/Vaccine Ledger

### Build-Time Data Enrichment

A prebuild script (`scripts/build-data.ts`) reads `projects.yaml` and for each project fetches from the GitHub API:
- Repository metadata: stars, forks, primary languages, description
- Open issue count
- Issues labeled `good first issue` or `help wanted` (title, URL, labels, created date)
- Last commit date
- Contributor count

Output: `src/data/projects.json` — merged curated + GitHub data consumed by the frontend.

### SDG Reference Data

A static mapping of all 17 SDGs with: number, name, short description, icon filename, color. Used for filtering, display, and the wizard.

## User Experience

### Landing Page

Two clear entry points:

1. **"I'm new to open source"** → Guided Wizard
2. **"Browse projects"** → Catalog with filters

Plus: brief explanation of what Funtribute is and why contributing to UNICEF projects matters.

### Path 1: Guided Wizard

A step-by-step flow (single page, multi-step UI):

1. **"What causes matter to you?"** — Select one or more SDGs (visual grid with icons and names)
2. **"How would you like to contribute?"** — Select contribution types: Code, Documentation, Design/UX, Testing, Translation, Community/Outreach
3. **"What technologies do you know?" (optional, shown only if "Code" was selected)** — Select from technologies present across projects
4. **"What's your experience level?"** — Beginner, Intermediate, Advanced
5. **Results** — Matching projects as cards, sorted by relevance (number of matching dimensions)

### Path 2: Browse & Filter Catalog

- **Filter sidebar:** SDGs, tech stack, contribution type, skill level, category (UNICEF vs. Venture Fund)
- **Search bar:** Text search across project names, descriptions, tags
- **Project cards:** Consistent card component (shared with wizard results)
- **Sort:** Most active, most beginner-friendly, recently updated

### Project Card Component

Displays:
- Project name and one-line description
- SDG badges (colored icons)
- Tech stack tags
- Contribution type icons
- Open issue count
- "Good first issues available" indicator
- Category label (UNICEF / Venture Fund)

### Project Detail Page

- Full description and mission statement
- SDG mapping with explanations of how the project relates to each goal
- Tech stack details
- Links: GitHub repo, project website, contribution guide
- Live list of `good-first-issue` and `help-wanted` GitHub issues (fetched at build time)
- Clear CTA: "Start Contributing" → links to the project's contribution guide or repo

## Architecture

### Tech Stack

- **Astro** — Static site generator, ships minimal JS
- **React** — Interactive islands (wizard, filter catalog) via Astro's React integration
- **Tailwind CSS** — Utility-first styling
- **TypeScript** — Type safety across components and build scripts
- **GitHub Actions** — CI/CD and daily data refresh
- **GitHub Pages** (or Vercel free tier) — Static hosting

### Project Structure

```
funtribute/
├── data/
│   └── projects.yaml              # Curated project registry
├── scripts/
│   └── build-data.ts              # GitHub data fetcher + merger
├── src/
│   ├── components/
│   │   ├── Wizard.tsx             # Guided discovery wizard
│   │   ├── Catalog.tsx            # Browse & filter view
│   │   ├── ProjectCard.tsx        # Reusable project card
│   │   ├── FilterSidebar.tsx      # SDG/tech/type/level filters
│   │   ├── SDGBadge.tsx           # SDG icon + label component
│   │   └── SearchBar.tsx          # Text search input
│   ├── layouts/
│   │   └── Base.astro             # Base HTML layout with header/footer
│   ├── pages/
│   │   ├── index.astro            # Landing page
│   │   ├── wizard.astro           # Wizard page (or inline on index)
│   │   ├── browse.astro           # Catalog/browse page
│   │   └── projects/
│   │       └── [slug].astro       # Dynamic project detail pages
│   ├── data/
│   │   ├── sdgs.ts                # SDG reference data (17 goals)
│   │   └── projects.json          # Generated at build time (gitignored)
│   └── styles/
│       └── global.css             # Tailwind imports + custom styles
├── public/
│   ├── sdg-icons/                 # SDG goal icon SVGs
│   └── favicon.svg
├── .github/
│   └── workflows/
│       └── build-deploy.yml       # Build + deploy, daily cron trigger
├── astro.config.mjs
├── tailwind.config.mjs
├── tsconfig.json
└── package.json
```

### Build Pipeline

1. GitHub Actions triggers on push to `main` or daily cron (e.g., 06:00 UTC)
2. `scripts/build-data.ts` runs as prebuild:
   - Reads `data/projects.yaml`
   - Fetches GitHub API with `GITHUB_TOKEN` secret
   - Writes `src/data/projects.json`
3. `astro build` generates static HTML/CSS/JS
4. Deploy to GitHub Pages

### Filtering Logic

Client-side filtering in the React components:
- All project data is embedded in the page at build time (small dataset, <50 projects)
- Filtering is instant — no API calls needed
- Wizard results use a scoring algorithm: more matching dimensions = higher rank
- Catalog filters use intersection (project must match ALL active filters)

## Design Principles

- **Accessible:** WCAG 2.1 AA compliance, keyboard navigable, screen reader friendly
- **Mobile-first:** Responsive design, wizard works well on mobile
- **Fast:** Static site, minimal JS, no loading spinners for content
- **Open source itself:** The platform's repo is open for contributions, YAML registry accepts PRs

## Future Phases (not in MVP, but architecture supports)

### Phase 2: Contributor Profiles & Tracking
- GitHub OAuth login via Astro auth or a lightweight serverless function
- Profile page: contributions across UNICEF projects (via GitHub API)
- Saved interest preferences
- Requires adding a small backend/serverless layer + database (or GitHub-based storage)

### Phase 3: Badges & Incentives
- Badge system for milestones (first PR, 5 PRs, cross-project contributions)
- Blockchain-issued certificates (OpenBadges or lightweight smart contract)
- Shareable profile cards and digital certificates
- Leaderboards (opt-in)

### Phase 4: Expansion
- Open to Digital Public Goods (DPGs) beyond UNICEF
- Mentor matching
- Contribution guides and onboarding tutorials
- Community features

## Verification Plan

1. **Data pipeline:** Run `scripts/build-data.ts` locally, verify `projects.json` contains enriched data for all seed projects
2. **Wizard flow:** Walk through all wizard steps, verify filtering produces correct results for various SDG/tech/type combinations
3. **Catalog:** Test all filter combinations, search, and sort options
4. **Project detail pages:** Verify each seed project has a correct detail page with GitHub issues listed
5. **Responsive:** Test on mobile viewport sizes
6. **Accessibility:** Run axe or Lighthouse accessibility audit
7. **Build + deploy:** Verify GitHub Actions workflow builds and deploys successfully
