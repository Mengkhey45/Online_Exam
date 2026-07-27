# AGENTS.md — Examroom Backend

Instructions for any AI assistant working in this repository. Read sections 1–5 always. Then read the section for **the area you are working in** (6, 7, or 8) — whichever that is, regardless of whose area it is.

When a request conflicts with this file, follow this file and say so.

---

## 1. What this is

The API and background worker for an online examination platform serving multiple universities. Node.js + TypeScript + Express, Supabase Postgres, Drizzle ORM.

Two processes from one codebase:

| Process | Entry | Purpose |
|---|---|---|
| **API server** | `src/index.ts` | HTTP API for the Next.js frontend |
| **Worker** | `src/worker.ts` | Long-running AI and PDF jobs, polled from a jobs table |

The worker exists because AI conversion of a large PDF takes minutes. It is **not** a microservice — same repo, same models, same types.

---

## 2. Stack

| Concern | Library |
|---|---|
| Runtime | Node.js 20+, TypeScript strict, ESM |
| HTTP | Express |
| ORM | Drizzle + `postgres` driver |
| Database | Supabase Postgres |
| Auth | Supabase Auth (Google OAuth), verified server-side |
| Validation | Zod — on every input and every AI output |
| AI | `@anthropic-ai/sdk` |
| PDF | `pdfjs-dist` |
| Email | Resend |
| Logging | pino |
| Errors | Sentry |
| Dev | tsx, nodemon |
| Tests | vitest |

**Banned:** Prisma (we use Drizzle), Redis/BullMQ (the jobs table is the queue), any ORM-bypassing raw SQL outside `src/db/`, `moment`, `axios`.

---

## 3. Non-negotiable rules

Breaking any of these creates a bug that is expensive or impossible to fix later. They apply to everyone.

### 3.1 Every table and every query is scoped to an organisation

`organization_id` exists on every table. No exceptions, including join tables.

Never rely on remembering to filter. Queries go through the scoped client in `src/db/scoped.ts`, which injects the org filter, and RLS policies enforce it again at the database level.

```ts
// CORRECT
const db = scopedDb(ctx.organizationId)
const exams = await db.select().from(exams)

// WRONG — bypasses tenant isolation
const exams = await rawDb.select().from(exams).where(eq(exams.groupId, id))
```

The service-role key bypasses RLS. Use it only in the worker, only for jobs that already carry a verified `organization_id`.

### 3.2 Never store answer position

Answers reference `question_id` and `option_id`. Never an index, never a letter.

```ts
// CORRECT
{ attemptId, questionId: 'q_8fa2', optionId: 'opt_4c19' }

// WRONG — corrupts grading for every shuffled exam
{ attemptId, questionIndex: 3, answer: 'C' }
```

There is a test in `src/modules/grading/__tests__/shuffle-invariance.test.ts` that asserts a shuffled attempt grades identically to an unshuffled one. It must never be skipped or weakened.

### 3.3 Snapshot, never reference

When a question moves from the bank into an exam, copy its full content into `exam_questions` and keep `source_question_id` for lineage. The exam reads only from the snapshot.

Editing a bank question must never alter an exam that already used it.

### 3.4 Published exams are immutable

Publishing writes a snapshot into `exam_versions`. Every attempt references a `version_id`. Editing a published exam creates a **new version**; attempts already in progress keep the version they started on.

Never mutate an `exam_version` row after creation.

### 3.5 AI never rewrites content

Conversion is literal. The model may fix OCR artifacts, spacing, and option labels, and convert maths to LaTeX. It may not reword, "fix" grammar, or change any number.

Every conversion runs `numeric-integrity.ts`, which extracts numbers from the source page and the converted output and flags mismatches. A flagged block cannot be auto-approved.

### 3.6 Nothing enters the system unreviewed

Imported roster rows land in a staging table. AI-converted blocks carry `reviewed = false`. Neither becomes live data without an explicit confirm endpoint call.

### 3.7 Validate every boundary

Every request body, query param, and AI response is parsed with Zod before use. No `as` casts to make types line up.

---

## 4. Folder structure

