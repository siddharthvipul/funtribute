import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import type { ContributionType, Effort, Priority } from '../../types';

/** Facets extracted from an issue's raw label strings. */
export interface LabelFacets {
  beginner: boolean;
  helpWanted: boolean;
  contributionTypes: ContributionType[];
  areas: string[];
  techHints: string[];
  blockers: string[];
  campaigns: string[];
  effort: Effort | null;
  priority: Priority | null;
  /** Raw labels matching nothing in the taxonomy, surfaced in the build report. */
  unmapped: string[];
}

interface RawTaxonomy {
  beginner: string[];
  help_wanted: string[];
  contribution_type: Record<string, string[]>;
  area: Record<string, string[]>;
  tech_hint: Record<string, string[]>;
  blocker: Record<string, string[]>;
  campaign: Record<string, string[]>;
  priority: Record<string, string[]>;
}

const TAXONOMY_PATH = path.resolve(
  import.meta.dirname,
  '../../../data/label-taxonomy.yaml',
);

/** normalized alias -> canonical id, per facet group. */
type AliasIndex = Map<string, string>;

/**
 * Build the alias lookup for one facet group.
 *
 * Validates alias types because YAML makes this easy to get wrong: an unquoted
 * `- priority: high` parses as a map rather than a string, and without this
 * check it surfaces as "toLowerCase is not a function" from deep in the loader.
 */
export function indexGroup(group: Record<string, string[]>, facet: string): AliasIndex {
  const index: AliasIndex = new Map();
  for (const [canonical, aliases] of Object.entries(group)) {
    for (const alias of aliases) {
      if (typeof alias !== 'string') {
        throw new Error(
          `label-taxonomy.yaml: ${facet}.${canonical} contains a non-string alias ` +
            `(${JSON.stringify(alias)}). Quote it, e.g. "priority: high".`,
        );
      }
      index.set(normalizeLabel(alias), canonical);
    }
  }
  return index;
}

function indexFlat(aliases: string[], canonical: string, facet: string): AliasIndex {
  return indexGroup({ [canonical]: aliases }, facet);
}

function loadTaxonomy() {
  const raw = yaml.load(fs.readFileSync(TAXONOMY_PATH, 'utf-8')) as RawTaxonomy;
  return {
    beginner: indexFlat(raw.beginner, 'beginner', 'beginner'),
    helpWanted: indexFlat(raw.help_wanted, 'help-wanted', 'help_wanted'),
    contributionType: indexGroup(raw.contribution_type, 'contribution_type'),
    area: indexGroup(raw.area, 'area'),
    techHint: indexGroup(raw.tech_hint, 'tech_hint'),
    blocker: indexGroup(raw.blocker, 'blocker'),
    campaign: indexGroup(raw.campaign, 'campaign'),
    priority: indexGroup(raw.priority, 'priority'),
  };
}

let cached: ReturnType<typeof loadTaxonomy> | null = null;
function taxonomy() {
  if (!cached) cached = loadTaxonomy();
  return cached;
}

/**
 * Extract an effort estimate from a raw label string.
 *
 * Runs against the *raw* label, before normalization: repos encode effort as
 * emoji-prefixed hour ranges (GeoSight uses `:clock4: 3  - 4 hours`), and
 * normalization strips the shortcodes that make those readable.
 *
 * Buckets on the upper bound: <=4h is S, <=12h is M, beyond that L.
 */
export function parseEffort(rawLabel: string): Effort | null {
  const match = rawLabel.match(/(\d+)\s*-\s*(\d+)\s*hours?/i);
  if (!match) return null;

  const upperBound = parseInt(match[2], 10);
  if (upperBound <= 4) return 'S';
  if (upperBound <= 12) return 'M';
  return 'L';
}

/**
 * Reduce a label to a comparison key.
 *
 * Separators are removed rather than collapsed to spaces, because that is the
 * only way the real-world variants converge: GeoSight's `Back-end` and HOPE's
 * `backend` are one concept, as are `good-first-issue` and `good first issue`.
 */
export function normalizeLabel(rawLabel: string): string {
  return rawLabel
    .toLowerCase()
    .replace(/:[a-z0-9_+-]+:/g, '')
    .replace(/\p{Extended_Pictographic}/gu, '')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Sort an issue's raw labels into Funtribute's facets.
 *
 * Effort is read from the raw string (see parseEffort) because normalization
 * destroys the hour ranges. Everything else matches on the normalized key.
 */
export function classifyLabels(rawLabels: string[]): LabelFacets {
  const t = taxonomy();
  const facets: LabelFacets = {
    beginner: false,
    helpWanted: false,
    contributionTypes: [],
    areas: [],
    techHints: [],
    blockers: [],
    campaigns: [],
    effort: null,
    priority: null,
    unmapped: [],
  };

  const push = (list: string[], value: string) => {
    if (!list.includes(value)) list.push(value);
  };

  for (const raw of rawLabels) {
    let matched = false;

    const effort = parseEffort(raw);
    if (effort) {
      // Keep the largest estimate when a repo applies several.
      const rank = { S: 0, M: 1, L: 2 };
      if (!facets.effort || rank[effort] > rank[facets.effort]) facets.effort = effort;
      matched = true;
    }

    const key = normalizeLabel(raw);
    if (!key) continue;

    if (t.beginner.has(key)) {
      facets.beginner = true;
      matched = true;
    }
    if (t.helpWanted.has(key)) {
      facets.helpWanted = true;
      matched = true;
    }

    const contributionType = t.contributionType.get(key);
    if (contributionType) {
      push(facets.contributionTypes, contributionType);
      matched = true;
    }

    const area = t.area.get(key);
    if (area) {
      push(facets.areas, area);
      matched = true;
    }

    const techHint = t.techHint.get(key);
    if (techHint) {
      push(facets.techHints, techHint);
      matched = true;
    }

    const blocker = t.blocker.get(key);
    if (blocker) {
      push(facets.blockers, blocker);
      matched = true;
    }

    const campaign = t.campaign.get(key);
    if (campaign) {
      push(facets.campaigns, campaign);
      matched = true;
    }

    const priority = t.priority.get(key);
    if (priority) {
      facets.priority = priority as Priority;
      matched = true;
    }

    if (!matched) push(facets.unmapped, raw);
  }

  return facets;
}
