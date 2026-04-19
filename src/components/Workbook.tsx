import { useState, useEffect } from 'react';
import type { WorkbookState, AudienceRow, RiseRow, DocRow, RoleRow, DocStatus } from '../types';

const STORAGE_KEY = 'funtribute-workbook';

const STEP_TITLES = [
  'Understanding Your Project and Audience',
  'The Community Experience',
  'Content and Engagement Strategy',
  'Measuring Success and Improving',
  'Project Maturity and Governance',
  'Roles and Resources',
];

const INITIAL_STATE: WorkbookState = {
  part1: {
    projectGoal: '',
    projectMission: '',
    audienceRows: [
      { segment: '', needs: '', roadblocks: '', value: '' },
      { segment: '', needs: '', roadblocks: '', value: '' },
      { segment: '', needs: '', roadblocks: '', value: '' },
    ],
  },
  part2: {
    primaryPlatform: '',
    realtimePlatform: '',
    firstMembers: '',
    initialContent: '',
    feedbackPlan: '',
  },
  part3: {
    regularContent: '',
    recurringEvents: '',
    discoveryChannels: '',
    communityAsValue: '',
    goodFirstIssueLabeling: '',
    goodFirstIssueOwner: '',
    initialPipeline: '',
  },
  part4: {
    quantitativeMetrics: '',
    qualitativeFeedback: '',
    riseRows: [
      { category: 'Recognize', strategy: '' },
      { category: 'Incentivize', strategy: '' },
      { category: 'Support', strategy: '' },
      { category: 'Elevate', strategy: '' },
    ],
  },
  part5: {
    docRows: [
      { file: 'LICENSE', status: '', notes: '' },
      { file: 'README.md', status: '', notes: '' },
      { file: 'CONTRIBUTING.md', status: '', notes: '' },
      { file: 'CODE_OF_CONDUCT.md', status: '', notes: '' },
      { file: 'SECURITY.md', status: '', notes: '' },
      { file: 'GOVERNANCE.md', status: '', notes: '' },
    ],
    roadmapLink: '',
  },
  part6: {
    roleRows: [
      { role: 'Community Lead/Manager', owner: '', responsibilities: '' },
      { role: 'Technical Support/Q&A', owner: '', responsibilities: '' },
      { role: 'Content Creation', owner: '', responsibilities: '' },
      { role: 'Event Coordination', owner: '', responsibilities: '' },
    ],
    timeCommitment: '',
    timeRecognition: '',
    hasBudget: '',
    budgetUses: '',
  },
};

const DOC_STATUS_OPTIONS: (DocStatus | '')[] = ['', 'Mandatory', 'Recommended', 'Not Started'];

function escapeTableCell(value: string): string {
  if (!value) return '*(Not yet completed)*';
  return value.replace(/\|/g, '\\|').replace(/\n/g, '<br>');
}

function fieldOrPlaceholder(value: string): string {
  return value.trim() || '*(Not yet completed)*';
}

