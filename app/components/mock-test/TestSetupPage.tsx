import { useState, type FormEvent } from 'react';

import type { TestSetupFormValues } from '~/types/mock-test';

interface TestSetupPageProps {
  loading: boolean;
  error: string | null;
  onGenerate: (form: TestSetupFormValues) => Promise<void>;
}

const initialValues: TestSetupFormValues = {
  jobProfile: '',
  jobLevel: '',
  numMCQ: 5,
  numShort: 3,
};

export default function TestSetupPage({ loading, error, onGenerate }: TestSetupPageProps) {
  const [formValues, setFormValues] = useState<TestSetupFormValues>(initialValues);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onGenerate(formValues);
  };

  return (
    <form className="mx-auto flex w-full max-w-2xl flex-col gap-4" onSubmit={handleSubmit}>
      <h1 className="text-2xl font-bold">AI Mock Test Setup</h1>

      <label className="flex flex-col gap-2">
        Job Profile
        <input
          className="rounded border p-2"
          value={formValues.jobProfile}
          onChange={(event) => setFormValues((prev) => ({ ...prev, jobProfile: event.target.value }))}
          required
        />
      </label>

      <label className="flex flex-col gap-2">
        Job Level
        <input
          className="rounded border p-2"
          value={formValues.jobLevel}
          onChange={(event) => setFormValues((prev) => ({ ...prev, jobLevel: event.target.value }))}
          required
        />
      </label>

      <label className="flex flex-col gap-2">
        Number of MCQs
        <input
          className="rounded border p-2"
          type="number"
          min={1}
          value={formValues.numMCQ}
          onChange={(event) =>
            setFormValues((prev) => ({ ...prev, numMCQ: Number.parseInt(event.target.value || '1', 10) }))
          }
          required
        />
      </label>

      <label className="flex flex-col gap-2">
        Number of Short Questions
        <input
          className="rounded border p-2"
          type="number"
          min={1}
          value={formValues.numShort}
          onChange={(event) =>
            setFormValues((prev) => ({ ...prev, numShort: Number.parseInt(event.target.value || '1', 10) }))
          }
          required
        />
      </label>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <button
        className="rounded bg-blue-600 px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
        type="submit"
        disabled={loading}
      >
        {loading ? 'Generating...' : 'Generate Test'}
      </button>
    </form>
  );
}
