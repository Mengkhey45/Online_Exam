/**
 * Public surface of the exam module (AGENTS §4). CRUD is Kanha's (§6);
 * versioning/publish is Mengkhey's (§7). Import from here only.
 */
export { examRouter } from "./exam.routes";
export { getExam } from "./exam.service";
export { createVersion, getVersion } from "./versioning.service";
export { publishExam } from "./publish.service";
export { assembleExam } from "./exam.mapping";
