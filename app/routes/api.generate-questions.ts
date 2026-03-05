import { requireUser } from "~/services/auth.server";
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function loader() {
  return Response.json(
    { message: "This endpoint handles POST requests only." },
    { status: 405 }
  );
}

export async function action({ request }: any) {
  await requireUser(request);
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  if (!GEMINI_API_KEY) {
    return Response.json(
      { error: 'API key not configured on server.' },
      { status: 500 }
    );
  }

  const { jobTitle, experienceLevel, jobDescription } = await request.json();

  if (!jobTitle || !experienceLevel) {
    return Response.json(
      { error: 'Missing required fields' },
      { status: 400 }
    );
  }

  // Using the improved prompt from the new code
  const prompt = `
    Generate 10 interview questions for a ${experienceLevel} ${jobTitle} position.
    ${jobDescription ? `Job Description: ${jobDescription}` : ''}

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
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const result = await model.generateContent(prompt);
    const response = result.response;

    // ⭐ FIX: get raw JSON safely
    const text =
      response.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    if (!text) {
      throw new Error("Empty AI response");
    }

    let parsedQuestions;

    try {
      parsedQuestions = JSON.parse(text);
    } catch {
      // ⭐ fallback cleaner (Gemini sometimes adds markdown)
      const cleaned = text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      parsedQuestions = JSON.parse(cleaned);
    }
    if (!Array.isArray(parsedQuestions)) {
      throw new Error("AI response is not an array");
    }

    return Response.json(parsedQuestions);

  } catch (err: any) {
    console.error("Gemini API Error:", err);

    return Response.json(
      { error: err.message || "Failed to generate questions" },
      { status: 500 }
    );
  }
}