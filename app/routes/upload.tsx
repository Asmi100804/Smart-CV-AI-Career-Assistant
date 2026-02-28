import type { Route } from "./+types/upload";
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { convertPdfToImage } from '~/lib/pdf2img';
import FileUploader from '~/components/FileUploader';
import Navbar from '~/components/Navbar';
import { generateUUID } from '~/lib/utils';
import { saveResumeRecord } from '~/lib/resume-storage';
import { requireUser } from "~/services/auth.server";

export const meta = () => [
  { title: 'SmartCV | Resume Intelligence Suite' },
  {
    name: 'description',
    content:
      'AI-powered deep resume analysis with ATS scoring, tone & readability insights, strengths & weaknesses, skill gap detection, and a personalized improvement roadmap with learning and certification suggestions.',
  },
];

export async function loader({ request }: Route.LoaderArgs) {
  await requireUser(request);
  return null;
}

const fileToDataUrl = async (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsDataURL(file);
  });

const Upload = () => {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [error, setError] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const handleFileSelect = (selectedFile: File | null) => {
    setFile(selectedFile);
    setError('');
  };

  const handleAnalyze = async ({
    companyName,
    jobTitle,
    jobDescription,
    file,
  }: {
    companyName: string;
    jobTitle: string;
    jobDescription: string;
    file: File;
  }) => {
    setIsProcessing(true);
    setError('');

    try {
      setStatusText('Extracting resume preview...');
      const [pdfDataUrl, previewImage] = await Promise.all([
        fileToDataUrl(file),
        convertPdfToImage(file),
      ]);

      if (!previewImage.file) {
        throw new Error('Failed to generate PDF preview image.');
      }

      const imageDataUrl = await fileToDataUrl(previewImage.file);

      setStatusText('Analyzing resume with Gemini...');
      const body = new FormData();
      body.append('resume', file);
      body.append('jobTitle', jobTitle);
      body.append('jobDescription', jobDescription);

      const response = await fetch('/api/resume-analysis', {
        method: 'POST',
        body,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to analyze resume.');
      }

      const id = generateUUID();
      const record: Resume = {
        id,
        companyName,
        jobTitle,
        jobDescription,
        resumeDataUrl: pdfDataUrl,
        imageDataUrl,
        feedback: data.feedback,
        parsedResumeData: data.parsedResumeData,
        extractedText: data.extractedText,
        createdAt: new Date().toISOString(),
      };

      saveResumeRecord(record);
      setStatusText('Analysis complete. Redirecting...');
      navigate(`/resume/${id}`);
    } catch (analysisError: any) {
      setError(analysisError?.message || 'Something went wrong while analyzing your resume.');
      setIsProcessing(false);
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) {
      setError('Please upload a PDF resume first.');
      return;
    }

    const formData = new FormData(e.currentTarget);
    const companyName = String(formData.get('company-name') ?? '').trim();
    const jobTitle = String(formData.get('job-title') ?? '').trim();
    const jobDescription = String(formData.get('job-description') ?? '').trim();

    if (!jobTitle || !jobDescription) {
      setError('Job title and job description are required.');
      return;
    }

    void handleAnalyze({ companyName, jobTitle, jobDescription, file });
  };

  return (
    <main className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 min-h-screen">
      <Navbar />
      <section className="main-section">
        <div className='page-heading py-16'>
          <h1>Resume Intelligence Suite</h1>
          {isProcessing ? (
            <>
              <h2>{statusText}</h2>
              <img src="/images/resume-scan.gif" alt="Processing" className='w-full' />
            </>
          ) : (
            <h2>
              AI-powered deep resume analysis with ATS scoring, tone & readability insights, strengths & weaknesses, skill gap detection, and a personalized improvement roadmap with learning and certification suggestions.
            </h2>
          )}

          {!isProcessing && (
            <form id='upload-form' onSubmit={handleSubmit} className='flex flex-col gap-4 mt-8'>
              <div className='form-div'>
                <label htmlFor="company-name">Company Name</label>
                <input type="text" name='company-name' placeholder='Company Name' id='company-name' />
              </div>
              <div className='form-div'>
                <label htmlFor="job-title">Job Title *</label>
                <input type="text" name='job-title' placeholder='Job Title' id='job-title' required />
              </div>
              <div className='form-div'>
                <label htmlFor="job-description">Job Description *</label>
                <textarea rows={5} name='job-description' placeholder='Job Description' id='job-description' required />
              </div>
              <div className='form-div'>
                <label htmlFor="uploader">Upload Resume (PDF)</label>
                <FileUploader onFileSelect={handleFileSelect} />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button className='primary-button' type='submit'>
                Analyze Resume
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
};

export default Upload;
