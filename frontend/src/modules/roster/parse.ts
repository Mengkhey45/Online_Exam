import * as XLSX from "xlsx";
import { rawRosterSchema, type RawRoster } from "./schema";

/** File types the direct (no-AI) parser accepts. */
export const STRUCTURED_EXTENSIONS = [".csv", ".tsv", ".xlsx", ".xls"] as const;

/**
 * Parse an uploaded roster file into a column grid, in the browser (AGENTS §6:
 * the client sends already-mapped rows; the backend has no parse endpoint).
 * Handles CSV/TSV (text) and Excel (.xlsx/.xls via SheetJS). Anything else
 * (PDF, images, scans) is not a structured table — that path needs AI.
 */
export async function parseRosterFile(file: File): Promise<RawRoster> {
  const name = file.name.toLowerCase();
  const isExcel = name.endsWith(".xlsx") || name.endsWith(".xls");

  let grid: string[][];
  if (isExcel) {
    grid = await parseExcel(file);
  } else {
    const text = await file.text();
    const delimiter = name.endsWith(".tsv")
      ? "\t"
      : detectDelimiter(text.slice(0, 4096));
    grid = parseDelimited(text, delimiter);
  }

  const nonEmpty = grid.filter((r) => r.some((c) => c.trim() !== ""));
  if (nonEmpty.length < 2) {
    throw new Error(
      "That file has no data rows — it needs a header row and at least one student.",
    );
  }

  const [header, ...rows] = nonEmpty;
  return rawRosterSchema.parse({
    filename: file.name,
    columns: header.map((c) => c.trim()),
    rows,
  });
}

function detectDelimiter(sample: string): string {
  return sample.includes("\t") && !sample.includes(",") ? "\t" : ",";
}

/** Read the first worksheet of an Excel file into a string grid. */
async function parseExcel(file: File): Promise<string[][]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const first = workbook.SheetNames[0];
  if (!first) throw new Error("That spreadsheet has no sheets.");
  const sheet = workbook.Sheets[first];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    blankrows: false,
    defval: "",
  });
  return rows.map((r) => r.map((cell) => String(cell ?? "")));
}

/**
 * A small RFC 4180-style parser: handles quoted fields, escaped quotes (""),
 * and both \n and \r\n line endings. Kept tiny — no dependency (§2).
 */
function parseDelimited(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      rows.push(row);
      field = "";
      row = [];
    } else if (ch !== "\r") {
      field += ch;
    }
  }
  // Flush the trailing field/row if the file doesn't end in a newline.
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}