function generateMarkdown(state: WorkbookState): string {
  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `# Community Strategy Workbook

*Generated on ${date}*

---

## Part 1: Understanding Your Project and Audience

### 1.1 Project Vision and Mission

**What is the primary goal of your project?**
${fieldOrPlaceholder(state.part1.projectGoal)}

**What is your project's mission?**
${fieldOrPlaceholder(state.part1.projectMission)}

### 1.2 Audience Segmentation

| Audience Segment | Primary Needs/Pain Points | Roadblocks | Unique Community Value |
| :--- | :--- | :--- | :--- |
${state.part1.audienceRows.map((r) => `| ${escapeTableCell(r.segment)} | ${escapeTableCell(r.needs)} | ${escapeTableCell(r.roadblocks)} | ${escapeTableCell(r.value)} |`).join('\n')}

---

## Part 2: The Community Experience

### 2.1 Community Platforms

**Primary platform for structured discussions:**
${fieldOrPlaceholder(state.part2.primaryPlatform)}

**Real-time communication platform:**
${fieldOrPlaceholder(state.part2.realtimePlatform)}

### 2.2 Onboarding and Initial Engagement

**First members to invite:**
${fieldOrPlaceholder(state.part2.firstMembers)}

**Initial content and resources:**
${fieldOrPlaceholder(state.part2.initialContent)}

**Feedback gathering plan:**
${fieldOrPlaceholder(state.part2.feedbackPlan)}

---

## Part 3: Content and Engagement Strategy

### 3.1 Content and Conversation Starters

**Regular content plan:**
${fieldOrPlaceholder(state.part3.regularContent)}

**Recurring events and prompts:**
${fieldOrPlaceholder(state.part3.recurringEvents)}

### 3.2 Community Promotion

**Discovery channels:**
${fieldOrPlaceholder(state.part3.discoveryChannels)}

**Community as core value:**
${fieldOrPlaceholder(state.part3.communityAsValue)}

### 3.3 Good First Issues Action Plan

**Issue labeling process:**
${fieldOrPlaceholder(state.part3.goodFirstIssueLabeling)}

**Responsible team member:**
${fieldOrPlaceholder(state.part3.goodFirstIssueOwner)}

**Initial pipeline (3-5 issues):**
${fieldOrPlaceholder(state.part3.initialPipeline)}

---

## Part 4: Measuring Success

### 4.1 Key Performance Indicators

**Quantitative metrics:**
${fieldOrPlaceholder(state.part4.quantitativeMetrics)}

**Qualitative feedback:**
${fieldOrPlaceholder(state.part4.qualitativeFeedback)}

### 4.2 RISE Model

| Category | Strategy |
| :--- | :--- |
${state.part4.riseRows.map((r) => `| **${r.category}** | ${escapeTableCell(r.strategy)} |`).join('\n')}

---

## Part 5: Project Maturity and Governance

### 5.1 Documentation Status

| File | Status | Notes |
| :--- | :--- | :--- |
${state.part5.docRows.map((r) => `| ${r.file} | ${escapeTableCell(r.status)} | ${escapeTableCell(r.notes)} |`).join('\n')}

### 5.2 Roadmap

**Public roadmap link:** ${fieldOrPlaceholder(state.part5.roadmapLink)}

---

## Part 6: Roles and Resources

### 6.1 Team Roles

| Role | Primary Owner | Key Responsibilities |
| :--- | :--- | :--- |
${state.part6.roleRows.map((r) => `| ${r.role} | ${escapeTableCell(r.owner)} | ${escapeTableCell(r.responsibilities)} |`).join('\n')}

### 6.2 Resources

**Time commitment (hours/week):**
${fieldOrPlaceholder(state.part6.timeCommitment)}

**Is this formally recognized?**
${fieldOrPlaceholder(state.part6.timeRecognition)}

**Dedicated budget:**
${fieldOrPlaceholder(state.part6.hasBudget)}

**Budget uses:**
${fieldOrPlaceholder(state.part6.budgetUses)}
`;
}

function downloadMarkdown(state: WorkbookState): void {
  const md = generateMarkdown(state);
  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'community-strategy-workbook.md';
  a.click();
  URL.revokeObjectURL(url);
}

// --- Inline form helpers ---

function LabeledTextArea({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#1cabe2] focus:border-transparent outline-none resize-y"
      />
    </div>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#1cabe2] focus:border-transparent outline-none"
      />
    </div>
  );
}

// --- Main component ---

