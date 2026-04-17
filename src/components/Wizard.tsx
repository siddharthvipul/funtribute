import { useState } from 'react';
import type { Project, WizardState, ContributionType, SkillLevel } from '../types';
import { SDG_DATA } from '../data/sdgs';
import { ProjectCard } from './ProjectCard';

interface Props {
  projects: Project[];
  techOptions: string[];
}

const CONTRIBUTION_TYPES: { type: ContributionType; label: string; icon: string }[] = [
  { type: 'code', label: 'Code', icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4' },
  { type: 'docs', label: 'Documentation', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { type: 'design', label: 'Design / UX', icon: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01' },
  { type: 'testing', label: 'Testing', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
  { type: 'translation', label: 'Translation', icon: 'M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129' },
  { type: 'community', label: 'Community', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
];

const SKILL_LEVELS: { level: SkillLevel; label: string; description: string }[] = [
  { level: 'beginner', label: 'Beginner', description: 'New to open source or this tech stack' },
  { level: 'intermediate', label: 'Intermediate', description: 'Comfortable contributing with some guidance' },
  { level: 'advanced', label: 'Advanced', description: 'Experienced contributor, can tackle complex issues' },
];

function scoreProject(project: Project, state: WizardState): number {
  let score = 0;
  for (const sdg of state.sdgs) {
    if (project.sdgs.includes(sdg)) score += 2;
  }
  for (const ct of state.contributionTypes) {
    if (project.contributionTypes.includes(ct)) score += 2;
  }
  for (const tech of state.tech) {
    if (project.tech.includes(tech)) score += 1;
  }
  if (state.skillLevel && project.skillLevel.includes(state.skillLevel)) {
    score += 3;
  }
  if (state.skillLevel === 'beginner' && project.goodFirstIssuesList.length > 0) {
    score += 2;
  }
  return score;
}

function getMatchLabel(score: number): { label: string; color: string } {
  if (score >= 8) return { label: 'Excellent match', color: 'text-green-600' };
  if (score >= 5) return { label: 'Good match', color: 'text-blue-600' };
  return { label: 'Partial match', color: 'text-gray-500' };
}

export function Wizard({ projects, techOptions }: Props) {
  const [step, setStep] = useState(0);
  const [state, setState] = useState<WizardState>({
    sdgs: [],
    contributionTypes: [],
    tech: [],
    skillLevel: null,
  });

  const showTechStep = state.contributionTypes.includes('code');
  const totalSteps = showTechStep ? 5 : 4;

  const getStepIndex = (s: number): number => {
    if (!showTechStep && s >= 2) return s + 1;
    return s;
  };

  const actualStep = getStepIndex(step);

  const toggleSDG = (num: number) => {
    setState((prev) => ({
      ...prev,
      sdgs: prev.sdgs.includes(num)
        ? prev.sdgs.filter((s) => s !== num)
        : [...prev.sdgs, num],
    }));
  };

  const toggleContribution = (type: ContributionType) => {
    setState((prev) => ({
      ...prev,
      contributionTypes: prev.contributionTypes.includes(type)
        ? prev.contributionTypes.filter((c) => c !== type)
        : [...prev.contributionTypes, type],
    }));
  };

  const toggleTech = (tech: string) => {
    setState((prev) => ({
      ...prev,
      tech: prev.tech.includes(tech)
        ? prev.tech.filter((t) => t !== tech)
        : [...prev.tech, tech],
    }));
  };

  const scoredProjects = projects
    .map((p) => ({ project: p, score: scoreProject(p, state) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Progress */}
      <div className="flex items-center gap-2 mb-8" role="progressbar" aria-valuenow={step + 1} aria-valuemin={1} aria-valuemax={totalSteps}>
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={`h-2 flex-1 rounded-full ${i <= step ? 'bg-[#1cabe2]' : 'bg-gray-200'}`}
          />
        ))}
      </div>

      <div aria-live="polite">
        {/* Step 0: SDGs */}
        {actualStep === 0 && (
          <div role="group" aria-labelledby="step-sdg-heading">
            <h2 id="step-sdg-heading" className="text-2xl font-bold mb-2">What causes matter to you?</h2>
            <p className="text-gray-600 mb-6">Select one or more Sustainable Development Goals</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {SDG_DATA.map((sdg) => {
                const selected = state.sdgs.includes(sdg.number);
                return (
                  <button
                    key={sdg.number}
                    onClick={() => toggleSDG(sdg.number)}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      selected
                        ? 'border-current shadow-sm'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    style={selected ? { borderColor: sdg.color, backgroundColor: `${sdg.color}10` } : undefined}
                    aria-pressed={selected}
                  >
                    <div
                      className="w-8 h-8 rounded flex items-center justify-center text-white text-sm font-bold mb-1"
                      style={{ backgroundColor: sdg.color }}
                    >
                      {sdg.number}
                    </div>
                    <span className="text-xs font-medium leading-tight block">{sdg.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 1: Contribution Types */}
        {actualStep === 1 && (
          <div role="group" aria-labelledby="step-contrib-heading">
            <h2 id="step-contrib-heading" className="text-2xl font-bold mb-2">How would you like to contribute?</h2>
            <p className="text-gray-600 mb-6">Select all that apply</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {CONTRIBUTION_TYPES.map(({ type, label, icon }) => {
                const selected = state.contributionTypes.includes(type);
                return (
                  <button
                    key={type}
                    onClick={() => toggleContribution(type)}
                    className={`p-4 rounded-lg border-2 text-center transition-all ${
                      selected
                        ? 'border-[#1cabe2] bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    aria-pressed={selected}
                  >
                    <svg className="w-8 h-8 mx-auto mb-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={icon} />
                    </svg>
                    <span className="text-sm font-medium">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2: Tech (conditional) */}
        {actualStep === 2 && (
          <div role="group" aria-labelledby="step-tech-heading">
            <h2 id="step-tech-heading" className="text-2xl font-bold mb-2">What technologies do you know?</h2>
            <p className="text-gray-600 mb-6">Select any that apply (optional)</p>
            <div className="flex flex-wrap gap-2">
              {techOptions.map((tech) => {
                const selected = state.tech.includes(tech);
                return (
                  <button
                    key={tech}
                    onClick={() => toggleTech(tech)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      selected
                        ? 'bg-[#1cabe2] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    aria-pressed={selected}
                  >
                    {tech}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 3: Skill Level */}
        {actualStep === 3 && (
          <div role="group" aria-labelledby="step-skill-heading">
            <h2 id="step-skill-heading" className="text-2xl font-bold mb-2">What's your experience level?</h2>
            <p className="text-gray-600 mb-6">This helps us find projects that match your skills</p>
            <div className="grid gap-3">
              {SKILL_LEVELS.map(({ level, label, description }) => {
                const selected = state.skillLevel === level;
                return (
                  <button
                    key={level}
                    onClick={() => setState((prev) => ({ ...prev, skillLevel: level }))}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      selected
                        ? 'border-[#1cabe2] bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    aria-pressed={selected}
                  >
                    <span className="font-semibold">{label}</span>
                    <span className="block text-sm text-gray-500 mt-1">{description}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 4: Results */}
        {actualStep === 4 && (
          <div>
            <h2 className="text-2xl font-bold mb-2">Your matches</h2>
            <p className="text-gray-600 mb-6">
              {scoredProjects.length > 0
                ? `We found ${scoredProjects.length} project${scoredProjects.length === 1 ? '' : 's'} for you`
                : 'No exact matches found'}
            </p>
            {scoredProjects.length > 0 ? (
              <div className="grid gap-4">
                {scoredProjects.map(({ project, score }) => {
                  const match = getMatchLabel(score);
                  return (
                    <div key={project.slug}>
                      <span className={`text-xs font-medium ${match.color} mb-1 block`}>
                        {match.label}
                      </span>
                      <ProjectCard project={project} />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-500 mb-4">Try broadening your selections or browse all projects.</p>
                <a
                  href={`${import.meta.env.BASE_URL}browse`}
                  className="inline-block bg-[#1cabe2] text-white px-6 py-2 rounded-lg hover:bg-[#1899cc] transition-colors"
                >
                  Browse all projects
                </a>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-8 pt-4 border-t border-gray-200">
        <button
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="px-6 py-2 text-gray-600 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Back
        </button>
        <div className="flex gap-2">
          {actualStep === 2 && (
            <button
              onClick={() => setStep((s) => s + 1)}
              className="px-6 py-2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              Skip
            </button>
          )}
          {step < totalSteps - 1 && (
            <button
              onClick={() => setStep((s) => Math.min(totalSteps - 1, s + 1))}
              className="px-6 py-2 bg-[#1cabe2] text-white rounded-lg hover:bg-[#1899cc] transition-colors"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
