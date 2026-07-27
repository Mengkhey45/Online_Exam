/**
 * Public surface of the runtime module (AGENTS §5). Import from here only.
 * The runtime is fully client-side (§8); mount it via a client wrapper with
 * ssr disabled.
 */
export { RuntimeView } from "./components/runtime-view";
export { useSitting } from "./queries";
