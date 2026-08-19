import projectData from './projects.json';
import { buildTechIndex } from '../lib/taxonomy/tech';
import type { ClassifiedIssue, Project, ProjectData } from '../types';

const data = projectData as unknown as ProjectData;

export const projects: Project[] = data.projects;
export const techOptions: string[] = data.techOptions;
export const techTaxonomy = data.techTaxonomy;
export const lastUpdated: string = data.lastUpdated;
export const buildReport = data.buildReport;

/** Shared index for hierarchical tech filtering in the catalog and wizard. */
export const techIndex = buildTechIndex(techTaxonomy);

/**
 * Full issue lists, kept out of the catalog bundle.
 *
 * projects.json carries only a few preview issues per project so the browse
 * page island stays small; detail pages pull the complete list from here. This
 * is eager because it resolves at build time - detail pages are static.
 */
const detailModules = import.meta.glob<{ default: { slug: string; issues: ClassifiedIssue[] } }>(
  './projects/*.json',
  { eager: true },
);

const issuesBySlug = new Map<string, ClassifiedIssue[]>(
  Object.values(detailModules).map((m) => [m.default.slug, m.default.issues]),
);

export function getIssues(slug: string): ClassifiedIssue[] {
  return issuesBySlug.get(slug) ?? [];
}

/** Order issues the way a contributor should read them: available work first. */
const READINESS_ORDER = { ready: 0, stale: 1, claimed: 2, blocked: 3 } as const;

export function sortIssuesForDisplay(issues: ClassifiedIssue[]): ClassifiedIssue[] {
  return [...issues].sort((a, b) => {
    if (a.readiness !== b.readiness) {
      return READINESS_ORDER[a.readiness] - READINESS_ORDER[b.readiness];
    }
    if (a.isBeginnerFriendly !== b.isBeginnerFriendly) {
      return a.isBeginnerFriendly ? -1 : 1;
    }
    return a.staleDays - b.staleDays;
  });
}
