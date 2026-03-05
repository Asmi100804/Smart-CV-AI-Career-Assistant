import { redirect } from 'react-router';

export async function loader() {
  return redirect('/interview-qa-generator');
}

export default function LegacyInterviewRedirect() {
  return null;
}
