import { generateGroqJsonContent } from "~/services/groq.server";

export interface CareerRoadmapResponse {
  skill_gap_analysis: {
    matched_skills: string[];
    missing_skills: string[];
  };
  learning_roadmap: Array<{
    skill: string;
    why_needed: string;
    resources: string[];
    practice_projects: string[];
    severity: "high" | "medium" | "low";
  }>;
  recommended_projects: string[];
  certifications: string[];
  timeline_plan: {
    "30_days": string[];
    "60_days": string[];
    "90_days": string[];
  };
  overall_readiness_score: string;
}

export interface ResumeAnalysisResponse {
  overallScore: number;
  ATS: {
    score: number;
    tips: { type: "good" | "improve"; tip: string }[];
  };
  toneAndStyle: {
    score: number;
    tips: { type: "good" | "improve"; tip: string; explanation: string }[];
  };
  content: {
    score: number;
    tips: { type: "good" | "improve"; tip: string; explanation: string }[];
  };
  structure: {
    score: number;
    tips: { type: "good" | "improve"; tip: string; explanation: string }[];
  };
  skills: {
    score: number;
    tips: { type: "good" | "improve"; tip: string; explanation: string }[];
  };
  strengths: string[];
  weaknesses: string[];
  missingKeywords: string[];
  impactAnalysis: string[];
  readabilityClarityScore: number;
  parsedResumeData: {
    skills: string[];
    experience: string[];
    education: string[];
    projects: string[];
    certifications: string[];
  };
}

const toStringList = (input: unknown): string[] =>
  Array.isArray(input) ? input.map((item) => String(item).trim()).filter(Boolean) : [];

const clampScore = (value: unknown) => {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) return 0;
  return Math.min(100, Math.max(0, Math.round(numeric)));
};

