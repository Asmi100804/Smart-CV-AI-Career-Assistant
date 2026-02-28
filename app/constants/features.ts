export interface FeatureDefinition {
  key: 'jobs' | 'resume-intelligence-suite' | 'interview-qa-generator';
  title: string;
  description: string;
  path: string;
}

export const FEATURE_DEFINITIONS: FeatureDefinition[] = [
  {
    key: 'jobs',
    title: 'Job Search',
    description: 'Discover job opportunities that match your skills and experience',
    path: '/jobs',
  },
  {
    key: 'resume-intelligence-suite',
    title: 'Resume Intelligence Suite',
    description:
      'AI-powered deep resume analysis with ATS scoring, tone & readability insights, strengths & weaknesses, skill gap detection, and a personalized improvement roadmap with learning and certification suggestions.',
    path: '/resume-intelligence-suite',
  },
  {
    key: 'interview-qa-generator',
    title: 'Interview Q&A Generator',
    description:
      'Generate tailored interview questions and expert-level answers based on your target job role and experience level.',
    path: '/interview-qa-generator',
  },
];

export const DASHBOARD_ROUTE = '/';
