import type { ContributionType } from '../types';

interface Props {
  type: ContributionType;
  size?: 'sm' | 'md';
}

const ICONS: Record<ContributionType, { label: string; path: string }> = {
  code: {
    label: 'Code',
    path: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4',
  },
  docs: {
    label: 'Documentation',
    path: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  },
  design: {
    label: 'Design',
    path: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01',
  },
  testing: {
    label: 'Testing',
    path: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  translation: {
    label: 'Translation',
    path: 'M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129',
  },
  community: {
    label: 'Community',
    path: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
  },
};

export function ContributionIcon({ type, size = 'sm' }: Props) {
  const icon = ICONS[type];
  const sizeClass = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';

  return (
    <span className="inline-flex items-center gap-1 text-gray-600" title={icon.label}>
      <svg
        className={sizeClass}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon.path} />
      </svg>
      <span className="sr-only">{icon.label}</span>
    </span>
  );
}
