import type { ExamQuestionRow } from "@/db/schema/exam-questions";
import type { ExamSectionRow } from "@/db/schema/exam-sections";
import type { ExamRow } from "@/db/schema/exams";
import type { Block, Exam, Section } from "@/schema";

/**
 * Assemble the block-contract Exam (AGENTS §7 keystone) from draft rows. The
 * published path reads the immutable snapshot from exam_versions instead (§3.4).
 */
export function rowToBlock(q: ExamQuestionRow): Block {
  const block: Block = {
    id: q.id,
    sourceQuestionId: q.sourceQuestionId ?? undefined,
    type: q.type,
    stem: q.stem,
    marks: q.marks,
    required: q.required,
  };
  if (q.pinned !== null) block.pinned = q.pinned;
  if (q.options) block.options = q.options;
  if (q.blanks) block.blanks = q.blanks;
  if (q.language !== null) block.language = q.language;
  if (q.charLimit !== null) block.charLimit = q.charLimit;
  if (q.shuffleOptions !== null) block.shuffleOptions = q.shuffleOptions;
  if (q.reviewed !== null) block.reviewed = q.reviewed;
  if (q.confidence !== null) block.confidence = q.confidence;
  return block;
}

export function assembleExam(
  exam: ExamRow,
  sectionRows: ExamSectionRow[],
  questionRows: ExamQuestionRow[],
): Exam {
  const bySection = new Map<string, ExamQuestionRow[]>();
  for (const q of questionRows) {
    const list = bySection.get(q.sectionId) ?? [];
    list.push(q);
    bySection.set(q.sectionId, list);
  }

  const sections: Section[] = [...sectionRows]
    .sort((a, b) => a.position - b.position)
    .map((s) => {
      const blocks = (bySection.get(s.id) ?? [])
        .sort((a, b) => a.position - b.position)
        .map(rowToBlock);
      const section: Section = {
        id: s.id,
        title: s.title,
        instructions: s.instructions,
        mode: s.mode,
        shuffleQuestions: s.shuffleQuestions,
        blocks,
      };
      if (s.pdfPageUrls) section.pdfPageUrls = s.pdfPageUrls;
      return section;
    });

  const result: Exam = {
    id: exam.id,
    versionId: exam.currentVersionId ?? "draft",
    title: exam.title,
    status: exam.status,
    access: exam.access,
    security: exam.security,
    durationMinutes: exam.durationMinutes,
    totalMarks: exam.totalMarks,
    sections,
  };
  if (exam.scheduledStart) {
    result.scheduledStart = exam.scheduledStart.toISOString();
  }
  return result;
}

/** Total marks across scored blocks (content/section contribute nothing). */
export function computeTotalMarks(sections: Section[]): number {
  let total = 0;
  for (const s of sections) {
    for (const b of s.blocks) {
      if (b.type !== "content" && b.type !== "section") total += b.marks;
    }
  }
  return total;
}
