# Contributing to Funtribute

Thank you for your interest in contributing to Funtribute! This project helps people discover UNICEF open source projects, and we welcome contributions of all kinds.

## Ways to Contribute

### Add a Project

The easiest way to contribute is to add a new project to the registry:

1. Fork this repository
2. Edit `data/projects.yaml` — add a new entry following the format below
3. Open a pull request

**Project entry format:**

```yaml
- name: Project Name
  slug: project-name              # URL-safe, lowercase, hyphenated
  description: Brief description   # One line
  github: org/repo                 # GitHub org/repo path
  website: https://example.com
  category: unicef                 # "unicef" or "venture-fund"
  platform: github                 # "github" or "gitlab"
  sdgs: [1, 4]                     # UN SDG numbers (1-17)
  tech: [python, react]            # Technologies used
  contribution_types: [code, docs] # code, docs, design, testing, translation, community
  skill_level: [beginner]          # beginner, intermediate, advanced
  tags: [keyword1, keyword2]       # Searchable tags
  good_first_issues: true          # Whether to fetch "good first issue" labeled issues
```

### Improve the Platform

1. Fork and clone the repository
2. Install dependencies: `npm install`
3. Generate mock data: `npx tsx scripts/build-data.ts --dry-run`
4. Start dev server: `npm run dev`
5. Make your changes
6. Run a full build to verify: `npm run build`
7. Open a pull request

### Report Issues

Open an issue on GitHub describing the bug or feature request.

## Development Notes

- `src/data/projects.json` is generated at build time and gitignored — don't edit it manually
- The prebuild script (`scripts/build-data.ts`) runs automatically before `npm run build`
- Use `--dry-run` flag to skip GitHub API calls during development
- React components are used as Astro islands — only the wizard and catalog pages ship JavaScript
