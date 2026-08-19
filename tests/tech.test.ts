import { describe, test, expect } from 'vitest';
import { buildTechIndex, mergeTechSources, type TechEntry } from '../src/lib/taxonomy/tech';

const ENTRIES: TechEntry[] = [
  { id: 'javascript', display: 'JavaScript', kind: 'language', aliases: ['js'] },
  { id: 'nodejs', display: 'Node.js', kind: 'runtime', parent: 'javascript', aliases: ['node', 'node.js'] },
  { id: 'react', display: 'React', kind: 'framework', parent: 'javascript', aliases: ['reactjs'] },
  { id: 'python', display: 'Python', kind: 'language' },
  { id: 'django', display: 'Django', kind: 'framework', parent: 'python' },
];

describe('resolve', () => {
  test('maps aliases and casing variants onto one canonical id', () => {
    const index = buildTechIndex(ENTRIES);
    expect(index.resolve('Node.js')).toBe('nodejs');
    expect(index.resolve('node')).toBe('nodejs');
    expect(index.resolve('JS')).toBe('javascript');
    expect(index.resolve('ReactJS')).toBe('react');
  });

  test('returns null for tech outside the taxonomy', () => {
    expect(buildTechIndex(ENTRIES).resolve('cobol')).toBeNull();
  });
});

describe('match', () => {
  test('reports how a selected tech relates to a project stack', () => {
    const index = buildTechIndex(ENTRIES);

    // Someone who selects React should see React projects first.
    expect(index.match('react', ['react', 'python'])).toBe('exact');
    // Someone who knows JavaScript can work on a React project.
    expect(index.match('javascript', ['react'])).toBe('descendant');
    // Someone who knows only React still has relevant skills for a JS project.
    expect(index.match('react', ['javascript'])).toBe('ancestor');
    expect(index.match('python', ['react'])).toBeNull();
  });

  test('prefers an exact match over a hierarchical one', () => {
    const index = buildTechIndex(ENTRIES);
    expect(index.match('javascript', ['javascript', 'react'])).toBe('exact');
  });
});

describe('mergeTechSources', () => {
  const index = buildTechIndex([
    ...ENTRIES,
    { id: 'ruby', display: 'Ruby', kind: 'language' },
    { id: 'docker', display: 'Docker', kind: 'infra', aliases: ['dockerfile'] },
    { id: 'css', display: 'CSS', kind: 'language' },
  ]);

  // Primero really is ~49% JavaScript / ~48.8% Ruby. Its curated YAML lists
  // ruby first and repos.get reports only "JavaScript" - both are incomplete.
  test('keeps both halves of a genuinely dual-stack repo', () => {
    const merged = mergeTechSources(index, {
      curated: ['ruby', 'rails'],
      languageBytes: { JavaScript: 4998941, Ruby: 4968914, CSS: 119597 },
      issueHints: [],
    });

    const ids = merged.tech.map((t) => t.id);
    expect(ids).toContain('ruby');
    expect(ids).toContain('javascript');
  });

  test('drops trace languages below the share threshold', () => {
    const merged = mergeTechSources(index, {
      curated: [],
      languageBytes: { Python: 1_000_000, Nix: 200, PowerShell: 150 },
      issueHints: [],
    });

    const ids = merged.tech.map((t) => t.id);
    expect(ids).toContain('python');
    expect(ids).not.toContain('nix');
    expect(ids).not.toContain('powershell');
  });

  test('marks curated entries as authoritative over detected ones', () => {
    const merged = mergeTechSources(index, {
      curated: ['ruby'],
      languageBytes: { JavaScript: 1_000_000 },
      issueHints: [],
    });

    expect(merged.tech.find((t) => t.id === 'ruby')?.source).toBe('curated');
    expect(merged.tech.find((t) => t.id === 'javascript')?.source).toBe('github-language');
  });

  test('reports unknown tech rather than inventing vocabulary', () => {
    const merged = mergeTechSources(index, {
      curated: ['cobol'],
      languageBytes: {},
      issueHints: [],
    });

    expect(merged.tech).toHaveLength(0);
    expect(merged.unmapped).toContain('cobol');
  });
});
