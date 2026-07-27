/** Public surface of the attempt module (Mengkhey §7). Import from here only. */
export { attemptRouter, attemptSessionRouter } from "./attempt.routes";
export { createAttempt } from "./attempt.service";
export { buildPresentedLayout } from "./present";
export { mergeAnswers } from "./sync";
