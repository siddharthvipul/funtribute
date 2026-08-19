import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import { Octokit } from '@octokit/rest';
import { classifyIssue, type RawIssue } from '../src/lib/classify/issue.js';
import { classifyLabels } from '../src/lib/taxonomy/labels.js';
import { buildTechIndex, mergeTechSources, type TechEntry } from '../src/lib/taxonomy/tech.js';
import type {
  ProjectRegistryEntry,
  GitHubEnrichment,
  Project,
  ProjectData,
  ProjectCategory,
  Platform,
  ContributionType,
  SkillLevel,
  ClassifiedIssue,
  IssueCounts,
  FetchStatus,
  BuildReport,
} from '../src/types/index.js';

const DRY_RUN = process.argv.includes('--dry-run');
const ROOT = path.resolve(import.meta.dirname, '..');
const YAML_PATH = path.join(ROOT, 'data', 'projects.yaml');
const TECH_TAXONOMY_PATH = path.join(ROOT, 'data', 'tech-taxonomy.yaml');
const OUTPUT_PATH = path.join(ROOT, 'src', 'data', 'projects.json');
const DETAIL_DIR = path.join(ROOT, 'src', 'data', 'projects');

/** Cap per repo so one huge backlog cannot dominate the build. */
const MAX_ISSUES_PER_REPO = 300;
/** How many ready beginner issues to inline into the catalog index. */
const INDEX_ISSUE_PREVIEW = 3;

const VALID_CATEGORIES: ProjectCategory[] = ['unicef', 'venture-fund'];
const VALID_PLATFORMS: Platform[] = ['github', 'gitlab'];
const VALID_CONTRIBUTION_TYPES: ContributionType[] = [
  'code', 'docs', 'design', 'testing', 'translation', 'community',
];
const VALID_SKILL_LEVELS: SkillLevel[] = ['beginner', 'intermediate', 'advanced'];

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
}

const report: BuildReport = {
  unmappedLabels: {},
  unmappedTech: {},
  apiCalls: 0,
  rateLimitRemaining: null,
  failures: [],
};

function countUnmapped(bucket: Record<string, number>, values: string[]): void {
  for (const value of values) bucket[value] = (bucket[value] ?? 0) + 1;
}

/**
 * Validate one enum-ish field.
 *
 * The previous parser cast strings straight into union types, so a typo like
 * `skill_level: expert` produced a value that silently matched no filter and
 * quietly hid the project from every search.
 */
function requireOneOf<T extends string>(
  value: string, allowed: T[], slug: string, field: string,
): T {
  if (!allowed.includes(value as T)) {
    throw new Error(
      `projects.yaml: ${slug}.${field} is "${value}" — expected one of ${allowed.join(', ')}`,
    );
  }
  return value as T;
}

function requireAllOf<T extends string>(
  values: string[], allowed: T[], slug: string, field: string,
): T[] {
  return values.map((v) => requireOneOf(v, allowed, slug, field));
}

function parseYaml(): ProjectRegistryEntry[] {
  const entries = yaml.load(fs.readFileSync(YAML_PATH, 'utf-8')) as YamlEntry[];

  return entries.map((e) => {
    if (!e.slug) throw new Error(`projects.yaml: an entry is missing a slug (${e.name})`);
    return {
      name: e.name,
      slug: e.slug,
      description: e.description,
      github: e.github ?? e.gitlab ?? '',
      website: e.website,
      category: requireOneOf(e.category, VALID_CATEGORIES, e.slug, 'category'),
      platform: requireOneOf(e.platform, VALID_PLATFORMS, e.slug, 'platform'),
      sdgs: e.sdgs,
      tech: e.tech ?? [],
      contributionTypes: requireAllOf(
        e.contribution_types ?? [], VALID_CONTRIBUTION_TYPES, e.slug, 'contribution_types',
      ),
      skillLevel: requireAllOf(e.skill_level ?? [], VALID_SKILL_LEVELS, e.slug, 'skill_level'),
      tags: e.tags ?? [],
    };
  });
}

function loadTechTaxonomy(): TechEntry[] {
  return yaml.load(fs.readFileSync(TECH_TAXONOMY_PATH, 'utf-8')) as TechEntry[];
}

function countIssues(issues: ClassifiedIssue[]): IssueCounts {
  const by = (r: string) => issues.filter((i) => i.readiness === r).length;
  return {
    total: issues.length,
    ready: by('ready'),
    beginnerReady: issues.filter((i) => i.readiness === 'ready' && i.isBeginnerFriendly).length,
    stale: by('stale'),
    claimed: by('claimed'),
    blocked: by('blocked'),
  };
}

