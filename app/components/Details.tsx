import { cn } from "~/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionHeader,
  AccordionItem,
} from "./Accordion";

const ScoreBadge = ({ score }: { score: number }) => {
  return (
      <div
          className={cn(
              "flex flex-row gap-1 items-center px-2 py-0.5 rounded-[96px]",
              score > 69
                  ? "bg-badge-green"
                  : score > 39
                      ? "bg-badge-yellow"
                      : "bg-badge-red"
          )}
      >
        <img
            src={score > 69 ? "/icons/check.svg" : "/icons/warning.svg"}
            alt="score"
            className="size-4"
        />
        <p
            className={cn(
                "text-sm font-medium",
                score > 69
                    ? "text-badge-green-text"
                    : score > 39
                        ? "text-badge-yellow-text"
                        : "text-badge-red-text"
            )}
        >
          {score}/100
        </p>
      </div>
  );
};

const CategoryHeader = ({
                          title,
                          categoryScore,
                        }: {
  title: string;
  categoryScore: number;
}) => {
  return (
      <div className="flex flex-row gap-4 items-center py-2">
        <p className="text-2xl font-semibold">{title}</p>
        <ScoreBadge score={categoryScore} />
      </div>
  );
};

const CategoryContent = ({
                           tips,
                         }: {
  tips: { type: "good" | "improve"; tip: string; explanation: string }[];
}) => {
  return (
      <div className="flex flex-col gap-4 items-center w-full">
        <div className="bg-gray-50 w-full rounded-lg px-5 py-4 grid grid-cols-2 gap-4">
          {tips.map((tip, index) => (
              <div className="flex flex-row gap-2 items-center" key={index}>
                <img
                    src={
                      tip.type === "good" ? "/icons/check.svg" : "/icons/warning.svg"
                    }
                    alt="score"
                    className="size-5"
                />
                <p className="text-xl text-gray-500 ">{tip.tip}</p>
              </div>
          ))}
        </div>
        <div className="flex flex-col gap-4 w-full">
          {tips.map((tip, index) => (
              <div
                  key={index + tip.tip}
                  className={cn(
                      "flex flex-col gap-2 rounded-2xl p-4",
                      tip.type === "good"
                          ? "bg-green-50 border border-green-200 text-green-700"
                          : "bg-yellow-50 border border-yellow-200 text-yellow-700"
                  )}
              >
                <div className="flex flex-row gap-2 items-center">
                  <img
                      src={
                        tip.type === "good"
                            ? "/icons/check.svg"
                            : "/icons/warning.svg"
                      }
                      alt="score"
                      className="size-5"
                  />
                  <p className="text-xl font-semibold">{tip.tip}</p>
                </div>
                <p>{tip.explanation}</p>
              </div>
          ))}
        </div>
      </div>
  );
};

const Details = ({ feedback }: { feedback: Feedback }) => {
  return (
      <div className="flex flex-col gap-4 w-full">
        <Accordion>
          <AccordionItem id="tone-style">
            <AccordionHeader itemId="tone-style">
              <CategoryHeader
                  title="Tone & Style"
                  categoryScore={feedback.toneAndStyle.score}
              />
            </AccordionHeader>
            <AccordionContent itemId="tone-style">
              <CategoryContent tips={feedback.toneAndStyle.tips} />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem id="content">
            <AccordionHeader itemId="content">
              <CategoryHeader
                  title="Content"
                  categoryScore={feedback.content.score}
              />
            </AccordionHeader>
            <AccordionContent itemId="content">
              <CategoryContent tips={feedback.content.tips} />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem id="structure">
            <AccordionHeader itemId="structure">
              <CategoryHeader
                  title="Structure"
                  categoryScore={feedback.structure.score}
              />
            </AccordionHeader>
            <AccordionContent itemId="structure">
              <CategoryContent tips={feedback.structure.tips} />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem id="skills">
            <AccordionHeader itemId="skills">
              <CategoryHeader
                  title="Skills"
                  categoryScore={feedback.skills.score}
              />
            </AccordionHeader>
            <AccordionContent itemId="skills">
              <CategoryContent tips={feedback.skills.tips} />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-green-200 bg-green-50 p-4">
            <h3 className="font-semibold text-green-800">Strengths</h3>
            <ul className="mt-2 list-disc pl-5 text-sm text-green-900">
              {feedback.strengths.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <h3 className="font-semibold text-red-800">Weaknesses</h3>
            <ul className="mt-2 list-disc pl-5 text-sm text-red-900">
              {feedback.weaknesses.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <h3 className="font-semibold text-amber-800">Missing Keywords</h3>
          <p className="mt-1 text-xs text-amber-700">Add these role-relevant keywords to improve ATS match.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {feedback.missingKeywords.map((keyword) => (
              <span key={keyword} className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">{keyword}</span>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="font-semibold text-slate-900">Impact & Achievement Analysis</h3>
          <ul className="mt-2 list-disc pl-5 text-sm text-slate-700">
            {feedback.impactAnalysis.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-slate-600">Readability & Clarity Score: <span className="font-semibold text-slate-900">{feedback.readabilityClarityScore}/100</span></p>
        </div>
      </div>
  );
};

export default Details;