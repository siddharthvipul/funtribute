import { describe, test, expect } from 'vitest';
import {
  parseEffort,
  normalizeLabel,
  classifyLabels,
  indexGroup,
} from '../src/lib/taxonomy/labels';

describe('parseEffort', () => {
  test('parses GeoSight clock labels into effort buckets by upper bound', () => {
    expect(parseEffort(':clock1: 1 - 1 hour')).toBe('S');
    expect(parseEffort(':clock4: 3  - 4 hours')).toBe('S');
    expect(parseEffort(':clock8: 5 - 8 hours')).toBe('M');
    expect(parseEffort(':calendar: 8 - 12 hours')).toBe('M');
    expect(parseEffort(':calendar: 20  - 24 hours')).toBe('L');
  });
});

describe('normalizeLabel', () => {
  test('converges separator variants of the same concept', () => {
    // GeoSight writes "Back-end", HOPE writes "backend" - these are one concept.
    expect(normalizeLabel('Back-end')).toBe(normalizeLabel('backend'));
    expect(normalizeLabel('good-first-issue')).toBe(normalizeLabel('good first issue'));
    expect(normalizeLabel('help_wanted')).toBe(normalizeLabel('help wanted'));
  });

  test('strips emoji shortcodes and surrounding whitespace', () => {
    expect(normalizeLabel(':clock4: 3  - 4 hours')).toBe('34hours');
    expect(normalizeLabel('  Good First Issue  ')).toBe('goodfirstissue');
  });
});

describe('classifyLabels', () => {
  test('splits a real GeoSight label set across facets', () => {
    const facets = classifyLabels([
      'good first issue',
      ':clock4: 3  - 4 hours',
      'Back-end',
      'UN-OS-Week-2025',
    ]);

    expect(facets.beginner).toBe(true);
    expect(facets.effort).toBe('S');
    expect(facets.areas).toContain('backend');
    expect(facets.campaigns).toContain('un-os-week-2025');
  });

  test('recognises blockers that make an issue unsuitable for newcomers', () => {
    expect(classifyLabels(['needs discussion']).blockers).toContain('needs-discussion');
    expect(classifyLabels(['on-hold-by-unicef']).blockers).toContain('on-hold');
    expect(classifyLabels(['work in progress']).blockers).toContain('wip');
  });

  test('maps documentation and docs to the same contribution type', () => {
    expect(classifyLabels(['documentation']).contributionTypes).toContain('docs');
    expect(classifyLabels(['docs']).contributionTypes).toContain('docs');
  });

  test('reports unrecognised labels instead of silently dropping them', () => {
    expect(classifyLabels(['Kartoza Funded']).unmapped).toContain('Kartoza Funded');
  });

  // An unquoted `- priority: high` in the YAML parses as a map, not a string.
  // That failed with "toLowerCase is not a function" deep inside the loader.
  test('rejects a non-string alias with a message naming the facet', () => {
    expect(() =>
      indexGroup({ high: [{ priority: 'high' } as unknown as string] }, 'priority'),
    ).toThrow(/priority.*high.*string/i);
  });

  // Priority is the second axis of the Effort x Priority framework in community.md.
  test('extracts priority alongside effort', () => {
    expect(classifyLabels(['high priority']).priority).toBe('high');
    expect(classifyLabels([':clock4: 3  - 4 hours']).priority).toBeNull();
  });
});
