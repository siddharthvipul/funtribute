# Funtribute

A discovery platform that helps people find and contribute to UNICEF open source projects. Whether you write code, design, translate, test, or write documentation -- Funtribute guides you to the right project.

## Features

- **Guided Wizard** -- Step-by-step discovery for newcomers: pick your interests (SDGs), skills, and contribution type to find matching projects
- **Browse & Filter** -- Searchable catalog with filters for SDGs, tech stack, contribution type, skill level, and project category
- **Project Detail Pages** -- Full project info with live GitHub issue surfacing (good first issues, help wanted)
- **Real Data** -- GitHub data refreshed daily via CI

## Quick Start

```bash
npm install
npm run build    # fetches GitHub data + builds static site
npm run dev      # start dev server (uses cached data)
```

The prebuild step fetches live data from GitHub. For development without API calls:

```bash
npx tsx scripts/build-data.ts --dry-run   # generate mock data
npm run dev
```

## Adding a Project

Edit `data/projects.yaml` and add an entry:

```yaml
- name: Your Project
  slug: your-project
  description: A brief description
  github: org/repo
  website: https://example.com
  category: unicef           # "unicef" or "venture-fund"
  platform: github           # "github" or "gitlab"
  sdgs: [1, 4]               # SDG numbers (1-17)
  tech: [python, react]
  contribution_types: [code, docs, design, testing, translation, community]
  skill_level: [beginner, intermediate, advanced]
  tags: [keyword1, keyword2]
  good_first_issues: true
```

Then open a pull request.

## Tech Stack

- [Astro](https://astro.build) -- Static site generator
- [React](https://react.dev) -- Interactive islands (wizard, catalog filters)
- [Tailwind CSS](https://tailwindcss.com) -- Styling
- [TypeScript](https://typescriptlang.org) -- Type safety
- GitHub Actions -- CI/CD with daily data refresh
- GitHub Pages -- Hosting

## Architecture

```
data/projects.yaml          -> Curated project registry (source of truth)
scripts/build-data.ts       -> Fetches GitHub API data, outputs merged JSON
src/data/projects.json      -> Generated at build time (gitignored)
src/components/Wizard.tsx   -> Guided discovery wizard
src/components/Catalog.tsx  -> Browse & filter catalog
src/pages/projects/[slug]   -> Dynamic project detail pages
```

## License

MIT
