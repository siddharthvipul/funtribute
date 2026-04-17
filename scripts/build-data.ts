import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import { Octokit } from '@octokit/rest';
import type {
  ProjectRegistryEntry,
  GitHubEnrichment,
  GitHubIssue,
  Project,
  ProjectData,
} from '../src/types/index.js';

const DRY_RUN = process.argv.includes('--dry-run');
const ROOT = path.resolve(import.meta.dirname, '..');
const YAML_PATH = path.join(ROOT, 'data', 'projects.yaml');
const OUTPUT_PATH = path.join(ROOT, 'src', 'data', 'projects.json');

interface YamlEntry {
  name: string;
  slug: string;
  description: string;
  github?: string;
  gitlab?: string;
  website: string;
  category: string;
  platform: string;
  sdgs: number[];
  tech: string[];
  contribution_types: string[];
  skill_level: string[];
  tags: string[];
  good_first_issues: boolean;
}

function parseYaml(): ProjectRegistryEntry[] {
  const raw = fs.readFileSync(YAML_PATH, 'utf-8');
  const entries = yaml.load(raw) as YamlEntry[];

  return entries.map((e) => ({
    name: e.name,
    slug: e.slug,
    description: e.description,
    github: e.github ?? e.gitlab ?? '',
    website: e.website,
    category: e.category as ProjectRegistryEntry['category'],
    platform: e.platform as ProjectRegistryEntry['platform'],
    sdgs: e.sdgs,
    tech: e.tech,
    contributionTypes: e.contribution_types as ProjectRegistryEntry['contributionTypes'],
    skillLevel: e.skill_level as ProjectRegistryEntry['skillLevel'],
    tags: e.tags,
    goodFirstIssues: e.good_first_issues,
  }));
}

function emptyEnrichment(): GitHubEnrichment {
  return {
    stars: 0,
    forks: 0,
    openIssueCount: 0,
    contributorCount: 0,
    lastCommitDate: '',
    primaryLanguage: '',
    goodFirstIssuesList: [],
    helpWantedIssuesList: [],
  };
}

function mockEnrichment(): GitHubEnrichment {
  return {
    stars: Math.floor(Math.random() * 200),
    forks: Math.floor(Math.random() * 50),
    openIssueCount: Math.floor(Math.random() * 30),
    contributorCount: Math.floor(Math.random() * 20) + 1,
    lastCommitDate: new Date().toISOString(),
    primaryLanguage: 'TypeScript',
    goodFirstIssuesList: [
      {
        title: 'Example good first issue',
        url: 'https://github.com/example/repo/issues/1',
        labels: ['good first issue'],
        createdAt: new Date().toISOString(),
      },
    ],
    helpWantedIssuesList: [],
  };
}

async function fetchGitHubData(
  octokit: Octokit,
  repoPath: string,
): Promise<GitHubEnrichment> {
  const [owner, repo] = repoPath.split('/');
  if (!owner || !repo) {
    console.warn(`  Invalid repo path: ${repoPath}`);
    return emptyEnrichment();
  }

  try {
    const { data: repoData } = await octokit.repos.get({ owner, repo });

    const goodFirstIssues = await fetchLabeledIssues(
      octokit,
      owner,
      repo,
      'good first issue',
    );
    const helpWantedIssues = await fetchLabeledIssues(
      octokit,
      owner,
      repo,
      'help wanted',
    );

    let contributorCount = 0;
    try {
      const { headers } = await octokit.repos.listContributors({
        owner,
        repo,
        per_page: 1,
        anon: 'true',
      });
      const linkHeader = headers.link;
      if (linkHeader) {
        const match = linkHeader.match(/page=(\d+)>; rel="last"/);
        contributorCount = match ? parseInt(match[1], 10) : 1;
      } else {
        contributorCount = 1;
      }
    } catch {
      contributorCount = 0;
    }

    return {
      stars: repoData.stargazers_count,
      forks: repoData.forks_count,
      openIssueCount: repoData.open_issues_count,
      contributorCount,
      lastCommitDate: repoData.pushed_at ?? '',
      primaryLanguage: repoData.language ?? '',
      goodFirstIssuesList: goodFirstIssues,
      helpWantedIssuesList: helpWantedIssues,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`  Failed to fetch ${repoPath}: ${message}`);
    return emptyEnrichment();
  }
}

async function fetchLabeledIssues(
  octokit: Octokit,
  owner: string,
  repo: string,
  label: string,
): Promise<GitHubIssue[]> {
  try {
    const { data } = await octokit.issues.listForRepo({
      owner,
      repo,
      labels: label,
      state: 'open',
      per_page: 10,
    });

    return data
      .filter((issue) => !issue.pull_request)
      .map((issue) => ({
        title: issue.title,
        url: issue.html_url,
        labels: issue.labels
          .map((l) => (typeof l === 'string' ? l : l.name ?? ''))
          .filter(Boolean),
        createdAt: issue.created_at,
      }));
  } catch {
    return [];
  }
}

async function main() {
  console.log('Building project data...');

  const entries = parseYaml();
  console.log(`Loaded ${entries.length} projects from YAML`);

  const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN || undefined,
  });

  const projects: Project[] = [];

  for (const entry of entries) {
    console.log(`Processing: ${entry.name}`);

    let enrichment: GitHubEnrichment;

    if (DRY_RUN) {
      console.log('  (dry-run: using mock data)');
      enrichment = mockEnrichment();
    } else if (entry.platform === 'github' && entry.github) {
      enrichment = await fetchGitHubData(octokit, entry.github);
      console.log(`  Stars: ${enrichment.stars}, Issues: ${enrichment.openIssueCount}`);
    } else {
      console.log(`  (${entry.platform}: skipping GitHub enrichment)`);
      enrichment = emptyEnrichment();
    }

    projects.push({ ...entry, ...enrichment });
  }

  if (!DRY_RUN) {
    try {
      const { data: rateLimit } = await octokit.rateLimit.get();
      console.log(
        `\nGitHub API rate limit: ${rateLimit.resources.core.remaining}/${rateLimit.resources.core.limit} remaining`,
      );
    } catch {
      console.log('\nCould not check rate limit');
    }
  }

  const techOptions = [...new Set(projects.flatMap((p) => p.tech))].sort();

  const output: ProjectData = {
    projects,
    techOptions,
    lastUpdated: new Date().toISOString(),
  };

  const outputDir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));
  console.log(`\nWrote ${OUTPUT_PATH}`);
  console.log(`  ${projects.length} projects, ${techOptions.length} unique technologies`);
}

main().catch((error) => {
  console.error('Build data failed:', error);
  process.exit(1);
});
