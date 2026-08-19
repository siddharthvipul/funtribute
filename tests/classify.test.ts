import { describe, test, expect } from 'vitest';
import { classifyIssue, type RawIssue } from '../src/lib/classify/issue';

const NOW = new Date('2026-08-19T00:00:00Z');

function issue(overrides: Partial<RawIssue> = {}): RawIssue {
  return {
    number: 1,
    title: 'Something',
    body: '',
    html_url: 'https://github.com/o/r/issues/1',
    labels: [],
    assignees: [],
    comments: 0,
    created_at: '2026-08-01T00:00:00Z',
    updated_at: '2026-08-10T00:00:00Z',
    author_association: 'NONE',
    ...overrides,
  };
}

describe('contribution type', () => {
  // Real unlabeled primeroIMS/primero issues. Without heuristics all 24 of
  // Primero's issues are invisible to the platform.
  test('infers design work from accessibility language', () => {
    const result = classifyIssue(
      issue({
        title: 'Input and placeholder text contrast was too weak',
        body: 'Problem: Default input/placeholder styling could fail AA readability.',
      }),
      NOW,
    );

    expect(result.contributionType).toBe('design');
    expect(result.contributionTypeSource).toBe('inferred');
  });

  test('infers docs work from install-instruction language', () => {
    const result = classifyIssue(
      issue({ title: 'Provide instructions for mac users to install locally' }),
      NOW,
    );

    expect(result.contributionType).toBe('docs');
  });

  // "Language toggle" is a UI widget, not a translation task. The real Primero
  // issue is about colour contrast on that widget.
  test('does not mistake a UI language switcher for translation work', () => {
    const result = classifyIssue(
      issue({
        title: 'Language toggle text contrast was too low',
        body: 'Problem: Language switcher text color was borderline on white.',
      }),
      NOW,
    );

    expect(result.contributionType).toBe('design');
  });

  test('still recognises genuine translation work', () => {
    const result = classifyIssue(
      issue({ title: 'Add Spanish translation for the login screen' }),
      NOW,
    );

    expect(result.contributionType).toBe('translation');
  });

  test('prefers an explicit label over inference', () => {
    const result = classifyIssue(
      issue({ title: 'Fix the contrast on the login page', labels: ['documentation'] }),
      NOW,
    );

    expect(result.contributionType).toBe('docs');
    expect(result.contributionTypeSource).toBe('label');
  });
});

describe('readiness', () => {
  test('marks an unassigned, recently touched, unblocked issue ready', () => {
    expect(classifyIssue(issue({ updated_at: '2026-08-10T00:00:00Z' }), NOW).readiness).toBe(
      'ready',
    );
  });

  test('marks an assigned issue claimed so it is not offered as available', () => {
    expect(classifyIssue(issue({ assignees: ['someone'] }), NOW).readiness).toBe('claimed');
  });

  test('marks a blocked issue blocked regardless of how new it is', () => {
    expect(classifyIssue(issue({ labels: ['needs discussion'] }), NOW).readiness).toBe('blocked');
  });

  // The real GeoSight "Save button not activated" issue: open 1090 days,
  // untouched for 1002. It currently ranks as a good first issue.
  test('marks a long-untouched issue stale even when labeled good first issue', () => {
    const result = classifyIssue(
      issue({
        title: '[BUG] Save button not activated after changing filters',
        labels: ['good first issue'],
        created_at: '2023-08-24T00:00:00Z',
        updated_at: '2023-11-20T00:00:00Z',
      }),
      NOW,
    );

    expect(result.readiness).toBe('stale');
    expect(result.readiness).not.toBe('ready');
    expect(result.staleDays).toBeGreaterThan(365);
  });
});

describe('beginner friendliness', () => {
  test('trusts an explicit good first issue label', () => {
    const result = classifyIssue(issue({ labels: ['good first issue'] }), NOW);
    expect(result.isBeginnerFriendly).toBe(true);
    expect(result.beginnerSource).toBe('label');
  });

  test('infers beginner friendliness from a small, ready, unclaimed issue', () => {
    const result = classifyIssue(
      issue({
        title: 'Missing PRIMERO_MESSAGE_SECRET in local.env.sample.development',
        body: 'PRIMERO_MESSAGE_SECRET is not set in local.env.sample.development file',
      }),
      NOW,
    );

    expect(result.isBeginnerFriendly).toBe(true);
    expect(result.beginnerSource).toBe('inferred');
  });

  // A real unlabeled Primero issue. It is a support request, not a task
  // someone can pick up and send a PR for.
  test('does not offer a support question as beginner-friendly work', () => {
    const result = classifyIssue(
      issue({
        title: 'Question on API Authentification flow for SSO-enabled users',
        body: 'Hello, I am attempting to connect to a Primero instance through the API.',
      }),
      NOW,
    );

    expect(result.isBeginnerFriendly).toBe(false);
  });

  test('never infers beginner friendliness for a blocked issue', () => {
    const result = classifyIssue(
      issue({ title: 'Small tweak', labels: ['blocked'] }),
      NOW,
    );
    expect(result.isBeginnerFriendly).toBe(false);
  });
});

describe('effort', () => {
  test('reads effort from a label when the repo provides one', () => {
    const result = classifyIssue(issue({ labels: [':clock4: 3  - 4 hours'] }), NOW);
    expect(result.effort).toBe('S');
    expect(result.effortSource).toBe('label');
  });

  test('falls back to inferring effort from issue shape', () => {
    const result = classifyIssue(
      issue({ body: 'x'.repeat(50) }),
      NOW,
    );
    expect(result.effort).toBe('S');
    expect(result.effortSource).toBe('inferred');
  });

  test('infers larger effort from a multi-task checklist', () => {
    const result = classifyIssue(
      issue({ body: ['- [ ] one', '- [ ] two', '- [ ] three', '- [ ] four'].join('\n') }),
      NOW,
    );
    expect(result.effort).not.toBe('S');
  });
});
