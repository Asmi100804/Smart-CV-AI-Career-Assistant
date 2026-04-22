# SmartCV AI Career Assistant

SmartCV is a React Router + TypeScript app that helps users improve resumes, prepare for interviews, and discover jobs with AI-assisted workflows.

## What it does
- **ATS Resume Review**: Upload a resume PDF and get structured feedback.
- **Interview Prep**: Generate role-specific interview questions.
- **Job Search**: Search jobs by title/location and open application links.
- **Career Roadmap**: Generate skill and learning plans.

## Tech stack
- React Router v7
- TypeScript
- Tailwind CSS v4
- Gemini API (question generation)
- JSearch API (jobs)

## Quick start
1. Install dependencies:
   ```bash
   npm install
   ```
2. Create `.env`:
All environment variables needed are listed in .env.example file

4. Run in development:
   ```bash
   npm run dev
   ```

## Scripts
- `npm run dev` – start local dev server
- `npm run build` – production build
- `npm run start` – run built server
- `npm run typecheck` – generate route types and run TypeScript checks



## Deploying to Vercel
1. Keep `react-router.config.ts` configured with `presets: [vercelPreset()]`.
2. Ensure required environment variables from `.env.example` are set in Vercel Project Settings.
3. This repo includes `vercel.json` to force the React Router framework preset and build commands.

If you see a Vercel `404: NOT_FOUND` page after deployment, verify the deployment is in **Ready** state and that the project is using the correct root directory and framework preset.
