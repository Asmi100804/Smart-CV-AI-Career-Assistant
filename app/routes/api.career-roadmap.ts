import { generateCareerRoadmap } from "~/services/gemini.server";

export async function loader() {
  return Response.json(
    { message: "This endpoint handles POST requests only." },
    { status: 405 }
  );
}

export async function action({ request }: { request: Request }) {
  try {
    const { parsedResumeData, targetRole } = await request.json();

    if (!parsedResumeData || !targetRole) {
      return Response.json(
        { error: "parsedResumeData and targetRole are required." },
        { status: 400 }
      );
    }

    const roadmap = await generateCareerRoadmap(parsedResumeData, String(targetRole));
    return Response.json(roadmap);
  } catch (error: any) {
    console.error("Career roadmap API error:", error);
    return Response.json(
      { error: error?.message || "Failed to generate career roadmap." },
      { status: 500 }
    );
  }
}
