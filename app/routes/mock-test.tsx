import type { Route } from "./+types/mock-test";
import { useState, type FormEvent } from 'react';
import Navbar from '~/components/Navbar';
import { requireUser } from "~/services/auth.server";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';

const normalizeOptions = (options: string[]) => {
  return options.map(opt =>
    opt
      .trim()
      .replace(/^[A-D][.)]\s*/i, '') // ✅ remove "A.)", "B.", etc.
      .replace(/\s+/g, ' ')
      .replace(/,+$/, '')
  );
};

// Render question with code support
const RenderQuestion = ({ text }: { text: string }) => {
  const codeRegex = /```(\w+)?\n([\s\S]*?)```/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = codeRegex.exec(text)) !== null) {
    const [fullMatch, lang, code] = match;

    // Push normal text before code
    if (match.index > lastIndex) {
      parts.push(
        <p key={lastIndex} className="text-lg text-gray-800 mb-4 font-medium whitespace-pre-line">
          {text.slice(lastIndex, match.index)}
        </p>
      );
    }

    // Push code block
    parts.push(
      <SyntaxHighlighter
        key={match.index}
        language={lang || 'javascript'}
        style={oneDark}
        customStyle={{
          borderRadius: '12px',
          padding: '16px',
          fontSize: '14px'
        }}
      >
        {code.trim()}
      </SyntaxHighlighter>
    );

    lastIndex = match.index + fullMatch.length;
  }

  // Remaining text
  if (lastIndex < text.length) {
    parts.push(
      <p key={lastIndex} className="text-lg text-gray-800 mb-4 font-medium whitespace-pre-line">
        {text.slice(lastIndex)}
      </p>
    );
  }

  return <div>{parts}</div>;
};

export const meta = () => [
  { title: 'SmartCV | AI Mock Test' },
  {
    name: 'description',
    content: 'Take AI-generated mock tests tailored to your target job profile with instant evaluation and feedback.',
  },
];

interface MCQQuestion {
  id: string;
  type: 'mcq';
  question: string;
  options: string[];
  difficulty: 'medium';
}

interface ShortAnswerQuestion {
  id: string;
  type: 'short_answer';
  question: string;
  difficulty: 'medium';
}

type Question = MCQQuestion | ShortAnswerQuestion;

interface TestData {
  testId: string;
  jobProfile: string;
  mcqCount: number;
  shortAnswerCount: number;
  questions: Question[];
  createdAt: string;
  expiresAt: string;
  status: string;
}

interface EvaluationDetail {
  questionId: string;
  questionType: string;
  userAnswer: string | null;
  correctAnswer: string;
  isCorrect: boolean;
}

interface SubmissionResult {
  submissionId: string;
  testId: string;
  score: number;
  totalQuestions: number;
  accuracyPercentage: number;
  mcqCorrect: number;
  mcqTotal: number;
  shortAnswerCorrect: number;
  shortAnswerTotal: number;
  evaluationDetails: EvaluationDetail[];
  submittedAt: string;
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireUser(request);
  return null;
}

