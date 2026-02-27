import type { CareerRoadmap } from "~/types/roadmap";

interface ImprovementRoadmapDashboardProps {
  roadmap: CareerRoadmap;
}

const getReadinessScore = (value: string) => {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return 0;
  return Math.min(100, Math.max(0, parsed));
};

const ImprovementRoadmapDashboard = ({ roadmap }: ImprovementRoadmapDashboardProps) => {
  const readiness = getReadinessScore(roadmap.overall_readiness_score);

  return (
    <section className="mt-6 space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
      <div>
        <h3 className="text-2xl font-bold text-slate-900">Improvement Roadmap</h3>
        <p className="mt-2 text-sm text-slate-600">A personalized action plan based on your current resume profile.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-green-100 bg-green-50 p-4">
          <h4 className="font-semibold text-green-800">Matched Skills</h4>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-green-900">
            {roadmap.skill_gap_analysis.matched_skills.map((skill) => (
              <li key={skill}>{skill}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-red-100 bg-red-50 p-4">
          <h4 className="font-semibold text-red-800">Missing Skills</h4>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-red-900">
            {roadmap.skill_gap_analysis.missing_skills.map((skill) => (
              <li key={skill}>{skill}</li>
            ))}
          </ul>
        </div>
      </div>

      <div>
        <h4 className="mb-3 text-lg font-semibold text-slate-900">Learning Roadmap</h4>
        <div className="grid gap-4 lg:grid-cols-2">
          {roadmap.learning_roadmap.map((item) => (
            <article key={`${item.skill}-${item.why_needed}`} className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between gap-2">
                <h5 className="font-semibold text-slate-900">{item.skill}</h5>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium uppercase text-slate-600">{item.severity}</span>
              </div>
              <p className="mt-2 text-sm text-slate-600">{item.why_needed}</p>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Resources</p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-700">
                {item.resources.map((resource) => (
                  <li key={resource}>{resource}</li>
                ))}
              </ul>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Practice Projects</p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-700">
                {item.practice_projects.map((project) => (
                  <li key={project}>{project}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>

      <div>
        <h4 className="mb-3 text-lg font-semibold text-slate-900">Timeline</h4>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ["30 Days", roadmap.timeline_plan["30_days"]],
            ["60 Days", roadmap.timeline_plan["60_days"]],
            ["90 Days", roadmap.timeline_plan["90_days"]],
          ].map(([title, items]) => (
            <div key={String(title)} className="rounded-xl border border-slate-200 p-4">
              <h5 className="font-semibold text-slate-900">{title}</h5>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                {(items as string[]).map((task) => (
                  <li key={task}>{task}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="mb-3 text-lg font-semibold text-slate-900">Recommended Projects</h4>
        <div className="grid gap-3 md:grid-cols-2">
          {roadmap.recommended_projects.map((project) => (
            <div key={project} className="rounded-xl border border-slate-200 p-3 text-sm text-slate-800">
              {project}
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="mb-2 text-lg font-semibold text-slate-900">Certifications</h4>
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
          {roadmap.certifications.map((certification) => (
            <li key={certification}>{certification}</li>
          ))}
        </ul>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h4 className="text-lg font-semibold text-slate-900">Overall Readiness Score</h4>
          <span className="text-sm font-semibold text-slate-700">{roadmap.overall_readiness_score}</span>
        </div>
        <div className="h-3 w-full rounded-full bg-slate-200">
          <div className="h-3 rounded-full bg-blue-600" style={{ width: `${readiness}%` }} />
        </div>
      </div>
    </section>
  );
};

export default ImprovementRoadmapDashboard;