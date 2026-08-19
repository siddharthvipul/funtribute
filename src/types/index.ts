import type { TechEntry, TechRef } from '../lib/taxonomy/tech';
export type { TechEntry, TechRef, TechKind, TechMatch } from '../lib/taxonomy/tech';

export interface SDG {
  number: number;
  name: string;
  shortDescription: string;
  icon: string;
  color: string;
}

export type ContributionType =
  | 'code'
  | 'docs'
  | 'design'
  | 'testing'
  | 'translation'
  | 'community';

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced';

/** Rough size of a piece of work, mirroring the T-shirt framework in community.md. */
export type Effort = 'S' | 'M' | 'L';

/** The other axis of that framework: how much the project wants this done. */
export type Priority = 'low' | 'medium' | 'high';

export type ProjectCategory = 'unicef' | 'venture-fund';

export type Platform = 'github' | 'gitlab';

export interface GitHubIssue {
  title: string;
  url: string;
  labels: string[];
  createdAt: string;
}

/** Whether an issue is actually available to pick up right now. */
export type IssueReadiness = 'ready' | 'stale' | 'claimed' | 'blocked';

/**
 * Where a derived field came from. Anything 'inferred' is a heuristic guess and
 * must be presented as such - never rendered with the same confidence as a
 * value the maintainers actually put on the issue.
 */
export type DerivationSource = 'label' | 'inferred';

export interface ClassifiedIssue {
  number: number;
  title: string;
  url: string;
  labels: string[];
  createdAt: string;
  updatedAt: string;

  contributionType: ContributionType;
  contributionTypeSource: DerivationSource;

  effort: Effort;
  effortSource: DerivationSource;

  priority: Priority | null;
  readiness: IssueReadiness;
  isBeginnerFriendly: boolean;
  beginnerSource: DerivationSource;

  helpWanted: boolean;
  areas: string[];
  campaigns: string[];
  blockers: string[];

  assigned: boolean;
  commentCount: number;
  ageDays: number;
  staleDays: number;
}

export interface ProjectRegistryEntry {
  name: string;
  slug: string;
  description: string;
  github: string;
  website: string;
  category: ProjectCategory;
  platform: Platform;
  sdgs: number[];
  tech: string[];
  contributionTypes: ContributionType[];
  skillLevel: SkillLevel[];
  tags: string[];
}

/**
 * Why a repo's enrichment is empty.
 *
 * Kept distinct so the build report can tell "this repo genuinely has no open
 * issues" apart from "we were rate-limited" - previously both produced zeros.
 */
export type FetchStatus = 'ok' | 'not-found' | 'rate-limited' | 'error' | 'skipped';

export interface IssueCounts {
  total: number;
  ready: number;
  /** Ready *and* beginner-friendly: what a newcomer can actually pick up. */
  beginnerReady: number;
  stale: number;
  claimed: number;
  blocked: number;
}

export interface GitHubEnrichment {
  stars: number;
  forks: number;
  openIssueCount: number;
  contributorCount: number;
  lastCommitDate: string;
  primaryLanguage: string;
  /** Raw /languages response, byte-weighted. Feeds the tech merge. */
  languageBytes: Record<string, number>;
  issues: ClassifiedIssue[];
  issueCounts: IssueCounts;
  fetchStatus: FetchStatus;
}

export interface Project extends ProjectRegistryEntry, GitHubEnrichment {
  /** Canonical tech ids resolved from curated YAML, languages and issue labels. */
  techRefs: TechRef[];
  /** Computed, not declared: true when the project has beginner-ready work. */
  goodFirstIssues: boolean;
}

export interface WizardState {
  sdgs: number[];
  contributionTypes: ContributionType[];
  tech: string[];
  skillLevel: SkillLevel | null;
}

export interface FilterState {
  sdgs: number[];
  tech: string[];
  contributionTypes: ContributionType[];
  skillLevel: SkillLevel[];
  category: ProjectCategory[];
  searchQuery: string;
  sortBy: 'activity' | 'beginner-friendly' | 'recently-updated';
}

/** Catalog index. Detail-page issue lists live in per-slug files. */
export interface ProjectData {
  projects: Project[];
  techOptions: string[];
  /** Travels to the client so the catalog can do hierarchical tech matching. */
  techTaxonomy: TechEntry[];
  lastUpdated: string;
  buildReport: BuildReport;
}

/** Surfaced at build time so taxonomy gaps and API failures stay visible. */
export interface BuildReport {
  unmappedLabels: Record<string, number>;
  unmappedTech: Record<string, number>;
  apiCalls: number;
  rateLimitRemaining: number | null;
  failures: { slug: string; status: FetchStatus; message: string }[];
}

export type DocStatus = 'Mandatory' | 'Recommended' | 'Not Started';

export interface AudienceRow {
  segment: string;
  needs: string;
  roadblocks: string;
  value: string;
}

export interface RiseRow {
  category: 'Recognize' | 'Incentivize' | 'Support' | 'Elevate';
  strategy: string;
}

export interface DocRow {
  file: string;
  status: DocStatus | '';
  notes: string;
}

export interface RoleRow {
  role: string;
  owner: string;
  responsibilities: string;
}

export interface WorkbookState {
  part1: {
    projectGoal: string;
    projectMission: string;
    audienceRows: [AudienceRow, AudienceRow, AudienceRow];
  };
  part2: {
    primaryPlatform: string;
    realtimePlatform: string;
    firstMembers: string;
    initialContent: string;
    feedbackPlan: string;
  };
  part3: {
    regularContent: string;
    recurringEvents: string;
    discoveryChannels: string;
    communityAsValue: string;
    goodFirstIssueLabeling: string;
    goodFirstIssueOwner: string;
    initialPipeline: string;
  };
  part4: {
    quantitativeMetrics: string;
    qualitativeFeedback: string;
    riseRows: [RiseRow, RiseRow, RiseRow, RiseRow];
  };
  part5: {
    docRows: [DocRow, DocRow, DocRow, DocRow, DocRow, DocRow];
    roadmapLink: string;
  };
  part6: {
    roleRows: [RoleRow, RoleRow, RoleRow, RoleRow];
    timeCommitment: string;
    timeRecognition: string;
    hasBudget: string;
    budgetUses: string;
  };
}
