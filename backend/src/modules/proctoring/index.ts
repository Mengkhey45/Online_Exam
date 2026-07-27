/** Public surface of the proctoring module (Mengkhey §7). Import from here only. */
export { proctoringRouter } from "./proctoring.routes";
export { ingestEvents, getActivity, recordIncident } from "./proctoring.service";
export { ingestEventsSchema, type IngestEventsInput } from "./proctoring.schema";
