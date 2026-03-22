import type { Route } from './+types/mock-test';
import { useMemo, useState } from 'react';

import Navbar from '~/components/Navbar';
import ResultPage from '~/components/mock-test/ResultPage';
import TestPage from '~/components/mock-test/TestPage';
import TestSetupPage from '~/components/mock-test/TestSetupPage';
import { evaluateMockTest, generateMockTest } from '~/lib/mock-test/api';
import { buildInitialAnswers } from '~/lib/mock-test/helpers';
import { requireUser } from '~/services/auth.server';
import type { EvaluationResponse, TestResponse, TestSetupFormValues, UserAnswers } from '~/types/mock-test';

type Stage = 'setup' | 'test' | 'result';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'SmartCV | AI Mock Test' },
    { name: 'description', content: 'Generate and evaluate AI-powered mock tests for your target job role.' },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireUser(request);
  return null;
}

export default function MockTestRoute() {
  const [stage, setStage] = useState<Stage>('setup');
  const [setupValues, setSetupValues] = useState<TestSetupFormValues | null>(null);
  const [test, setTest] = useState<TestResponse | null>(null);
  const [userAnswers, setUserAnswers] = useState<UserAnswers | null>(null);
  const [result, setResult] = useState<EvaluationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    if (!userAnswers) {
      return false;
    }

    return userAnswers.mcq.every((answer) => answer.trim().length > 0);
  }, [userAnswers]);

  const handleGenerate = async (values: TestSetupFormValues) => {
    setLoading(true);
    setError(null);

    try {
      const generated = await generateMockTest(values);
      setSetupValues(values);
      setTest(generated);
      setUserAnswers(buildInitialAnswers(generated.mcqs.length, generated.shortQuestions.length));
      setStage('test');
    } catch {
      setError('Failed to generate test. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleMcqChange = (index: number, value: string) => {
    setUserAnswers((prev) => {
      if (!prev) {
        return prev;
      }

      const nextMcq = [...prev.mcq];
      nextMcq[index] = value;
      return { ...prev, mcq: nextMcq };
    });
  };

  const handleShortChange = (index: number, value: string) => {
    setUserAnswers((prev) => {
      if (!prev) {
        return prev;
      }

      const nextShort = [...prev.short];
      nextShort[index] = value;
      return { ...prev, short: nextShort };
    });
  };

  const handleSubmit = async () => {
    if (!test || !userAnswers || !setupValues || !canSubmit) {
      setError('Please answer all MCQs before submitting.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const evaluation = await evaluateMockTest({
        topic: `${setupValues.jobProfile} - ${setupValues.jobLevel}`,
        mcqs: test.mcqs,
        shortQuestions: test.shortQuestions,
        userAnswers,
      });

      setResult(evaluation);
      setStage('result');
    } catch {
      setError('Failed to evaluate test. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetState = () => {
    setStage('setup');
    setSetupValues(null);
    setTest(null);
    setUserAnswers(null);
    setResult(null);
    setError(null);
  };

  return (
    <main className="min-h-screen bg-slate-50 p-8 text-slate-900">
      <Navbar />
      {stage === 'setup' ? <TestSetupPage loading={loading} error={error} onGenerate={handleGenerate} /> : null}

      {stage === 'test' && test && userAnswers ? (
        <TestPage
          test={test}
          userAnswers={userAnswers}
          loading={loading}
          error={error}
          onMcqChange={handleMcqChange}
          onShortChange={handleShortChange}
          onSubmit={handleSubmit}
        />
      ) : null}

      {stage === 'result' && result ? <ResultPage result={result} onReset={resetState} /> : null}
    </main>
  );
}
