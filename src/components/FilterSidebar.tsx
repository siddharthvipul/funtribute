import { useState } from 'react';
import type { FilterState, ContributionType, SkillLevel, ProjectCategory } from '../types';
import { SDG_DATA } from '../data/sdgs';

interface Props {
  filterState: FilterState;
  onFilterChange: (state: FilterState) => void;
  techOptions: string[];
}

function FilterSection({ title, children, count }: { title: string; children: React.ReactNode; count: number }) {
  const [open, setOpen] = useState(true);
  return (
    <fieldset className="border-b border-gray-200 pb-4">
      <legend className="w-full">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex items-center justify-between w-full text-sm font-semibold text-gray-700 py-2"
          aria-expanded={open}
        >
          <span>
            {title}
            {count > 0 && (
              <span className="ml-1.5 text-xs bg-[#1cabe2] text-white px-1.5 py-0.5 rounded-full">
                {count}
              </span>
            )}
          </span>
          <svg
            className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </legend>
      {open && <div className="mt-2 space-y-1">{children}</div>}
    </fieldset>
  );
}

function Checkbox({ checked, onChange, label, color }: {
  checked: boolean;
  onChange: () => void;
  label: string;
  color?: string;
}) {
  return (
    <label className="flex items-center gap-2 py-0.5 cursor-pointer text-sm text-gray-600 hover:text-gray-900">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="rounded border-gray-300 text-[#1cabe2] focus:ring-[#1cabe2]"
      />
      {color && (
        <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: color }} />
      )}
      {label}
    </label>
  );
}

const CONTRIBUTION_LABELS: Record<ContributionType, string> = {
  code: 'Code',
  docs: 'Documentation',
  design: 'Design / UX',
  testing: 'Testing',
  translation: 'Translation',
  community: 'Community',
};

export function FilterSidebar({ filterState, onFilterChange, techOptions }: Props) {
  const update = (partial: Partial<FilterState>) => {
    onFilterChange({ ...filterState, ...partial });
  };

  const toggleInArray = <T,>(arr: T[], item: T): T[] =>
    arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item];

  const activeCount =
    filterState.sdgs.length +
    filterState.tech.length +
    filterState.contributionTypes.length +
    filterState.skillLevel.length +
    filterState.category.length;

  return (
    <div className="space-y-2">
      {activeCount > 0 && (
        <button
          onClick={() =>
            onFilterChange({
              ...filterState,
              sdgs: [],
              tech: [],
              contributionTypes: [],
              skillLevel: [],
              category: [],
            })
          }
          className="text-xs text-[#1cabe2] hover:underline mb-2"
        >
          Clear all filters ({activeCount})
        </button>
      )}

      <FilterSection title="SDGs" count={filterState.sdgs.length}>
        {SDG_DATA.map((sdg) => (
          <Checkbox
            key={sdg.number}
            checked={filterState.sdgs.includes(sdg.number)}
            onChange={() => update({ sdgs: toggleInArray(filterState.sdgs, sdg.number) })}
            label={`${sdg.number}. ${sdg.name}`}
            color={sdg.color}
          />
        ))}
      </FilterSection>

      <FilterSection title="Contribution Type" count={filterState.contributionTypes.length}>
        {(Object.entries(CONTRIBUTION_LABELS) as [ContributionType, string][]).map(([type, label]) => (
          <Checkbox
            key={type}
            checked={filterState.contributionTypes.includes(type)}
            onChange={() => update({ contributionTypes: toggleInArray(filterState.contributionTypes, type) })}
            label={label}
          />
        ))}
      </FilterSection>

      <FilterSection title="Tech Stack" count={filterState.tech.length}>
        {techOptions.map((tech) => (
          <Checkbox
            key={tech}
            checked={filterState.tech.includes(tech)}
            onChange={() => update({ tech: toggleInArray(filterState.tech, tech) })}
            label={tech}
          />
        ))}
      </FilterSection>

      <FilterSection title="Skill Level" count={filterState.skillLevel.length}>
        {(['beginner', 'intermediate', 'advanced'] as SkillLevel[]).map((level) => (
          <Checkbox
            key={level}
            checked={filterState.skillLevel.includes(level)}
            onChange={() => update({ skillLevel: toggleInArray(filterState.skillLevel, level) })}
            label={level.charAt(0).toUpperCase() + level.slice(1)}
          />
        ))}
      </FilterSection>

      <FilterSection title="Category" count={filterState.category.length}>
        {([['unicef', 'UNICEF'], ['venture-fund', 'Venture Fund']] as [ProjectCategory, string][]).map(([cat, label]) => (
          <Checkbox
            key={cat}
            checked={filterState.category.includes(cat)}
            onChange={() => update({ category: toggleInArray(filterState.category, cat) })}
            label={label}
          />
        ))}
      </FilterSection>
    </div>
  );
}