export function Workbook() {
  const [step, setStep] = useState(0);
  const [state, setState] = useState<WorkbookState>(() => {
    if (typeof window === 'undefined') return INITIAL_STATE;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : INITIAL_STATE;
    } catch {
      return INITIAL_STATE;
    }
  });

  // Auto-save to localStorage with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch {
        // localStorage full or unavailable — silently ignore
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [state]);

  const updatePart1 = (updates: Partial<WorkbookState['part1']>) =>
    setState((prev) => ({ ...prev, part1: { ...prev.part1, ...updates } }));
  const updatePart2 = (updates: Partial<WorkbookState['part2']>) =>
    setState((prev) => ({ ...prev, part2: { ...prev.part2, ...updates } }));
  const updatePart3 = (updates: Partial<WorkbookState['part3']>) =>
    setState((prev) => ({ ...prev, part3: { ...prev.part3, ...updates } }));
  const updatePart4 = (updates: Partial<WorkbookState['part4']>) =>
    setState((prev) => ({ ...prev, part4: { ...prev.part4, ...updates } }));
  const updatePart5 = (updates: Partial<WorkbookState['part5']>) =>
    setState((prev) => ({ ...prev, part5: { ...prev.part5, ...updates } }));
  const updatePart6 = (updates: Partial<WorkbookState['part6']>) =>
    setState((prev) => ({ ...prev, part6: { ...prev.part6, ...updates } }));

  const updateAudienceRow = (index: number, updates: Partial<AudienceRow>) => {
    setState((prev) => {
      const rows = [...prev.part1.audienceRows] as WorkbookState['part1']['audienceRows'];
      rows[index] = { ...rows[index], ...updates };
      return { ...prev, part1: { ...prev.part1, audienceRows: rows } };
    });
  };

  const updateRiseRow = (index: number, updates: Partial<RiseRow>) => {
    setState((prev) => {
      const rows = [...prev.part4.riseRows] as WorkbookState['part4']['riseRows'];
      rows[index] = { ...rows[index], ...updates };
      return { ...prev, part4: { ...prev.part4, riseRows: rows } };
    });
  };

  const updateDocRow = (index: number, updates: Partial<DocRow>) => {
    setState((prev) => {
      const rows = [...prev.part5.docRows] as WorkbookState['part5']['docRows'];
      rows[index] = { ...rows[index], ...updates };
      return { ...prev, part5: { ...prev.part5, docRows: rows } };
    });
  };

  const updateRoleRow = (index: number, updates: Partial<RoleRow>) => {
    setState((prev) => {
      const rows = [...prev.part6.roleRows] as WorkbookState['part6']['roleRows'];
      rows[index] = { ...rows[index], ...updates };
      return { ...prev, part6: { ...prev.part6, roleRows: rows } };
    });
  };

  const handleClearAll = () => {
    if (window.confirm('This will erase all your workbook progress. Continue?')) {
      setState(INITIAL_STATE);
      setStep(0);
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore
      }
    }
  };

  const isLastStep = step === STEP_TITLES.length - 1;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Progress indicator */}
      <nav aria-label="Workbook progress" className="mb-8">
        <ol className="flex items-center justify-between">
          {STEP_TITLES.map((title, i) => (
            <li key={i} className="flex items-center flex-1 last:flex-none">
              <button
                onClick={() => setStep(i)}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors shrink-0 ${
                  i === step
                    ? 'bg-[#1cabe2] text-white'
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}
                aria-current={i === step ? 'step' : undefined}
                aria-label={`Step ${i + 1}: ${title}`}
                title={title}
              >
                {i + 1}
              </button>
              {i < STEP_TITLES.length - 1 && (
                <div className="flex-1 h-0.5 mx-1 bg-gray-200" />
              )}
            </li>
          ))}
        </ol>
      </nav>

      <div aria-live="polite">
        {/* Step 0: Understanding Your Project and Audience */}
        {step === 0 && (
          <div role="group" aria-labelledby="step-0-heading">
            <h2 id="step-0-heading" className="text-2xl font-bold mb-2">Understanding Your Project and Audience</h2>
            <p className="text-gray-600 mb-6">
              The foundation of any successful community is a deep understanding of who it serves and what problems it solves.
            </p>

            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Project Vision and Mission</h3>
              <LabeledTextArea
                label="What is the primary goal of your project? What change do you want to see in the world?"
                value={state.part1.projectGoal}
                onChange={(v) => updatePart1({ projectGoal: v })}
                placeholder="e.g., Every child has access to quality education through open digital tools"
              />
              <LabeledTextArea
                label="What is your project's mission? In a sentence or two, what does your project do?"
                value={state.part1.projectMission}
                onChange={(v) => updatePart1({ projectMission: v })}
                placeholder="e.g., We build open-source learning platforms adapted for low-connectivity environments"
              />
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-4">Audience Segmentation</h3>
              <p className="text-sm text-gray-500 mb-4">Identify 3 key groups of people you want to engage.</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th scope="col" className="text-left py-2 pr-2 font-medium text-gray-700 min-w-[120px]">Audience Segment</th>
                      <th scope="col" className="text-left py-2 pr-2 font-medium text-gray-700 min-w-[150px]">Primary Needs</th>
                      <th scope="col" className="text-left py-2 pr-2 font-medium text-gray-700 min-w-[150px]">Roadblocks</th>
                      <th scope="col" className="text-left py-2 font-medium text-gray-700 min-w-[150px]">Unique Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.part1.audienceRows.map((row, i) => (
                      <tr key={i} className="border-b border-gray-100">
                        <td className="py-2 pr-2">
                          <input
                            type="text"
                            value={row.segment}
                            onChange={(e) => updateAudienceRow(i, { segment: e.target.value })}
                            placeholder={`Audience ${i + 1}`}
                            className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-[#1cabe2] focus:border-transparent outline-none"
                          />
                        </td>
                        <td className="py-2 pr-2">
                          <textarea
                            value={row.needs}
                            onChange={(e) => updateAudienceRow(i, { needs: e.target.value })}
                            placeholder="Their needs or pain points"
                            rows={2}
                            className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-[#1cabe2] focus:border-transparent outline-none resize-y"
                          />
                        </td>
                        <td className="py-2 pr-2">
                          <textarea
                            value={row.roadblocks}
                            onChange={(e) => updateAudienceRow(i, { roadblocks: e.target.value })}
                            placeholder="Current roadblocks"
                            rows={2}
                            className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-[#1cabe2] focus:border-transparent outline-none resize-y"
                          />
                        </td>
                        <td className="py-2">
                          <textarea
                            value={row.value}
                            onChange={(e) => updateAudienceRow(i, { value: e.target.value })}
                            placeholder="What your community offers"
                            rows={2}
                            className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-[#1cabe2] focus:border-transparent outline-none resize-y"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Step 1: The Community Experience */}
        {step === 1 && (
          <div role="group" aria-labelledby="step-1-heading">
            <h2 id="step-1-heading" className="text-2xl font-bold mb-2">The Community Experience</h2>
            <p className="text-gray-600 mb-6">
              Where and how will your community gather and interact?
            </p>

            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Community Platforms</h3>
              <LabeledTextArea
                label="Where will your community primarily gather for structured discussions? Why is this the right choice?"
                value={state.part2.primaryPlatform}
                onChange={(v) => updatePart2({ primaryPlatform: v })}
                placeholder="e.g., GitHub Discussions — our contributors are already on GitHub"
              />
              <LabeledTextArea
                label="What platforms will you use for real-time, informal communication?"
                value={state.part2.realtimePlatform}
                onChange={(v) => updatePart2({ realtimePlatform: v })}
                placeholder="e.g., Discord for casual discussion, Slack for partner orgs"
              />
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-4">Onboarding and Initial Engagement</h3>
              <LabeledTextArea
                label="Who will be the first members you invite?"
                value={state.part2.firstMembers}
                onChange={(v) => updatePart2({ firstMembers: v })}
                placeholder="e.g., Existing contributors, pilot users, partner organizations"
              />
              <LabeledTextArea
                label="What initial content and resources will you provide to make them feel welcome?"
                value={state.part2.initialContent}
                onChange={(v) => updatePart2({ initialContent: v })}
                placeholder="e.g., How-to guides, project setup instructions, welcome threads"
              />
              <LabeledTextArea
                label="How will you gather feedback on the initial onboarding experience?"
                value={state.part2.feedbackPlan}
                onChange={(v) => updatePart2({ feedbackPlan: v })}
                placeholder="e.g., Short survey after first contribution, monthly feedback thread"
              />
            </div>
          </div>
        )}

        {/* Step 2: Content and Engagement Strategy */}
        {step === 2 && (
          <div role="group" aria-labelledby="step-2-heading">
            <h2 id="step-2-heading" className="text-2xl font-bold mb-2">Content and Engagement Strategy</h2>
            <p className="text-gray-600 mb-6">
              A healthy community thrives on consistent and valuable interaction.
            </p>

            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Content and Conversation Starters</h3>
              <LabeledTextArea
                label="What regular content will you create to provide value and stimulate discussion?"
                value={state.part3.regularContent}
                onChange={(v) => updatePart3({ regularContent: v })}
                placeholder="e.g., Weekly updates, monthly newsletters, technical blog posts"
              />
              <LabeledTextArea
                label="What recurring events can you host to encourage participation?"
                value={state.part3.recurringEvents}
                onChange={(v) => updatePart3({ recurringEvents: v })}
                placeholder="e.g., AMA sessions, Show and Tell Fridays, themed monthly discussions"
              />
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Community Promotion</h3>
              <LabeledTextArea
                label="How will people discover your community? List key channels and forums."
                value={state.part3.discoveryChannels}
                onChange={(v) => updatePart3({ discoveryChannels: v })}
                placeholder="e.g., Dev.to, Hacker News, university partnerships, conference talks"
              />
              <LabeledTextArea
                label="How will you frame your community as a core value of your project?"
                value={state.part3.communityAsValue}
                onChange={(v) => updatePart3({ communityAsValue: v })}
                placeholder="e.g., Community section on homepage, contributor stories in README"
              />
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-4">Good First Issues Action Plan</h3>
              <p className="text-sm text-gray-500 mb-4">
                Well-curated "good first issues" are one of the most effective ways to onboard new contributors.
              </p>
              <LabeledTextArea
                label="How will you consistently label issues with Effort and Priority?"
                value={state.part3.goodFirstIssueLabeling}
                onChange={(v) => updatePart3({ goodFirstIssueLabeling: v })}
                placeholder="e.g., T-shirt sizes (S/M/L) for effort, Low/Med/High for priority"
              />
              <LabeledInput
                label="Who will be responsible for identifying and labeling good first issues?"
                value={state.part3.goodFirstIssueOwner}
                onChange={(v) => updatePart3({ goodFirstIssueOwner: v })}
                placeholder="e.g., Engineering lead, rotating responsibility among core team"
              />
              <LabeledTextArea
                label="Can you identify 3-5 good first issues today to create an initial pipeline?"
                value={state.part3.initialPipeline}
                onChange={(v) => updatePart3({ initialPipeline: v })}
                placeholder="List issue titles or links"
              />
            </div>
          </div>
        )}

        {/* Step 3: Measuring Success */}
        {step === 3 && (
          <div role="group" aria-labelledby="step-3-heading">
            <h2 id="step-3-heading" className="text-2xl font-bold mb-2">Measuring Success and Improving</h2>
            <p className="text-gray-600 mb-6">
              Track progress and adapt your strategy to ensure your community is healthy and growing.
            </p>

            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Key Performance Indicators</h3>
              <LabeledTextArea
                label="What quantitative metrics will you track?"
                value={state.part4.quantitativeMetrics}
                onChange={(v) => updatePart4({ quantitativeMetrics: v })}
                placeholder="e.g., Time to First Response, Number of First-Time Contributors per month, Active vs Passive ratio"
              />
              <LabeledTextArea
                label="What qualitative feedback will you collect?"
                value={state.part4.qualitativeFeedback}
                onChange={(v) => updatePart4({ qualitativeFeedback: v })}
                placeholder="e.g., Surveys on satisfaction, interviews about challenges, time to first contribution"
              />
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-4">The RISE Model for Participation</h3>
              <p className="text-sm text-gray-500 mb-4">
                How will you Recognize, Incentivize, Support, and Elevate your community members?
              </p>
              <div className="space-y-4">
                {state.part4.riseRows.map((row, i) => (
                  <div key={row.category}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {row.category}
                    </label>
                    <textarea
                      value={row.strategy}
                      onChange={(e) => updateRiseRow(i, { strategy: e.target.value })}
                      placeholder={
                        row.category === 'Recognize'
                          ? 'How will you publicly acknowledge contributions?'
                          : row.category === 'Incentivize'
                            ? 'What benefits will you offer for participation?'
                            : row.category === 'Support'
                              ? 'How will you help new members get started?'
                              : 'How will you provide leadership opportunities?'
                      }
                      rows={2}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#1cabe2] focus:border-transparent outline-none resize-y"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Project Maturity and Governance */}
        {step === 4 && (
          <div role="group" aria-labelledby="step-4-heading">
            <h2 id="step-4-heading" className="text-2xl font-bold mb-2">Project Maturity and Governance</h2>
            <p className="text-gray-600 mb-6">
              Clear documentation and transparent processes are crucial for building trust and enabling contributions.
            </p>

            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Documentation Status</h3>
              <p className="text-sm text-gray-500 mb-4">
                Indicate the status of each essential file in your project's repository.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th scope="col" className="text-left py-2 pr-2 font-medium text-gray-700 min-w-[140px]">File</th>
                      <th scope="col" className="text-left py-2 pr-2 font-medium text-gray-700 min-w-[140px]">Status</th>
                      <th scope="col" className="text-left py-2 font-medium text-gray-700 min-w-[200px]">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.part5.docRows.map((row, i) => (
                      <tr key={row.file} className="border-b border-gray-100">
                        <td className="py-2 pr-2">
                          <code className="text-sm bg-gray-100 px-1.5 py-0.5 rounded">{row.file}</code>
                        </td>
                        <td className="py-2 pr-2">
                          <select
                            value={row.status}
                            onChange={(e) => updateDocRow(i, { status: e.target.value as DocStatus | '' })}
                            className="border border-gray-300 rounded px-2 py-1.5 text-sm bg-white focus:ring-2 focus:ring-[#1cabe2] focus:border-transparent outline-none"
                          >
                            {DOC_STATUS_OPTIONS.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt || '— Select —'}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2">
                          <input
                            type="text"
                            value={row.notes}
                            onChange={(e) => updateDocRow(i, { notes: e.target.value })}
                            placeholder="Any notes..."
                            className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-[#1cabe2] focus:border-transparent outline-none"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-4">Roadmap</h3>
              <LabeledInput
                label="Do you have a public project roadmap? If so, provide a link."
                value={state.part5.roadmapLink}
                onChange={(v) => updatePart5({ roadmapLink: v })}
                placeholder="https://github.com/your-org/project/wiki/Roadmap"
              />
            </div>
          </div>
        )}

        {/* Step 5: Roles and Resources */}
        {step === 5 && (
          <div role="group" aria-labelledby="step-5-heading">
            <h2 id="step-5-heading" className="text-2xl font-bold mb-2">Roles and Resources</h2>
            <p className="text-gray-600 mb-6">
              A successful community strategy requires dedicated people and resources to execute it.
            </p>

            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Community Leadership and Team Roles</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th scope="col" className="text-left py-2 pr-2 font-medium text-gray-700 min-w-[160px]">Role</th>
                      <th scope="col" className="text-left py-2 pr-2 font-medium text-gray-700 min-w-[150px]">Primary Owner</th>
                      <th scope="col" className="text-left py-2 font-medium text-gray-700 min-w-[200px]">Key Responsibilities</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.part6.roleRows.map((row, i) => (
                      <tr key={row.role} className="border-b border-gray-100">
                        <td className="py-2 pr-2 text-sm font-medium text-gray-700">{row.role}</td>
                        <td className="py-2 pr-2">
                          <input
                            type="text"
                            value={row.owner}
                            onChange={(e) => updateRoleRow(i, { owner: e.target.value })}
                            placeholder="Name or team"
                            className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-[#1cabe2] focus:border-transparent outline-none"
                          />
                        </td>
                        <td className="py-2">
                          <textarea
                            value={row.responsibilities}
                            onChange={(e) => updateRoleRow(i, { responsibilities: e.target.value })}
                            placeholder="Key responsibilities"
                            rows={2}
                            className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-[#1cabe2] focus:border-transparent outline-none resize-y"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-4">Resource Allocation</h3>
              <LabeledTextArea
                label="How many person-hours per week will your core team dedicate to community engagement?"
                value={state.part6.timeCommitment}
                onChange={(v) => updatePart6({ timeCommitment: v })}
                placeholder="e.g., 5-10 hours/week across the core team"
              />
              <LabeledTextArea
                label="Is this commitment formally recognized as part of contributors' roles?"
                value={state.part6.timeRecognition}
                onChange={(v) => updatePart6({ timeRecognition: v })}
                placeholder="e.g., Yes, community work is included in quarterly goals"
                rows={2}
              />
              <LabeledTextArea
                label="Do you have a dedicated budget for community activities?"
                value={state.part6.hasBudget}
                onChange={(v) => updatePart6({ hasBudget: v })}
                placeholder="e.g., No dedicated budget, or Yes — $X/quarter"
                rows={2}
              />
              <LabeledTextArea
                label="If yes, what might this budget be used for?"
                value={state.part6.budgetUses}
                onChange={(v) => updatePart6({ budgetUses: v })}
                placeholder="e.g., Platform fees, event software, swag, travel sponsorship"
              />
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8 pt-4 border-t border-gray-200">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="px-6 py-2 text-gray-600 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Back
          </button>
          <button
            onClick={handleClearAll}
            className="text-sm text-gray-400 hover:text-red-500 transition-colors"
          >
            Clear all
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => downloadMarkdown(state)}
            className={`px-6 py-2 rounded-lg transition-colors ${
              isLastStep
                ? 'bg-[#1cabe2] text-white hover:bg-[#1899cc]'
                : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            Download Markdown
          </button>
          {!isLastStep && (
            <button
              onClick={() => setStep((s) => Math.min(STEP_TITLES.length - 1, s + 1))}
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
