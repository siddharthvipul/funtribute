/**
 * Canonical tech vocabulary with aliases and a shallow hierarchy.
 *
 * Deliberately free of `fs`: the catalog and wizard both need `match()` in the
 * browser, so the taxonomy travels to the client as plain data inside
 * projects.json and gets indexed there. Loading from YAML happens in the build
 * script only (see loadTechTaxonomy in scripts/build-data.ts).
 */

export type TechKind = 'language' | 'framework' | 'runtime' | 'infra' | 'data' | 'platform';

export interface TechEntry {
  id: string;
  display: string;
  kind: TechKind;
  /** Broader tech this belongs to, e.g. react -> javascript. */
  parent?: string;
  aliases?: string[];
}

/** How a selected tech relates to a project's stack. */
export type TechMatch = 'exact' | 'ancestor' | 'descendant';

export interface TechIndex {
  resolve(raw: string): string | null;
  match(selected: string, projectTech: string[]): TechMatch | null;
  get(id: string): TechEntry | undefined;
  all(): TechEntry[];
}

/** Where a tech attribution came from, in descending authority. */
export type TechSource = 'curated' | 'github-language' | 'issue-label';

export interface TechRef {
  id: string;
  source: TechSource;
  /** 0-1. Curated entries are 1; detected languages carry their byte share. */
  weight: number;
}

export interface TechSources {
  curated: string[];
  /** Raw GitHub /languages response: language name -> bytes. */
  languageBytes: Record<string, number>;
  issueHints: string[];
}

export interface MergedTech {
  tech: TechRef[];
  unmapped: string[];
}

/**
 * Minimum share of a repo's bytes before a detected language counts.
 *
 * Without it every repo drags in its Dockerfile, Makefile and a 0.0% sliver of
 * Nix, and the filter sidebar fills with tech nobody would ever contribute in.
 */
export const MIN_LANGUAGE_SHARE = 0.05;

/** Lowercase and drop separators, so "Node.js", "node-js" and "nodejs" converge. */
function normalizeTech(raw: string): string {
  return raw.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function buildTechIndex(entries: TechEntry[]): TechIndex {
  const byId = new Map<string, TechEntry>();
  const byAlias = new Map<string, string>();

  for (const entry of entries) {
    byId.set(entry.id, entry);
    byAlias.set(normalizeTech(entry.id), entry.id);
    for (const alias of entry.aliases ?? []) {
      byAlias.set(normalizeTech(alias), entry.id);
    }
  }

  const ancestorsOf = (id: string): string[] => {
    const chain: string[] = [];
    let current = byId.get(id)?.parent;
    while (current && !chain.includes(current)) {
      chain.push(current);
      current = byId.get(current)?.parent;
    }
    return chain;
  };

  return {
    resolve: (raw) => byAlias.get(normalizeTech(raw)) ?? null,

    match(selected, projectTech) {
      if (projectTech.includes(selected)) return 'exact';

      // The project uses something more specific than what was selected.
      if (projectTech.some((tech) => ancestorsOf(tech).includes(selected))) {
        return 'descendant';
      }
      // The project uses something broader than what was selected.
      if (ancestorsOf(selected).some((parent) => projectTech.includes(parent))) {
        return 'ancestor';
      }
      return null;
    },

    get: (id) => byId.get(id),
    all: () => entries,
  };
}

/**
 * Combine curated, detected and inferred tech into one deduplicated list.
 *
 * Curated entries win on conflict: a maintainer saying "this is a Rails app"
 * outranks GitHub's byte count, which for Primero reports JavaScript purely
 * because its bundled frontend is marginally larger than its Ruby backend.
 */
export function mergeTechSources(index: TechIndex, sources: TechSources): MergedTech {
  const byId = new Map<string, TechRef>();
  const unmapped: string[] = [];

  const add = (raw: string, source: TechSource, weight: number) => {
    const id = index.resolve(raw);
    if (!id) {
      if (!unmapped.includes(raw)) unmapped.push(raw);
      return;
    }
    const existing = byId.get(id);
    if (!existing || rank(source) > rank(existing.source)) {
      byId.set(id, { id, source, weight });
    }
  };

  for (const raw of sources.curated) add(raw, 'curated', 1);

  const totalBytes = Object.values(sources.languageBytes).reduce((sum, n) => sum + n, 0);
  if (totalBytes > 0) {
    for (const [language, bytes] of Object.entries(sources.languageBytes)) {
      const share = bytes / totalBytes;
      if (share < MIN_LANGUAGE_SHARE) continue;
      add(language, 'github-language', share);
    }
  }

  for (const raw of sources.issueHints) add(raw, 'issue-label', 0.1);

  const tech = [...byId.values()].sort(
    (a, b) => rank(b.source) - rank(a.source) || b.weight - a.weight,
  );

  return { tech, unmapped };
}

function rank(source: TechSource): number {
  return source === 'curated' ? 2 : source === 'github-language' ? 1 : 0;
}
