import { redirect } from 'react-router';

export async function loader() {
  return redirect('/resume-intelligence-suite');
}

export default function LegacyUploadRedirect() {
  return null;
}