```
src/
├── index.ts                 API entry
├── app.ts                   Express wiring
├── worker.ts                worker entry
├── config/
│   └── env.ts               Zod-parsed environment, throws on startup
├── db/
│   ├── schema/              one file per table
│   ├── client.ts
│   └── scoped.ts            org-scoped query client
├── middleware/
│   ├── auth.ts
│   ├── error.ts
│   └── validate.ts
├── modules/
│   ├── auth/
│   ├── organization/
│   ├── roster/
│   ├── exam/
│   ├── attempt/
│   ├── grading/
│   ├── proctoring/
│   └── ai-import/
├── jobs/
│   ├── poller.ts
│   └── handlers/
├── schema/                  Zod contracts shared with the frontend
└── lib/
```

Every module has exactly four files:

```
modules/exam/
├── exam.routes.ts     thin — validate, call service, respond
├── exam.service.ts    all business logic
├── exam.schema.ts     Zod
└── index.ts           the only public surface
```

**Rules:** cross-module imports go through `index.ts` only. Route handlers stay under 20 lines. No business logic in routes, no HTTP concepts in services.

---

## 5. Ownership

Three people own three areas. Ownership means **default responsibility and review authority** — it is not a lock. Anyone may work anywhere in this repository.

What ownership actually means:

- The owner is who the work is assigned to by default
- The owner reviews changes to their area
- The owner is who to ask when something is unclear

**When you work outside your own area, that is fine.** Do three things:

1. Say so at the start — "this touches Kanha's area (roster import)"
2. Read that section before writing. Its rules encode decisions whose reasons are not visible in the code.
3. Tell the owner what changed, so review happens before merge rather than after a bug

| Area | Owner | Section |
|---|---|---|
| Data foundation, auth, roster, exam CRUD | **Kanha** | §6 |
| Exam engine, attempts, grading, telemetry | **Mengkhey** | §7 |
| Worker, AI conversion, PDF, jobs | **Choonvia** | §8 |

### High blast radius

These need a second pair of eyes from someone else regardless of who is writing the change — owner or not:

```
src/db/schema/          table definitions
supabase/migrations/    permanent once applied
supabase/policies/      RLS — a mistake here leaks data between institutions
src/schema/             the Zod block contract; every module validates against it
src/config/env.ts
```

---

## 6. Kanha — data foundation, auth, roster

**Role:** project lead and owner of the data layer everything else stands on.

### Owns

```
src/db/schema/**          all table definitions
src/db/client.ts
src/db/scoped.ts
supabase/migrations/**
supabase/policies/**      RLS
src/middleware/auth.ts
src/modules/auth/**
src/modules/organization/**
src/modules/roster/**
src/modules/exam/**       exam CRUD and draft content only
```

### Outside this area

`src/modules/attempt/`, `src/modules/grading/`, `src/modules/proctoring/` (Mengkhey §7) and `src/jobs/`, `src/modules/ai-import/` (Choonvia §8).

Working there is allowed — read their section first and flag the change for review.

### Endpoints

```
POST   /auth/google/callback
GET    /auth/me
POST   /auth/logout

GET    /organizations/:id
PATCH  /organizations/:id
GET    /organizations/:id/teachers

GET    /classes
POST   /classes
GET    /classes/:id/students

POST   /roster/imports              start an import, returns staging id
GET    /roster/imports/:id          staged rows with validation errors
PATCH  /roster/imports/:id/rows/:rowId
POST   /roster/imports/:id/confirm  staging → students

GET    /exam-groups
POST   /exam-groups
GET    /exams
POST   /exams
GET    /exams/:id
PATCH  /exams/:id                   draft content and config only
GET    /exams/:id/export            results CSV
```

### Rules specific to this area

- **RLS policies are written alongside every new table**, in the same migration. A table without a policy is an incomplete migration.
- CSV and XLSX parsing is direct — no AI. Only PDF rosters go to the worker.
- Roster import writes to `roster_staging`, never to `students`, until `/confirm`.
- Duplicate student IDs within an organisation are flagged for the teacher, never silently merged or overwritten.
- `PATCH /exams/:id` returns 409 if the exam status is `published`. Publishing belongs to Mengkhey's module.
- Auth verifies the Supabase JWT and attaches `{ userId, organizationId, role }` to the request. Every downstream module depends on this being correct.

