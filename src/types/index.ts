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

export type ProjectCategory = 'unicef' | 'venture-fund';

export type Platform = 'github' | 'gitlab';

export interface GitHubIssue {
  title: string;
  url: string;
  labels: string[];
  createdAt: string;
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
  goodFirstIssues: boolean;
}

export interface GitHubEnrichment {
  stars: number;
  forks: number;
  openIssueCount: number;
  contributorCount: number;
  lastCommitDate: string;
  primaryLanguage: string;
  goodFirstIssuesList: GitHubIssue[];
  helpWantedIssuesList: GitHubIssue[];
}

export interface Project extends ProjectRegistryEntry, GitHubEnrichment {}

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

export interface ProjectData {
  projects: Project[];
  techOptions: string[];
  lastUpdated: string;
}