function emptyEnrichment(status: FetchStatus): GitHubEnrichment {
  return {
    stars: 0,
    forks: 0,
    openIssueCount: 0,
    contributorCount: 0,
    lastCommitDate: '',
    primaryLanguage: '',
    languageBytes: {},
    issues: [],
    issueCounts: countIssues([]),
    fetchStatus: status,
  };
}

function mockEnrichment(): GitHubEnrichment {
  const issues = [
    classifyIssue({
      number: 1,
      title: 'Improve the contrast on the settings page',
      body: 'Placeholder text fails AA contrast.',
      html_url: 'https://github.com/example/repo/issues/1',
      labels: ['good first issue', ':clock1: 1 - 1 hour'],
      assignees: [],
      comments: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      author_association: 'NONE',
    }),
  ];
  return {
    stars: 42,
    forks: 7,
    openIssueCount: issues.length,
    contributorCount: 5,
    lastCommitDate: new Date().toISOString(),
    primaryLanguage: 'TypeScript',
    languageBytes: { TypeScript: 90_000, CSS: 10_000 },
    issues,
    issueCounts: countIssues(issues),
    fetchStatus: 'ok',
  };
}

/** Paginate open issues, dropping PRs (listForRepo returns both). */
async function fetchOpenIssues(
  octokit: Octokit, owner: string, repo: string,
): Promise<RawIssue[]> {
  const collected: RawIssue[] = [];

  for (let page = 1; collected.length < MAX_ISSUES_PER_REPO; page++) {
    const { data } = await octokit.issues.listForRepo({
      owner, repo, state: 'open', per_page: 100, page,
    });
    report.apiCalls++;
    if (data.length === 0) break;

    for (const issue of data) {
      if (issue.pull_request) continue;
      collected.push({
        number: issue.number,
        title: issue.title,
        body: issue.body ?? '',
        html_url: issue.html_url,
        labels: issue.labels
          .map((l) => (typeof l === 'string' ? l : (l.name ?? '')))
          .filter(Boolean),
        assignees: (issue.assignees ?? []).map((a) => a.login),
        comments: issue.comments,
        created_at: issue.created_at,
        updated_at: issue.updated_at,
        author_association: issue.author_association ?? 'NONE',
      });
    }
    if (data.length < 100) break;
  }

  return collected.slice(0, MAX_ISSUES_PER_REPO);
}

function classifyError(error: unknown): { status: FetchStatus; message: string } {
  const status = (error as { status?: number })?.status;
  const message = error instanceof Error ? error.message : String(error);
  if (status === 404) return { status: 'not-found', message };
  if (status === 403 || status === 429) return { status: 'rate-limited', message };
  return { status: 'error', message };
}

async function fetchGitHubData(
  octokit: Octokit, repoPath: string, slug: string,
): Promise<GitHubEnrichment> {
  const [owner, repo] = repoPath.split('/');
  if (!owner || !repo) {
    report.failures.push({ slug, status: 'error', message: `invalid repo path "${repoPath}"` });
    return emptyEnrichment('error');
  }

  try {
    const { data: repoData } = await octokit.repos.get({ owner, repo });
    report.apiCalls++;

    const { data: languageBytes } = await octokit.repos.listLanguages({ owner, repo });
    report.apiCalls++;

    const rawIssues = await fetchOpenIssues(octokit, owner, repo);
    const now = new Date();
    const issues = rawIssues.map((raw) => classifyIssue(raw, now));

    let contributorCount = 0;
    try {
      const { headers } = await octokit.repos.listContributors({
        owner, repo, per_page: 1, anon: 'true',
      });
      report.apiCalls++;
      const match = headers.link?.match(/page=(\d+)>; rel="last"/);
      contributorCount = match ? parseInt(match[1], 10) : 1;
    } catch {
      contributorCount = 0;
    }

    return {
      stars: repoData.stargazers_count,
      forks: repoData.forks_count,
      openIssueCount: issues.length,
      contributorCount,
      lastCommitDate: repoData.pushed_at ?? '',
      primaryLanguage: repoData.language ?? '',
      languageBytes,
      issues,
      issueCounts: countIssues(issues),
      fetchStatus: 'ok',
    };
  } catch (error) {
    const { status, message } = classifyError(error);
    report.failures.push({ slug, status, message });
    console.warn(`  ! ${slug}: ${status} — ${message}`);
    return emptyEnrichment(status);
  }
}