### Done means

Migration applied, RLS policy written and tested with a second organisation's token, Zod schemas in `src/schema/`, endpoint returns validated data, error cases return proper status codes.

---

## 7. Mengkhey — exam engine, attempts, grading

**Role:** technical lead. Owns the correctness-critical core: how an exam becomes a sitting, and how a sitting becomes a grade.

### Owns

```
src/schema/**             the Zod block contract — the keystone
src/modules/attempt/**
src/modules/grading/**
src/modules/proctoring/**
src/modules/exam/versioning.service.ts
src/modules/exam/publish.service.ts
```

### Outside this area

`src/db/schema/`, `src/modules/auth/`, `src/modules/roster/` (Kanha §6) and `src/jobs/`, `src/modules/ai-import/` (Choonvia §8).

Working there is allowed — read their section first and flag the change for review. Migrations are the one case to agree on *before* writing, not after.

### Endpoints

```
POST   /exams/:id/publish           snapshot → exam_versions
GET    /exam-versions/:id

POST   /attempts                    create; generates presented order
GET    /attempts/:id                FULL exam payload, one request
PUT    /attempts/:id/answers        batch sync from the client queue
POST   /attempts/:id/submit
POST   /attempts/:id/events         proctoring telemetry, batched
POST   /attempts/:id/lock
POST   /attempts/:id/unlock

GET    /exams/:id/attempts          monitoring feed
GET    /exams/:id/grading           by-question or by-student
PUT    /answers/:id/score
POST   /exams/:id/release-results
```

### Rules specific to this area

- **`GET /attempts/:id` returns the entire exam in one response.** Students may be on unreliable connections. Never paginate it, never add a per-question endpoint.
- Attempt creation writes `presented_order` and `presented_options` **explicitly as arrays**, not as a random seed. A seed cannot be reproduced after the shuffle code changes, and disputes happen months later.
- Grading always reads in the exam version's **canonical** order and ignores `presented_order`.
- `PUT /answers` is idempotent and accepts out-of-order arrivals — the client is syncing an offline queue. Use `updatedAt` to resolve conflicts, last-write-wins per question.
- Auto-scoring is deterministic for MCQ, multi-select, and fill-in-the-blank. Short and long answers are never auto-scored; AI may suggest, a teacher always confirms.
- Proctoring events are **stored, scored, and returned as flags with evidence**. No endpoint adjusts a score or marks a student as cheating. Only a teacher calling an explicit incident endpoint records anything against a student.
- Blur events under 2000ms are discarded at ingest — they are notifications and IME switches, not behaviour.
- `release-results` returns 409 unless every question in every attempt has a score.

### Tests required in this area

```
shuffle-invariance.test.ts     shuffled attempt grades identically
partial-credit.test.ts         multi-select scoring
fill-blank-matching.test.ts    case, whitespace, numeric tolerance
version-isolation.test.ts      in-progress attempts unaffected by a republish
offline-sync.test.ts           out-of-order and duplicate answer batches
```

These are not optional. This module is where a silent bug becomes a wrong grade.

---

## 8. Choonvia — worker, AI conversion, PDF

**Role:** owns the background service end to end.

### Owns

```
src/worker.ts
src/jobs/**
src/modules/ai-import/**
src/lib/pdf/**
src/lib/ai/**
```

### Outside this area

`src/modules/attempt/`, `src/modules/grading/` (Mengkhey §7) and `src/modules/auth/`, `src/db/schema/` (Kanha §6).

Working there is allowed — read their section first and flag the change for review. `src/schema/` is the shared block contract: changes there affect all three areas, so agree before editing.

### Endpoints and jobs

```
POST   /uploads/exam-pdf            signed upload URL
POST   /imports                     enqueue a conversion job
GET    /imports/:id                 status + converted blocks
PATCH  /imports/:id/blocks/:blockId mark reviewed / edit
POST   /imports/:id/approve         → hands off to the exam module

jobs/handlers/
  convert-exam-pdf.ts
  import-question-bank.ts
  import-roster-pdf.ts
```

