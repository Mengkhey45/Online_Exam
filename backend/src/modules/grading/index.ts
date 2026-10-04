/** Public surface of the grading module (Mengkhey §7). Import from here only. */
export { gradingRouter } from "./grading.routes";
export { getResults } from "./grading.service";
export {
  autoScore,
  autoScoreExam,
  isAutoScored,
  scoreFillBlank,
  scoreMcq,
  scoreMultiSelect,
} from "./scoring";