async function main() {
  console.log('Building project data...');

  const entries = parseYaml();
  const techTaxonomy = loadTechTaxonomy();
  const techIndex = buildTechIndex(techTaxonomy);
  console.log(`Loaded ${entries.length} projects, ${techTaxonomy.length} tech entries`);

  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN || undefined });
  const projects: Project[] = [];

  for (const entry of entries) {
    console.log(`\n${entry.name}`);

    let enrichment: GitHubEnrichment;
    if (DRY_RUN) {
      enrichment = mockEnrichment();
      console.log('  (dry-run: mock data)');
    } else if (entry.platform === 'github' && entry.github) {
      enrichment = await fetchGitHubData(octokit, entry.github, entry.slug);
    } else {
      enrichment = emptyEnrichment('skipped');
      console.log(`  (${entry.platform}: no enrichment available)`);
    }

    for (const issue of enrichment.issues) {
      countUnmapped(report.unmappedLabels, classifyLabels(issue.labels).unmapped);
    }

    const merged = mergeTechSources(techIndex, {
      curated: entry.tech,
      languageBytes: enrichment.languageBytes,
      issueHints: [],
    });
    countUnmapped(report.unmappedTech, merged.unmapped);

    const counts = enrichment.issueCounts;
    if (enrichment.fetchStatus === 'ok') {
      console.log(
        `  ${counts.total} issues — ready ${counts.ready}, beginner-ready ${counts.beginnerReady}, ` +
          `stale ${counts.stale}, claimed ${counts.claimed}, blocked ${counts.blocked}`,
      );
      console.log(`  tech: ${merged.tech.map((t) => t.id).join(', ') || '(none)'}`);
    }

    projects.push({
      ...entry,
      ...enrichment,
      techRefs: merged.tech,
      goodFirstIssues: counts.beginnerReady > 0,
    });
  }

  if (!DRY_RUN) {
    try {
      const { data: rateLimit } = await octokit.rateLimit.get();
      report.rateLimitRemaining = rateLimit.resources.core.remaining;
    } catch {
      report.rateLimitRemaining = null;
    }
  }

  writeOutput(projects, techTaxonomy);
  printReport(projects);
}

function writeOutput(projects: Project[], techTaxonomy: TechEntry[]) {
  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.mkdirSync(DETAIL_DIR, { recursive: true });

  // Detail files carry the full issue list; the index carries a small preview.
  for (const project of projects) {
    fs.writeFileSync(
      path.join(DETAIL_DIR, `${project.slug}.json`),
      JSON.stringify({ slug: project.slug, issues: project.issues }, null, 2),
    );
  }

  const indexProjects = projects.map((project) => ({
    ...project,
    issues: project.issues
      .filter((i) => i.readiness === 'ready' && i.isBeginnerFriendly)
      .slice(0, INDEX_ISSUE_PREVIEW),
  }));

  const techOptions = [
    ...new Set(projects.flatMap((p) => p.techRefs.map((t) => t.id))),
  ].sort();

  const output: ProjectData = {
    projects: indexProjects,
    techOptions,
    techTaxonomy,
    lastUpdated: new Date().toISOString(),
    buildReport: report,
  };

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));
}

function printReport(projects: Project[]) {
  const totals = projects.reduce(
    (acc, p) => ({
      total: acc.total + p.issueCounts.total,
      ready: acc.ready + p.issueCounts.ready,
      beginnerReady: acc.beginnerReady + p.issueCounts.beginnerReady,
    }),
    { total: 0, ready: 0, beginnerReady: 0 },
  );

  console.log('\n--- build report ---');
  console.log(
    `issues: ${totals.total} total, ${totals.ready} ready, ${totals.beginnerReady} beginner-ready`,
  );
  console.log(`api calls: ${report.apiCalls}, rate limit remaining: ${report.rateLimitRemaining ?? 'unknown'}`);

  const labels = Object.entries(report.unmappedLabels).sort((a, b) => b[1] - a[1]);
  if (labels.length) {
    console.log(`\nunmapped labels (add to data/label-taxonomy.yaml if meaningful):`);
    for (const [label, count] of labels.slice(0, 20)) console.log(`  ${count}x  ${label}`);
  }

  const tech = Object.entries(report.unmappedTech).sort((a, b) => b[1] - a[1]);
  if (tech.length) {
    console.log(`\nunmapped tech (add to data/tech-taxonomy.yaml if meaningful):`);
    for (const [name, count] of tech) console.log(`  ${count}x  ${name}`);
  }

  if (report.failures.length) {
    console.log(`\nFAILURES (these are not "no issues" — the fetch did not succeed):`);
    for (const f of report.failures) console.log(`  ${f.slug}: ${f.status} — ${f.message}`);
  }

  console.log(`\nWrote ${OUTPUT_PATH} and ${projects.length} detail files`);
}

main().catch((error) => {
  console.error('Build data failed:', error);
  process.exit(1);
});
