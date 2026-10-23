import { z } from "zod";
import type { StudentGroup } from "@/server/stats";

// Shared by the AI output, the editor and the print views. No length constraints so the
// same schema also works as a Groq strict json_schema; size is bounded separately.
const worksheetSchema = z.object({
  instructions: z.string(),
  exercises: z.array(z.object({ prompt: z.string(), answer: z.string() })),
});

export const remedialSchema = z.object({
  pupilExplanation: z.string(),
  teachingSteps: z.array(z.object({ time: z.string(), activity: z.string() })),
  guidingQuestions: z.array(z.string()),
  workedExample: z.object({
    problem: z.string(),
    steps: z.array(z.string()),
    answer: z.string(),
  }),
  worksheets: z.object({
    SUPPORT: worksheetSchema,
    CONSOLIDATE: worksheetSchema,
    EXTEND: worksheetSchema,
  }),
  materialsNeeded: z.string(),
  teacherTips: z.array(z.string()),
});

export type RemedialContent = z.infer<typeof remedialSchema>;
export type Worksheet = RemedialContent["worksheets"][StudentGroup];

export const MAX_REMEDIAL_JSON_CHARS = 20_000;

function blankWorksheet(): Worksheet {
  return { instructions: "", exercises: [{ prompt: "", answer: "" }] };
}

export function blankRemedial(): RemedialContent {
  return {
    pupilExplanation: "",
    teachingSteps: [{ time: "Phút 1–2", activity: "" }],
    guidingQuestions: [""],
    workedExample: { problem: "", steps: [""], answer: "" },
    worksheets: { SUPPORT: blankWorksheet(), CONSOLIDATE: blankWorksheet(), EXTEND: blankWorksheet() },
    materialsNeeded: "",
    teacherTips: [],
  };
}
