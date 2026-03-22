import type { EvaluationResponse } from '~/types/mock-test';

interface ResultPageProps {
  result: EvaluationResponse;
  onReset: () => void;
}

export default function ResultPage({ result, onReset }: ResultPageProps) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 rounded border p-6">
      <h1 className="text-2xl font-bold">Test Result</h1>
      <p className="text-lg">Total Score: <strong>{result.totalScore}</strong></p>
      <p>MCQ Score: {result.mcqScore}</p>
      <p>Short Answer Score: {result.shortScore}</p>
      <button className="self-start rounded bg-slate-900 px-4 py-2 text-white" type="button" onClick={onReset}>
        Take Another Test
      </button>
    </div>
  );
}
