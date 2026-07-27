import { customAlphabet } from "nanoid";

// URL-safe, unambiguous alphabet (no look-alikes) for readable IDs.
const alphabet = "0123456789abcdefghijklmnopqrstuvwxyz";
const nano = customAlphabet(alphabet, 12);

// Exam keys students type — short, upper-case, no ambiguous characters.
const keyAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const nanoKey = customAlphabet(keyAlphabet, 4);

export type IdPrefix =
  | "org"
  | "usr"
  | "cls"
  | "std"
  | "imp"
  | "grp"
  | "exm"
  | "sec"
  | "q"
  | "opt"
  | "blank"
  | "ver"
  | "att"
  | "ans"
  | "evt"
  | "inc"
  | "job";

export function newId(prefix: IdPrefix): string {
  return `${prefix}_${nano()}`;
}

/** A student-facing exam key like "ALGO-7F3K" style: two 4-char groups. */
export function newExamKey(): string {
  return `${nanoKey()}-${nanoKey()}`;
}
