import type { Route } from "./+types/wipe";
import { useState } from "react";
import { wipeStoredResumes } from "~/lib/resume-storage";
import { requireUser } from "~/services/auth.server";

export async function loader({ request }: Route.LoaderArgs) {
  await requireUser(request);
  return null;
}

const WipeApp = () => {
  const [done, setDone] = useState(false);

  const handleDelete = () => {
    wipeStoredResumes();
    setDone(true);
  };

  return (
    <div className="p-10">
      <button
        className="bg-blue-500 text-white px-4 py-2 rounded-md cursor-pointer"
        onClick={handleDelete}
      >
        Wipe Local Resume Data
      </button>
      {done && <p className="mt-4 text-green-700">Local resume data removed.</p>}
    </div>
  );
};

export default WipeApp;
