# Issue & Tech Pipeline — decisions and invariants

Context doc for the 2026-08-19 rework. Covers what isn't obvious from reading the code.
Prerequisite for growing the catalog (more UNICEF projects, or the ~250-entry DPGA registry)
and for hosting at `opensource.un.org/funtribute`.

## Why it was rebuilt

`fetchLabeledIssues` queried two hardcoded strings (`good first issue`, `help wanted`) at
`per_page: 10`. Across all 6 projects that returned **5 issues, zero help-wanted** — while the
repos held 82. The work existed; it just wasn't labelled with those two strings.

## Flow

```
data/projects.yaml ─┐
data/label-taxonomy.yaml ─┼→ scripts/build-data.ts ─→ src/data/projects.json      (index + ~3 preview issues)
data/tech-taxonomy.yaml ─┘   (GitHub: repo, /languages,  └→ src/data/projects/{slug}.json (full issue lists)
                              paginated issues, contributors)
```

Both outputs gitignored. `src/lib/` holds the pure logic: `taxonomy/labels.ts`,
`taxonomy/tech.ts`, `classify/issue.ts`.

## Decisions (and why — don't undo these blind)

| Decision | Rationale |
|---|---|
| Label normalization **removes** separators, not collapses to space | Only way `Back-end`≡`backend` and `good-first-issue`≡`good first issue` converge |
| Effort parsed from **raw** label, before normalization | Normalization strips the `:clock4:` shortcode and hour digits run together |
| `area` (frontend/backend/devops) kept separate from `tech` | "frontend" says nothing about the stack; merging pollutes the tech filter |
| Every derived field carries `'label' \| 'inferred'` provenance | Un-auditable heuristics are worse than none; UI must hedge inferred values |
| `MIN_LANGUAGE_SHARE = 0.05` on `/languages` | Otherwise every repo contributes `Nix 0.0%`, `Makefile`, `Dockerfile` as filter facets |
| Curated YAML tech outranks GitHub byte counts | Primero is 49.0% JS / 48.8% Ruby — `repos.get` reports only "JavaScript" |
| `tech.ts` is fs-free | Catalog + Wizard run `techIndex.match()` in the browser; taxonomy ships inside projects.json |
| `good_first_issues` removed from YAML, computed | Hand-declared `true` for Primero/HOPE/Somleng; all three actually had 0 |
| Payload split index vs per-slug | Browse island shipped every issue of every project to every visitor |
| Fetch errors typed (`not-found`/`rate-limited`/`error`) | Old blanket `catch` made a rate-limit and a quiet repo produce identical zeros |
| `parseYaml` validates enums | A typo'd `skill_level: expert` used to silently match no filter, hiding the project forever |

## Invariants

- An issue that is **assigned, blocked, or >365d untouched is never `ready`** and never offered
  as beginner work. `STALE_AFTER_DAYS = 365` in `classify/issue.ts`.
- Inferred beginner-friendliness additionally requires: effort S, ≤3 comments, and title not
  matching `QUESTION_PATTERN` (support questions have nothing to PR against).
- `TYPE_PATTERNS` order matters — `design` before `translation`. Reversing it re-breaks
  "Language toggle text contrast was too low" (a contrast bug, not translation work).
- Unmapped labels/tech are **reported, never silently dropped**. The build report is the
  intended mechanism for growing both taxonomies.

## Baseline (2026-08-19, use as regression check)

```
82 issues total | 19 ready | 8 beginner-ready | 20 API calls for 6 projects
```

| Repo | Found | Ready | Beginner | Note |
|---|---|---|---|---|
| primero | 24 | 11 | 6 | all 24 unlabeled → heuristics only; mostly a11y work → `design` |
| hope | 0 | 0 | 0 | all 23 "open issues" are PRs. `gf` label UNVERIFIED in taxonomy |
| geosight | 41 | 5 | 0 | 13 claimed, 22 stale; 20 effort labels; 9× `UN-OS-Week-2025` |
| somleng | 4 | 3 | 2 | JS at 1.3% → below threshold, correctly not tagged JS |
| rahat | 13 | 0 | 0 | repo dead since 2023-10; going to 0 is correct |
| vaccine-ledger | — | — | — | gitlab, `fetchStatus: 'skipped'` |

Only unmapped label: `Kartoza Funded` (funding attribution — genuinely not a facet).

## Gotchas

- YAML `- priority: high` unquoted parses as a **map**, not a string. `indexGroup()` throws a
  named error for this; quote such aliases.
- `import.meta.dirname` is undefined under `tsx -e` (CJS). Run scripts as files.
- Astro's `import.meta.glob` loads detail JSON eagerly — fine, detail pages are static.
- GitHub `issues.listForRepo` returns PRs; the `pull_request` filter is required.
- `labels` param on that endpoint is AND, not OR — one reason the old two-label approach
  couldn't be widened in place.

## Not done (deliberate)

Dormancy/quality policy for projects, asking upstream repos to restructure labels, and DPG
expansion itself. Extending to the DPGA registry (`app.digitalpublicgoods.net/api/v1`, backed by
`DPGAlliance/publicgoods-candidates`) is mostly a second source in `parseYaml` — registry entries
already carry SDGs, repo URL, license, sectors. Gaps to solve there: DPG entries lack
`contribution_types`/`skill_level`/`tags`, and 250 projects will need catalog pagination.

Deploy prep for `opensource.un.org/funtribute`: `astro.config.mjs` hardcodes
`site: 'https://vipul.dev'` + `base: '/funtribute/'`. Make both env-driven — the `BASE_URL`
convention is already used correctly everywhere, so it's config only.
