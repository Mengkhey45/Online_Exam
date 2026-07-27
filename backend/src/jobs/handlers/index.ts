import type { JobType } from "@/db/schema/jobs";
import type { JobHandler } from "./types";
import { convertExamPdf } from "./convert-exam-pdf";
import { importQuestionBank } from "./import-question-bank";
import { importRosterPdf } from "./import-roster-pdf";

export const jobHandlers: Record<JobType, JobHandler> = {
  "convert-exam-pdf": convertExamPdf,
  "import-question-bank": importQuestionBank,
  "import-roster-pdf": importRosterPdf,
};
