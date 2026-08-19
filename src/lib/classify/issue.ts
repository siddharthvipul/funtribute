import { classifyLabels } from '../taxonomy/labels';
import type { ClassifiedIssue, ContributionType, Effort } from '../../types';

/** The subset of GitHub's issue payload the classifier needs. */
export interface RawIssue {
  number: number;
  title: string;
  body: string | null;
  html_url: string;
  labels: string[];
  assignees: string[];
  comments: number;
  created_at: string;
  updated_at: string;
  author_association: string;
}

/** Untouched for this long and we stop calling it available. */
export const STALE_AFTER_DAYS = 365;

/** Above this, an unlabeled issue stops looking like a first contribution. */
const SMALL_BODY_CHARS = 800;

/**
 * Support requests and open-ended questions. They read as small and tidy, but
 * there is nothing to submit a pull request for, so they must never be offered
 * as beginner work.
 */
const QUESTION_PATTERN =
  /^\s*(question\b|how (do|to|can)\b|is (it|there)\b|does (it|anyone)\b|help\b)|\?\s*$/i;

/**
 * Keyword patterns for inferring contribution type from prose.
 *
 * Ordered by specificity: accessibility work reads as design even though it
 * often mentions bugs, and translation must be checked before docs because
 * localization issues talk about strings and text.
 */
const TYPE_PATTERNS: [ContributionType, RegExp][] = [
  // Accessibility work is checked first: it often mentions a "language toggle"
  // or "text" without being translation work, and reads as a bug without being
  // ordinary code. Primero's open issues are mostly this.
  [
    'design',
    /\b(contrast|aria[- ]?label|a11y|accessib\w*|axe scan|screen reader|keyboard (tab |nav)\w*|wcag|design|mockup|figma|css|styling|ui\/ux)\b/i,
  ],
  ['translation', /\b(translat\w*|i18n|l10n|locali[sz]\w*)\b/i],
  ['docs', /\b(typo|readme|documentation|docs?|instructions|install\w* guide|tutorial|spelling|grammar|changelog)\b/i],
  ['testing', /\b(unit test|test coverage|e2e|end.to.end|flaky|regression test|spec file)\b/i],
  ['community', /\b(code of conduct|governance|outreach|community call|meetup)\b/i],
];

function daysBetween(from: string, now: Date): number {
  const then = new Date(from).getTime();
  if (Number.isNaN(then)) return 0;
  return Math.floor((now.getTime() - then) / 86_400_000);
}

function inferContributionType(title: string, body: string): ContributionType | null {
  const text = `${title}\n${body}`;
  for (const [type, pattern] of TYPE_PATTERNS) {
    if (pattern.test(text)) return type;
  }
  return null;
}

/**
 * Guess effort from the shape of the issue.
 *
 * Crude by design - it only ever runs when the repo gave us nothing better, and
 * every consumer can tell it apart from a real estimate via effortSource.
 */
function inferEffort(body: string): Effort {
  const checklistItems = (body.match(/^\s*-\s*\[ \]/gm) ?? []).length;
  const codeBlocks = (body.match(/```/g) ?? []).length / 2;

  if (checklistItems >= 3) return 'L';
  if (checklistItems >= 1 || body.length > SMALL_BODY_CHARS || codeBlocks >= 2) return 'M';
  return 'S';
}

export function classifyIssue(raw: RawIssue, now: Date = new Date()): ClassifiedIssue {
  const body = raw.body ?? '';
  const facets = classifyLabels(raw.labels);

  const ageDays = daysBetween(raw.created_at, now);
  const staleDays = daysBetween(raw.updated_at, now);
  const assigned = raw.assignees.length > 0;
  const blocked = facets.blockers.length > 0;

  const readiness = blocked
    ? 'blocked'
    : assigned
      ? 'claimed'
      : staleDays > STALE_AFTER_DAYS
        ? 'stale'
        : 'ready';

  const labeledType = facets.contributionTypes[0] ?? null;
  const inferredType = inferContributionType(raw.title, body);
  const contributionType = labeledType ?? inferredType ?? 'code';

  const effort = facets.effort ?? inferEffort(body);

  // Only claim an unlabeled issue is beginner-friendly when nothing argues
  // against it: small, unclaimed, unblocked, still maintained, and actually a
  // task rather than someone asking a question.
  const inferredBeginner =
    readiness === 'ready' &&
    effort === 'S' &&
    raw.comments <= 3 &&
    !QUESTION_PATTERN.test(raw.title);

  return {
    number: raw.number,
    title: raw.title,
    url: raw.html_url,
    labels: raw.labels,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,

    contributionType,
    contributionTypeSource: labeledType ? 'label' : 'inferred',

    effort,
    effortSource: facets.effort ? 'label' : 'inferred',

    priority: facets.priority,
    readiness,
    isBeginnerFriendly: facets.beginner || inferredBeginner,
    beginnerSource: facets.beginner ? 'label' : 'inferred',

    helpWanted: facets.helpWanted,
    areas: facets.areas,
    campaigns: facets.campaigns,
    blockers: facets.blockers,

    assigned,
    commentCount: raw.comments,
    ageDays,
    staleDays,
  };
}