const MockTest = () => {
  const [stage, setStage] = useState<'setup' | 'test' | 'results'>('setup');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [testData, setTestData] = useState<TestData | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);

  const handleGenerateTest = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const jobProfile = formData.get('job-profile') as string;
    const mcqCount = Number(formData.get('mcq-count'));
    const shortAnswerCount = Number(formData.get('short-answer-count'));

    if (!jobProfile) {
      setError('Please enter a job profile');
      return;
    }

    if (mcqCount + shortAnswerCount === 0) {
      setError('Please select at least one question type');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      const response = await fetch('/api/mock-test/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobProfile, mcqCount, shortAnswerCount }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate test');
      }

      const data = await response.json();
      setTestData(data);
      setStage('test');
      setUserAnswers({});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate test');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmitTest = async () => {
    if (!testData) return;

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/mock-test/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testId: testData.testId,
          userAnswers,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit test');
      }

      const result = await response.json();
      setSubmissionResult(result);
      setStage('results');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit test');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setUserAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleNewTest = () => {
    setStage('setup');
    setTestData(null);
    setUserAnswers({});
    setSubmissionResult(null);
    setError('');
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-blue-600';
    if (percentage >= 40) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <main className="bg-linear-to-br from-blue-50 via-purple-50 to-pink-50 min-h-screen">
      <Navbar />

      <section className="main-section">
        <div className="page-heading py-16">
          <h1>AI Mock Test</h1>
          <h2>
            Challenge yourself with AI-generated mock tests tailored to your target job profile
          </h2>
        </div>

        <div className="w-full max-w-4xl">
          {stage === 'setup' && (
            <div className="gradient-border animate-in fade-in duration-500">
              <div className="bg-white rounded-2xl p-8">
                <form onSubmit={handleGenerateTest} className="flex flex-col gap-6">
                  <div className="form-div">
                    <label htmlFor="job-profile">Job Profile *</label>
                    <input
                      type="text"
                      name="job-profile"
                      placeholder="e.g., Full Stack Developer"
                      id="job-profile"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="form-div">
                      <label htmlFor="mcq-count">MCQ Questions</label>
                      <input
                        type="number"
                        name="mcq-count"
                        placeholder="0-50"
                        id="mcq-count"
                        min="0"
                        max="50"
                        defaultValue="5"
                      />
                    </div>

                    <div className="form-div">
                      <label htmlFor="short-answer-count">Short Answer Questions</label>
                      <input
                        type="number"
                        name="short-answer-count"
                        placeholder="0-50"
                        id="short-answer-count"
                        min="0"
                        max="50"
                        defaultValue="5"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl">
                      {error}
                    </div>
                  )}

                  <button
                    className="primary-button"
                    type="submit"
                    disabled={isGenerating}
                  >
                    {isGenerating ? 'Generating Test...' : 'Generate Test'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {isGenerating && (
            <div className="flex flex-col items-center justify-center mt-10 animate-in fade-in">
              <img src="/images/resume-scan-2.gif" className="w-[200px]" alt="Generating..." />
              <p className="text-xl text-gray-600 mt-4">
                Generating your personalized mock test...
              </p>
            </div>
          )}

          {stage === 'test' && testData && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-semibold text-gray-800">
                      {testData.jobProfile}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {testData.mcqCount} MCQs + {testData.shortAnswerCount} Short Answers
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Difficulty</p>
                    <span className="inline-block px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                      MEDIUM
                    </span>
                  </div>
                </div>
              </div>

              {testData.questions.map((question, index) => (
                <div
                  key={question.id}
                  className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <RenderQuestion text={question.question} />

                      {question.type === 'mcq' && (
                        <div className="space-y-2">
                          {normalizeOptions(question.options).map((option, optIndex) => {
                            const optionLabel = String.fromCharCode(65 + optIndex);

                            return (
                              <label
                                key={optIndex}
                                className="flex items-start gap-2 cursor-pointer w-fit"
                              >
                                <input
                                  type="radio"
                                  name={question.id}
                                  value={optionLabel}
                                  onChange={(e) =>
                                    handleAnswerChange(question.id, e.target.value)
                                  }
                                  className="w-4! h-4! shrink-0 accent-blue-600 cursor-pointer"
                                  style={{
                                    width: '16px',
                                    height: '16px',
                                    minWidth: '16px',
                                    maxWidth: '16px'
                                  }}
                                />

                                <span className="text-gray-700 leading-relaxed">
                                  <span className="font-semibold mr-1">{optionLabel}.</span>
                                  {option}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      )}

                      {question.type === 'short_answer' && (
                        <input
                          type="text"
                          placeholder="Your answer (1-3 words)"
                          className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          onChange={(e) =>
                            handleAnswerChange(question.id, e.target.value)
                          }
                        />
                      )}

                      <div className="mt-3">
                        <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                          {question.type === 'mcq' ? 'Multiple Choice' : 'Short Answer'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl">
                  {error}
                </div>
              )}

              <div className="flex gap-4">
                <button
                  onClick={handleSubmitTest}
                  disabled={isSubmitting}
                  className="primary-button"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Test'}
                </button>
                <button
                  onClick={handleNewTest}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-full font-medium hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {stage === 'results' && submissionResult && testData && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                <div className="text-center mb-6">
                  <h3 className="text-3xl font-bold text-gray-800 mb-2">
                    Test Results
                  </h3>
                  <p className="text-gray-500">for {testData.jobProfile}</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-4 bg-blue-50 rounded-xl">
                    <p className="text-sm text-gray-600 mb-1">Score</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {submissionResult.score}/{submissionResult.totalQuestions}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-xl">
                    <p className="text-sm text-gray-600 mb-1">Accuracy</p>
                    <p className={`text-2xl font-bold ${getScoreColor(submissionResult.accuracyPercentage)}`}>
                      {submissionResult.accuracyPercentage.toFixed(1)}%
                    </p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-xl">
                    <p className="text-sm text-gray-600 mb-1">MCQs</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {submissionResult.mcqCorrect}/{submissionResult.mcqTotal}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-amber-50 rounded-xl">
                    <p className="text-sm text-gray-600 mb-1">Short Answers</p>
                    <p className="text-2xl font-bold text-amber-600">
                      {submissionResult.shortAnswerCorrect}/{submissionResult.shortAnswerTotal}
                    </p>
                  </div>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-4 mb-6">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-4 rounded-full transition-all"
                    style={{ width: `${submissionResult.accuracyPercentage}%` }}
                  />
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h4 className="text-xl font-semibold text-gray-800 mb-4">
                  Detailed Breakdown
                </h4>
                <div className="space-y-3">
                  {submissionResult.evaluationDetails.map((detail, index) => {
                    const question = testData.questions.find(
                      (q) => q.id === detail.questionId
                    );
                    return (
                      <div
                        key={detail.questionId}
                        className={`p-4 rounded-lg border ${detail.isCorrect
                          ? 'bg-green-50 border-green-200'
                          : 'bg-red-50 border-red-200'
                          }`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm font-semibold bg-white">
                            {index + 1}
                          </span>
                          <div className="flex-1">
                            <p className="text-gray-800 font-medium mb-2">
                              {question?.question}
                            </p>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <span className="text-gray-600">Your answer: </span>
                                <span className={detail.isCorrect ? 'text-green-700 font-semibold' : 'text-red-700 font-semibold'}>
                                  {detail.userAnswer || 'No answer'}
                                </span>
                              </div>
                              {!detail.isCorrect && (
                                <div>
                                  <span className="text-gray-600">Correct answer: </span>
                                  <span className="text-green-700 font-semibold">
                                    {detail.correctAnswer}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={handleNewTest}
                className="primary-button w-full"
              >
                Take Another Test
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
};

export default MockTest;
