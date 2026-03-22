import type { ChangeEvent } from 'react';

import type { TestResponse, UserAnswers } from '~/types/mock-test';

interface TestPageProps {
  test: TestResponse;
  userAnswers: UserAnswers;
  loading: boolean;
  error: string | null;
  onMcqChange: (index: number, value: string) => void;
  onShortChange: (index: number, value: string) => void;
  onSubmit: () => Promise<void>;
}

export default function TestPage({
  test,
  userAnswers,
  loading,
  error,
  onMcqChange,
  onShortChange,
  onSubmit,
}: TestPageProps) {
  const handleSubmit = async () => {
    await onSubmit();
  };

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <h1 className="text-2xl font-bold">Mock Test</h1>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">MCQs</h2>
        {test.mcqs.map((mcq, mcqIndex) => (
          <div key={mcq.question} className="rounded border p-4">
            <p className="font-medium">{mcqIndex + 1}. {mcq.question}</p>
            <div className="mt-3 space-y-2">
              {mcq.options.map((option) => (
                <label key={option} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={`mcq-${mcqIndex}`}
                    value={option}
                    checked={userAnswers.mcq[mcqIndex] === option}
                    onChange={(event: ChangeEvent<HTMLInputElement>) => onMcqChange(mcqIndex, event.target.value)}
                    disabled={loading}
                  />
                  {option}
                </label>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Short Answers</h2>
        {test.shortQuestions.map((question, shortIndex) => (
          <div key={question.question} className="rounded border p-4">
            <p className="font-medium">{shortIndex + 1}. {question.question}</p>
            <input
              className="mt-3 w-full rounded border p-2"
              value={userAnswers.short[shortIndex]}
              onChange={(event) => onShortChange(shortIndex, event.target.value)}
              disabled={loading}
              maxLength={60}
            />
          </div>
        ))}
      </section>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <button
        className="self-start rounded bg-green-600 px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
        type="button"
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? 'Evaluating...' : 'Submit Test'}
      </button>
    </div>
  );
}
