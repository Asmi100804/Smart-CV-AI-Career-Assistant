import { Link, useParams } from "react-router";
import { useEffect, useState } from "react";
import Summary from "~/components/Summary";
import ATS from "~/components/ATS";
import Details from "~/components/Details";
import GenerateRoadmapButton from "~/components/roadmap/GenerateRoadmapButton";
import ImprovementRoadmapDashboard from "~/components/roadmap/ImprovementRoadmapDashboard";
import { requestCareerRoadmap } from "~/lib/career-roadmap-api";
import type { CareerRoadmap } from "~/types/roadmap";
import { getStoredResumeById } from "~/lib/resume-storage";

export const meta = () => [
  { title: "Resumind | Review " },
  { name: "description", content: "Detailed overview of your resume" },
];

const Resume = () => {
  const { id = "" } = useParams();
  const [resume, setResume] = useState<Resume | null>(null);
  const [roadmap, setRoadmap] = useState<CareerRoadmap | null>(null);
  const [isGeneratingRoadmap, setIsGeneratingRoadmap] = useState(false);
  const [roadmapError, setRoadmapError] = useState("");

  useEffect(() => {
    setResume(getStoredResumeById(id));
  }, [id]);

  const handleGenerateRoadmap = async () => {
    if (!resume) return;

    setIsGeneratingRoadmap(true);
    setRoadmapError("");

    try {
      const generatedRoadmap = await requestCareerRoadmap({
        parsedResumeData: resume.parsedResumeData,
        targetRole: resume.jobTitle || "General Software Role",
      });
      setRoadmap(generatedRoadmap);
    } catch (error: any) {
      setRoadmapError(error?.message || "Unable to generate roadmap right now.");
    } finally {
      setIsGeneratingRoadmap(false);
    }
  };

  return (
    <main className="!pt-0">
      <nav className="resume-nav">
        <Link to="/" className="back-button">
          <img src="/icons/back.svg" alt="logo" className="w-2.5 h-2.5" />
          <span className="text-gray-800 text-sm font-semibold">Back to Homepage</span>
        </Link>
      </nav>
      <div className="flex flex-row w-full max-lg:flex-col-reverse">
        <section className="feedback-section bg-[url('/images/bg-small.svg') bg-cover h-[100vh] sticky top-0 items-center justify-center">
          {resume && (
            <div className="animate-in fade-in duration-1000 gradient-border max-sm:m-0 h-[90%] max-wxl:h-fit w-fit">
              <a href={resume.resumeDataUrl} target="_blank" rel="noopener noreferrer">
                <img src={resume.imageDataUrl} className="w-full h-full object-contain rounded-2xl" title="resume" />
              </a>
            </div>
          )}
        </section>
        <section className="feedback-section">
          <h2 className="text-4xl !text-black font-bold">Resume Review</h2>
          {resume ? (
            <div className="flex flex-col gap-8 animate-in fade-in duration-1000">
              <Summary feedback={resume.feedback} />
              <ATS score={resume.feedback.ATS.score || 0} suggestions={resume.feedback.ATS.tips || []} />
              <Details feedback={resume.feedback} />

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 md:p-6">
                <p className="text-sm text-slate-600">
                  Target Role: <span className="font-semibold text-slate-900">{resume.jobTitle}</span>
                </p>
                <div className="mt-4">
                  <GenerateRoadmapButton
                    onClick={handleGenerateRoadmap}
                    isLoading={isGeneratingRoadmap}
                    disabled={!resume.parsedResumeData}
                  />
                </div>
                {roadmapError && <p className="mt-3 text-sm text-red-600">{roadmapError}</p>}
                {roadmap && <ImprovementRoadmapDashboard roadmap={roadmap} />}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
              Resume not found. Please upload and analyze again.
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

export default Resume;
