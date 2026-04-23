import { requireUser } from "~/services/auth.server";
import { createGroqClient, DEFAULT_GROQ_MODEL } from "~/services/groq.server";

export async function loader() {
  return Response.json(
    { message: "This endpoint handles POST requests only." },
    { status: 405 }
  );
}

export async function action({ request }: any) {
  await requireUser(request);

  const { jobTitle, experienceLevel, jobDescription } = await request.json();

  if (!jobTitle || !experienceLevel) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const prompt = `
    Generate 10 interview questions for a ${experienceLevel} ${jobTitle} position.
    ${jobDescription ? `Job Description: ${jobDescription}` : ""}

    Return the questions strictly as a JSON array with this structure:
    [
      {
        "question": "the interview question",
        "answer": "A concise professional sample answer",
        "category": "Technical/Behavioral/Situational",
        "difficulty": "Easy/Medium/Hard"
      }
    ]

    IMPORTANT RULES:
    • Respond with ONLY the JSON array.
    • No markdown, no code fences.
  `;

  try {
    const client = createGroqClient();
    const response = await client.chat.completions.create({
      model: DEFAULT_GROQ_MODEL,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.choices[0]?.message?.content?.trim() ?? "";

    if (!text) {
      throw new Error("Empty AI response");
    }

    let parsedQuestions;

    try {
      parsedQuestions = JSON.parse(text);
    } catch {
      const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
      parsedQuestions = JSON.parse(cleaned);
    }

    if (!Array.isArray(parsedQuestions)) {
      throw new Error("AI response is not an array");
    }

    return Response.json(parsedQuestions);
  } catch (err: any) {
    console.error("Groq API Error:", err);

    return Response.json(
      { error: err.message || "Failed to generate questions" },
      { status: 500 }
    );
  }
}
