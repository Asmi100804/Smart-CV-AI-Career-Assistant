import { requireUser } from "~/services/auth.server";
import { generateMockTest } from "~/services/mock-test.server";
import { mcp__supabase__execute_sql } from "~/lib/supabase-mcp.server";
export async function loader() {
  return Response.json(
    { message: "This endpoint handles POST requests only." },
    { status: 405 }
  );
}

export async function action({ request }: { request: Request }) {
  const userEmail = await requireUser(request);

  try {
    const body = await request.json();
    const { jobProfile, mcqCount, shortAnswerCount } = body;

    if (!jobProfile || typeof jobProfile !== "string" || jobProfile.trim().length === 0) {
      return Response.json(
        { error: "jobProfile is required and must be a non-empty string." },
        { status: 400 }
      );
    }

    const mcq = Number(mcqCount);
    const shortAnswer = Number(shortAnswerCount);

    if (!Number.isInteger(mcq) || mcq < 0 || mcq > 50) {
      return Response.json(
        { error: "mcqCount must be an integer between 0 and 50." },
        { status: 400 }
      );
    }

    if (!Number.isInteger(shortAnswer) || shortAnswer < 0 || shortAnswer > 50) {
      return Response.json(
        { error: "shortAnswerCount must be an integer between 0 and 50." },
        { status: 400 }
      );
    }

    if (mcq + shortAnswer === 0) {
      return Response.json(
        { error: "At least one question (MCQ or short answer) is required." },
        { status: 400 }
      );
    }

    if (mcq + shortAnswer > 50) {
      return Response.json(
        { error: "Total questions cannot exceed 50." },
        { status: 400 }
      );
    }

    const { questions, correctAnswers } = await generateMockTest(
      jobProfile.trim(),
      mcq,
      shortAnswer
    );

    const testId = crypto.randomUUID();
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

    const insertQuery = `
      INSERT INTO mock_tests (id, user_email, job_profile, mcq_count, short_answer_count, questions, correct_answers, status, created_at, expires_at)
      VALUES ('${testId}', '${userEmail.replace(/'/g, "''")}', '${jobProfile.trim().replace(/'/g, "''")}', ${mcq}, ${shortAnswer}, '${JSON.stringify(questions).replace(/'/g, "''")}'::jsonb, '${JSON.stringify(correctAnswers).replace(/'/g, "''")}'::jsonb, 'generated', '${now}', '${expiresAt}')
    `;

    await mcp__supabase__execute_sql(insertQuery);

    const savedTest = {
      id: testId,
      job_profile: jobProfile.trim(),
      mcq_count: mcq,
      short_answer_count: shortAnswer,
      questions,
      created_at: now,
      expires_at: expiresAt,
      status: 'generated'
    };

    return Response.json({
      testId: savedTest.id,
      jobProfile: savedTest.job_profile,
      mcqCount: savedTest.mcq_count,
      shortAnswerCount: savedTest.short_answer_count,
      questions: savedTest.questions,
      createdAt: savedTest.created_at,
      expiresAt: savedTest.expires_at,
      status: savedTest.status,
    });
  } catch (error: any) {
    console.error("Mock test generation error:", error);
    return Response.json(
      { error: error?.message || "Failed to generate mock test." },
      { status: 500 }
    );
  }
}
