import { getSDG } from '../data/sdgs';

interface Props {
  sdgNumber: number;
  size?: 'sm' | 'md';
}

export function SDGBadge({ sdgNumber, size = 'sm' }: Props) {
  const sdg = getSDG(sdgNumber);
  if (!sdg) return null;

  const sizeClasses = size === 'sm'
    ? 'text-xs px-2 py-0.5 gap-1'
    : 'text-sm px-3 py-1 gap-1.5';

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium text-white ${sizeClasses}`}
      style={{ backgroundColor: sdg.color }}
      title={`SDG ${sdg.number}: ${sdg.name}`}
    >
      <span aria-hidden="true">{sdg.number}</span>
      <span className="sr-only">{`SDG ${sdg.number}: ${sdg.name}`}</span>
      {size === 'md' && <span>{sdg.name}</span>}
    </span>
  );
}
