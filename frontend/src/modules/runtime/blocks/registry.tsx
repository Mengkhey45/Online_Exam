import type { BlockType } from "@/modules/exam";
import type { RuntimeRenderer } from "./types";
import { McqRuntime, MultiSelectRuntime } from "./mcq";
import { FillBlankRuntime } from "./fill-blank";
import {
  CodeRuntime,
  FileUploadRuntime,
  LongAnswerRuntime,
  ShortAnswerRuntime,
} from "./written";

/**
 * Runtime answer renderers by block type (AGENTS §5.4). `content`/`section` are
 * not answerable and are handled by the question pane directly.
 */
export const runtimeRegistry: Partial<Record<BlockType, RuntimeRenderer>> = {
  mcq: McqRuntime,
  multi_select: MultiSelectRuntime,
  fill_blank: FillBlankRuntime,
  short_answer: ShortAnswerRuntime,
  long_answer: LongAnswerRuntime,
  code: CodeRuntime,
  file_upload: FileUploadRuntime,
};

export function getRuntimeRenderer(type: BlockType): RuntimeRenderer | undefined {
  return runtimeRegistry[type];
}
