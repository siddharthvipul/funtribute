import type { Project } from '../types';
import { SDGBadge } from './SDGBadge';
import { ContributionIcon } from './ContributionIcon';

interface Props {
  project: Project;
}

export function ProjectCard({ project }: Props) {
  const repoUrl = project.platform === 'github'
    ? `https://github.com/${project.github}`
    : `https://gitlab.com/${project.github}`;

  return (
    <article className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow flex flex-col">
      <div className="flex items-start justify-between mb-2">
        <a
          href={`${import.meta.env.BASE_URL}projects/${project.slug}`}
          className="text-lg font-semibold text-gray-900 hover:text-[#1cabe2] transition-colors"
        >
          {project.name}
        </a>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
          project.category === 'unicef'
            ? 'bg-blue-100 text-blue-700'
            : 'bg-purple-100 text-purple-700'
        }`}>
          {project.category === 'unicef' ? 'UNICEF' : 'Venture Fund'}
        </span>
      </div>

      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{project.description}</p>

      <div className="flex flex-wrap gap-1 mb-3">
        {project.sdgs.map((sdg) => (
          <SDGBadge key={sdg} sdgNumber={sdg} />
        ))}
      </div>

      <div className="flex flex-wrap gap-1 mb-3">
        {project.tech.map((t) => (
          <span key={t} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
            {t}
          </span>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {project.contributionTypes.map((ct) => (
          <ContributionIcon key={ct} type={ct} />
        ))}
      </div>

      <div className="mt-auto flex items-center gap-4 text-xs text-gray-500 pt-3 border-t border-gray-100">
        {project.stars > 0 && (
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            {project.stars}
          </span>
        )}
        {project.openIssueCount > 0 && (
          <span>{project.openIssueCount} issues</span>
        )}
        {project.goodFirstIssuesList.length > 0 && (
          <span className="text-green-600 font-medium">
            {project.goodFirstIssuesList.length} good first issues
          </span>
        )}
      </div>
    </article>
  );
}