const safeJsonParse = (rawText: string) => {
  try {
    return JSON.parse(rawText);
  } catch {
    const match = rawText.match(/\{[\s\S]*\}/);
    if (!match) return null;

    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
};

const normalizeCategory = (input: any) => ({
  score: clampScore(input?.score),
  tips: Array.isArray(input?.tips)
    ? input.tips.map((tip: any) => ({
        type: tip?.type === "good" ? "good" : "improve",
        tip: String(tip?.tip ?? "").trim(),
        explanation: String(tip?.explanation ?? "").trim(),
      }))
    : [],
});

const normalizeAnalysis = (input: any): ResumeAnalysisResponse => ({
  overallScore: clampScore(input?.overallScore),
  ATS: {
    score: clampScore(input?.ATS?.score),
    tips: Array.isArray(input?.ATS?.tips)
      ? input.ATS.tips.map((tip: any) => ({
          type: tip?.type === "good" ? "good" : "improve",
          tip: String(tip?.tip ?? "").trim(),
        }))
      : [],
  },
  toneAndStyle: normalizeCategory(input?.toneAndStyle),
  content: normalizeCategory(input?.content),
  structure: normalizeCategory(input?.structure),
  skills: normalizeCategory(input?.skills),
  strengths: toStringList(input?.strengths),
  weaknesses: toStringList(input?.weaknesses),
  missingKeywords: toStringList(input?.missingKeywords),
  impactAnalysis: toStringList(input?.impactAnalysis),
  readabilityClarityScore: clampScore(input?.readabilityClarityScore),
  parsedResumeData: {
    skills: toStringList(input?.parsedResumeData?.skills),
    experience: toStringList(input?.parsedResumeData?.experience),
    education: toStringList(input?.parsedResumeData?.education),
    projects: toStringList(input?.parsedResumeData?.projects),
    certifications: toStringList(input?.parsedResumeData?.certifications),
  },
});

const normalizeRoadmapResponse = (data: any): CareerRoadmapResponse => ({
  skill_gap_analysis: {
    matched_skills: toStringList(data?.skill_gap_analysis?.matched_skills),
    missing_skills: toStringList(data?.skill_gap_analysis?.missing_skills),
  },
  learning_roadmap: Array.isArray(data?.learning_roadmap)
    ? data.learning_roadmap.map((item: any) => ({
        skill: String(item?.skill ?? "").trim(),
        why_needed: String(item?.why_needed ?? "").trim(),
        resources: toStringList(item?.resources),
        practice_projects: toStringList(item?.practice_projects),
        severity: item?.severity === "high" || item?.severity === "low" ? item.severity : "medium",
      }))
    : [],
  recommended_projects: toStringList(data?.recommended_projects),
  certifications: toStringList(data?.certifications),
  timeline_plan: {
    "30_days": toStringList(data?.timeline_plan?.["30_days"]),
    "60_days": toStringList(data?.timeline_plan?.["60_days"]),
    "90_days": toStringList(data?.timeline_plan?.["90_days"]),
  },
  overall_readiness_score: String(data?.overall_readiness_score ?? "0%").trim(),
});

export async function generateResumeAnalysis(resumeText: string, jobTitle: string, jobDescription: string) {
  const prompt = `You are an expert ATS recruiter and resume coach. Analyze the resume for the given role.
Return STRICT JSON and no markdown.

Job Title: ${jobTitle}
Job Description: ${jobDescription}
Resume Text:\n${resumeText}

Return this shape exactly:
{
  "overallScore": 0,
  "ATS": {"score": 0, "tips": [{"type": "good|improve", "tip": ""}]},
  "toneAndStyle": {"score": 0, "tips": [{"type": "good|improve", "tip": "", "explanation": ""}]},
  "content": {"score": 0, "tips": [{"type": "good|improve", "tip": "", "explanation": ""}]},
  "structure": {"score": 0, "tips": [{"type": "good|improve", "tip": "", "explanation": ""}]},
  "skills": {"score": 0, "tips": [{"type": "good|improve", "tip": "", "explanation": ""}]},
  "strengths": [""],
  "weaknesses": [""],
  "missingKeywords": [""],
  "impactAnalysis": [""],
  "readabilityClarityScore": 0,
  "parsedResumeData": {
    "skills": [""],
    "experience": [""],
    "education": [""],
    "projects": [""],
    "certifications": [""]
  }
}

Rules:
- Scores must be integers in [0,100].
- Include 4-8 missingKeywords.
- impactAnalysis should focus on measurable achievements and quantified impact.
- Keep tips concise and actionable.
`;

  const rawText = await generateGroqJsonContent({ prompt });
  const parsed = safeJsonParse(rawText);

  if (!parsed) {
    throw new Error("Groq returned non-JSON content for resume analysis.");
  }

  return normalizeAnalysis(parsed);
}

export async function generateCareerRoadmap(parsedResumeData: unknown, targetRole: string) {
  const prompt = `You are an expert AI career mentor.
Create a detailed improvement roadmap for ${targetRole}.

Parsed resume data:\n${JSON.stringify(parsedResumeData, null, 2)}

Return STRICT JSON only in this shape:
{
  "skill_gap_analysis": {"matched_skills": [""], "missing_skills": [""]},
  "learning_roadmap": [{"skill": "", "why_needed": "", "resources": [""], "practice_projects": [""], "severity": "high|medium|low"}],
  "recommended_projects": [""],
  "certifications": [""],
  "timeline_plan": {"30_days": [""], "60_days": [""], "90_days": [""]},
  "overall_readiness_score": "0%"
}

Rules:
- The timeline must be a personalized 30-60-90 day plan.
- Mention learning resources and project ideas for each major skill gap.
- Include certifications aligned with ${targetRole}.
`;

  const rawText = await generateGroqJsonContent({ prompt });
  const parsed = safeJsonParse(rawText);

  if (!parsed) {
    throw new Error("Groq returned non-JSON content.");
  }

  return normalizeRoadmapResponse(parsed);
}
