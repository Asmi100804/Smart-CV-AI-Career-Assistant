export interface CareerRoadmap {
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
