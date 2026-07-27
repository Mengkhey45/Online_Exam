import type { Answer, Block, Option } from "@/modules/exam";

/**
 * Every runtime answer renderer receives the block, the current answer (if
 * any), the options in PRESENTED order (rule 3.1 — identity by ID), and an
 * onChange that patches the answer. Renderers never see or emit a position.
 */
export type RuntimeAnswerProps = {
  block: Block;
  answer?: Answer;
  options: Option[];
  onChange: (patch: Partial<Answer>) => void;
};

export type RuntimeRenderer = React.FC<RuntimeAnswerProps>;
