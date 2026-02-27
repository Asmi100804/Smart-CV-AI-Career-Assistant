interface Resume {
  id: string;
  companyName?: string;
  jobTitle: string;
  jobDescription: string;
  resumeDataUrl: string;
  imageDataUrl: string;
  feedback: Feedback;
  parsedResumeData: {
    skills: string[];
    experience: string[];
    education: string[];
    projects: string[];
    certifications: string[];
  };
  extractedText?: string;
  createdAt: string;
}

interface Feedback {
  overallScore: number;
  ATS: {
    score: number;
    tips: {
      type: "good" | "improve";
      tip: string;
    }[];
  };
  toneAndStyle: {
    score: number;
    tips: {
      type: "good" | "improve";
      tip: string;
      explanation: string;
    }[];
  };
  content: {
    score: number;
    tips: {
      type: "good" | "improve";
      tip: string;
      explanation: string;
    }[];
  };
  structure: {
    score: number;
    tips: {
      type: "good" | "improve";
      tip: string;
      explanation: string;
    }[];
  };
  skills: {
    score: number;
    tips: {
      type: "good" | "improve";
      tip: string;
      explanation: string;
    }[];
  };
  strengths: string[];
  weaknesses: string[];
  missingKeywords: string[];
  impactAnalysis: string[];
  readabilityClarityScore: number;
}