### Rules specific to this area

- **The jobs table is the queue.** Poll on an interval, claim rows with `FOR UPDATE SKIP LOCKED`, set status `pending → running → done | failed`, record attempts and the last error. No Redis.
- **Chunk by page.** A 40-page PDF is 40 units of work processed with bounded concurrency, never one call. Report progress as pages complete so the frontend can show a bar.
- Send **rendered page images** to the vision model, not extracted text. Layout carries meaning — numbering, indentation, option lettering, blanks.
- Model output is parsed with the Zod block schema from `src/schema/`. Invalid output is retried, never patched into a different shape. After three failures the page is marked for manual entry.
- Temperature 0. The prompt states: transcribe exactly, do not rephrase.
- **`numeric-integrity.ts` runs on every converted block.** Extract all numbers from source and output, compare the multisets, attach a warning to any block that differs. Warned blocks cannot be auto-marked reviewed.
- Every job is idempotent. It will be retried; running it twice must not create duplicate blocks.
- Jobs carry `organization_id` and pass it to every write. The worker uses the service-role key and therefore bypasses RLS — scoping is your responsibility here.
- Never log document content, student names, or API keys. Log job IDs and page numbers.

### Done means

Job handler is idempotent, has a timeout, records failures with a readable error, reports progress, and its output validates against the shared schema.

---

## 9. Shared conventions

**Errors** — throw typed errors from services; `middleware/error.ts` maps them to responses. Never send a raw stack trace. Shape:

```json
{ "error": { "code": "EXAM_ALREADY_PUBLISHED", "message": "...", "details": {} } }
```

**Validation** — `validate(schema)` middleware on every route with a body or params.

**Logging** — pino, structured. Always include `organizationId` and a request id. Never log tokens, keys, answers, or student names.

**Naming** — tables and columns `snake_case`, TypeScript `camelCase`, endpoints plural and lowercase.

**Migrations** — never edit an applied migration. Add a new one.

**Env** — every new variable goes into `config/env.ts` and `.env.example` in the same commit.

---

## 10. Do not

- Do not query without organisation scoping — §3.1
- Do not store answer positions or option letters — §3.2
- Do not reference bank questions live from an exam — §3.3
- Do not mutate a published `exam_version` — §3.4
- Do not let AI reword or renumber exam content — §3.5
- Do not write to `students` or live blocks without a confirm step — §3.6
- Do not edit outside your own area *silently* — working there is fine, doing it unannounced is not — §5
- Do not use the service-role key in the API server
- Do not add Redis, a message broker, or a second database
- Do not use `any`, `as`, `@ts-ignore`, or `!` to silence type errors
- Do not weaken or skip the tests listed in §7

---

## 11. Working outside your own area

Expected and fine. Three people on a nine-week schedule cannot block on each other, and any of you may be asked to pick up another area's tasks. What matters is that it is visible, not that it is forbidden.

Every time a task takes you into someone else's area:

1. Name the area and its owner up front
2. Read that section before writing — it holds decisions that look arbitrary until you know why
3. Tell the owner what changed

### Agree first, not after

Four cases where a quiet change costs more than the conversation saves:

| Situation | Talk to | Why |
|---|---|---|
| New column, table, or migration | Kanha | Applied migrations are permanent; a second one to undo the first is worse than a five-minute conversation |
| Change to `src/schema/` block contract | Mengkhey | Every module and the frontend validate against it |
| Anything changing how a flag reaches a teacher | Mengkhey | The wording is a product decision, not a technical one |
| Worker writing exam content directly | Choonvia + Mengkhey | Must route through `/imports/:id/approve` — the review gate exists for a reason |

Everything else: go ahead, then tell them.

### If you are an AI assistant

State the boundary crossing in your response. Do not ask for permission and wait — the person directing you already decided to work here. Just make it visible:

> This touches Kanha's area (`src/modules/roster/`). Following §6 rules. Worth having her review the staging-table changes.