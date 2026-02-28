
import { extractTextFromPdf } from "~/services/pdf-parse.server";
import { generateResumeAnalysis } from "~/services/gemini.server";

export async function loader() {
  return Response.json({ message: "This endpoint handles POST requests only." }, { status: 405 });
}

export async function action({ request }: { request: Request }) {
  try {
    const formData = await request.formData();
    const file = formData.get("resume");
    const jobTitle = String(formData.get("jobTitle") ?? "").trim();
    const jobDescription = String(formData.get("jobDescription") ?? "").trim();

    if (!(file instanceof File)) {
      return Response.json({ error: "Resume PDF file is required." }, { status: 400 });
    }

    if (!jobTitle || !jobDescription) {
      return Response.json({ error: "jobTitle and jobDescription are required." }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return Response.json({ error: "Only PDF files are supported." }, { status: 400 });
    }

    const pdfBuffer = Buffer.from(await file.arrayBuffer());
    const resumeText = await extractTextFromPdf(pdfBuffer);

    if (!resumeText) {
      return Response.json({ error: "Unable to extract text from the uploaded PDF." }, { status: 400 });
    }

    const feedback = await generateResumeAnalysis(resumeText, jobTitle, jobDescription);

    return Response.json({
      feedback,
      parsedResumeData: feedback.parsedResumeData,
      extractedText: resumeText,
    });
  } catch (error: any) {
    console.error("Resume analysis API error:", error);
    return Response.json({ error: error?.message || "Failed to analyze resume." }, { status: 500 });
  }
}
