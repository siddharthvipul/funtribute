import { useState, useCallback, useMemo } from 'react';
import type { Project, FilterState } from '../types';
import { ProjectCard } from './ProjectCard';
import { SearchBar } from './SearchBar';
import { FilterSidebar } from './FilterSidebar';

interface Props {
  projects: Project[];
  techOptions: string[];
}

const INITIAL_FILTER: FilterState = {
  sdgs: [],
  tech: [],
  contributionTypes: [],
  skillLevel: [],
  category: [],
  searchQuery: '',
  sortBy: 'activity',
};

function filterProjects(projects: Project[], filter: FilterState): Project[] {
  return projects.filter((p) => {
    if (filter.sdgs.length > 0 && !filter.sdgs.some((s) => p.sdgs.includes(s))) return false;
    if (filter.tech.length > 0 && !filter.tech.some((t) => p.tech.includes(t))) return false;
    if (filter.contributionTypes.length > 0 && !filter.contributionTypes.some((c) => p.contributionTypes.includes(c))) return false;
    if (filter.skillLevel.length > 0 && !filter.skillLevel.some((s) => p.skillLevel.includes(s))) return false;
    if (filter.category.length > 0 && !filter.category.includes(p.category)) return false;
    if (filter.searchQuery) {
      const q = filter.searchQuery.toLowerCase();
      const searchable = `${p.name} ${p.description} ${p.tags.join(' ')}`.toLowerCase();
      if (!searchable.includes(q)) return false;
    }
    return true;
  });
}

function sortProjects(projects: Project[], sortBy: FilterState['sortBy']): Project[] {
  const sorted = [...projects];
  switch (sortBy) {
    case 'activity':
      return sorted.sort((a, b) => b.contributorCount - a.contributorCount);
    case 'beginner-friendly':
      return sorted.sort((a, b) => {
        const aScore = (a.goodFirstIssues ? 100 : 0) + a.goodFirstIssuesList.length;
        const bScore = (b.goodFirstIssues ? 100 : 0) + b.goodFirstIssuesList.length;
        return bScore - aScore;
      });
    case 'recently-updated':
      return sorted.sort((a, b) => {
        if (!a.lastCommitDate) return 1;
        if (!b.lastCommitDate) return -1;
        return new Date(b.lastCommitDate).getTime() - new Date(a.lastCommitDate).getTime();
      });
    default:
      return sorted;
  }
}

export function Catalog({ projects, techOptions }: Props) {
  const [filter, setFilter] = useState<FilterState>(INITIAL_FILTER);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const handleSearchChange = useCallback((query: string) => {
    setFilter((prev) => ({ ...prev, searchQuery: query }));
  }, []);

  const filtered = useMemo(
    () => sortProjects(filterProjects(projects, filter), filter.sortBy),
    [projects, filter],
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1">
          <SearchBar query={filter.searchQuery} onChange={handleSearchChange} />
        </div>
        <select
          value={filter.sortBy}
          onChange={(e) => setFilter((prev) => ({ ...prev, sortBy: e.target.value as FilterState['sortBy'] }))}
          className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-[#1cabe2] focus:border-transparent outline-none"
          aria-label="Sort projects"
        >
          <option value="activity">Most active</option>
          <option value="beginner-friendly">Beginner friendly</option>
          <option value="recently-updated">Recently updated</option>
        </select>
        <button
          onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
          className="lg:hidden border border-gray-300 rounded-lg px-3 py-2.5 text-sm hover:bg-gray-50"
          aria-label="Toggle filters"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
        </button>
      </div>

      <div className="flex gap-8">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-64 shrink-0">
          <FilterSidebar filterState={filter} onFilterChange={setFilter} techOptions={techOptions} />
        </aside>

        {/* Mobile filter drawer */}
        {mobileFiltersOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="absolute inset-0 bg-black/30" onClick={() => setMobileFiltersOpen(false)} />
            <div className="absolute right-0 top-0 bottom-0 w-80 max-w-full bg-white p-6 overflow-y-auto shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Filters</h3>
                <button onClick={() => setMobileFiltersOpen(false)} className="p-1 hover:bg-gray-100 rounded" aria-label="Close filters">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <FilterSidebar filterState={filter} onFilterChange={setFilter} techOptions={techOptions} />
            </div>
          </div>
        )}

        {/* Results */}
        <div className="flex-1">
          <p className="text-sm text-gray-500 mb-4">
            Showing {filtered.length} of {projects.length} projects
          </p>
          {filtered.length > 0 ? (
            <div className="grid sm:grid-cols-2 gap-4">
              {filtered.map((project) => (
                <ProjectCard key={project.slug} project={project} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No projects match your filters.</p>
              <button
                onClick={() => setFilter(INITIAL_FILTER)}
                className="mt-3 text-[#1cabe2] hover:underline text-sm"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
