# AGENTS.md — Examroom Frontend

Instructions for any AI assistant working in this repository. Read this fully before writing code. When a request conflicts with this file, follow this file and say so.

---

## 1. What this is

An online examination platform for universities. Three roles:

- **Admin** — manages an institution: teachers, settings, oversight
- **Teacher** — creates exams, configures them, monitors sittings, grades
- **Student** — enters with a key or institution sign-in, sits the exam in the browser

This is a **dense professional tool** used for hours at a time, not a marketing site. Optimise for scanability, keyboard use, and information density.

Multi-tenant: it serves many institutions, not one.

---

## 2. Stack

Use these. Do not introduce alternatives without being asked.

| Concern | Library |
|---|---|
| Framework | Next.js (App Router) |
| Language | TypeScript, strict mode |
| Styling | Tailwind CSS |
| Components | shadcn/ui |
| Icons | lucide-react |
| Server state | TanStack Query |
| Validation | Zod |
| Forms | react-hook-form + zodResolver |
| Drag & drop | dnd-kit |
| Math rendering | KaTeX |
| Math input | MathLive |
| Code editor | CodeMirror 6 |
| PDF rendering | react-pdf / pdf.js |
| Offline storage | Dexie.js (IndexedDB) |
| Auth client | @supabase/supabase-js |
| Dates | date-fns |

**Banned:** react-beautiful-dnd (unmaintained), Monaco (too heavy — use CodeMirror), moment.js, axios (use fetch), any CSS-in-JS library, any UI kit other than shadcn.

The backend is a **separate Express server**. This app never touches a database. All data comes from the API via TanStack Query.

---

## 3. Non-negotiable rules

Violating any of these creates a bug that is expensive or impossible to fix later.

### 3.1 Never store or transmit answer position

Questions and options are shuffled per student. An answer is identified by ID, never by position.

```ts
// CORRECT
{ questionId: "q_8fa2", optionId: "opt_4c19" }

// WRONG — will corrupt grading
{ questionIndex: 3, optionIndex: 2 }
{ question: 3, answer: "C" }
```

Never render "the third option" as meaningful. Never sort answers by array index and assume it matches the teacher's order.

### 3.2 Autosave must survive network loss

The student runtime writes every answer change to IndexedDB **immediately and synchronously with the interaction**, then syncs to the server on an interval with retry and exponential backoff.

Required behaviour:
- A student who goes offline mid-exam keeps working with no interruption
- On reconnect, queued answers sync automatically
- On page reload, answers restore from IndexedDB if the local copy is newer
- The save indicator shows exactly three states: `Saved` · `Saving…` · `Offline — answers stored on this device`

Never block the UI on a network request during an exam. Never show a modal error that interrupts answering.

### 3.3 Load the whole exam in one request

When a student starts, fetch the complete exam payload once. Every subsequent question navigation is local. **No per-question fetches during an exam.** Students may be on unreliable connections.

### 3.4 Flags are for review, never accusation

In any proctoring or monitoring UI:
- Say "3 flags to review", "unusual activity", "worth a look"
- Never say "cheating detected", "violation", "suspicious student", "caught"
- Use ochre (`--flag`), never red, for flag states
- No score is ever adjusted by the UI; only a teacher clicking "Record incident" does anything

### 3.5 Student identities are anonymised

During an in-progress exam, teacher-facing screens show **student IDs only**, never names. There is no toggle. Grading screens follow the same rule until results are released.

### 3.6 Nothing publishes without human review

- AI-imported blocks carry a `reviewed` flag. Publish stays disabled until all are reviewed.
- Imported roster rows stay in a staging state until explicitly confirmed.
- Disabled actions always explain why in a tooltip.

---

## 4. Design system

Tokens live in `src/styles/tokens.css` and map to the Tailwind theme. Use token names, never raw hex.

### Colour

```
--paper        #FBFBF9   app background
--surface      #FFFFFF   cards, panels
--surface-sunk #F4F4F1   wells, inactive states
--rule         #E4E5E0   hairline borders
--rule-strong  #CFD1CB   input borders

--ink          #16191D   primary text
--ink-2        #4C5259   secondary text
--ink-3        #7A8189   tertiary / placeholder

--accent       #1F5F5B   teal-ink — primary actions, selection
--accent-soft  #E8F0EF   selected backgrounds
--accent-line  #A9C6C3   hover borders

--flag         #9A6414   attention, review, lockout  (NOT red)
--danger       #A33232   errors and destructive actions only
--ok           #35704A   success, correct answers
```

**Red is reserved for genuine errors and destructive actions.** Proctoring flags are ochre. This is deliberate — see rule 3.4.

### Typography — three roles, IBM Plex

| Face | Used for |
|---|---|
| **IBM Plex Sans** | All interface chrome: navigation, buttons, labels, tables, forms |
| **IBM Plex Serif** | Exam content only: question stems, options, passages, student answers |
| **IBM Plex Mono** | Codes and figures: exam keys, student IDs, marks, timers, question numbers, table numerics |

The serif/sans split is meaningful and must be preserved. The application is a tool; the exam is a document. They should never look like the same thing.

Always use `font-variant-numeric: tabular-nums` on numbers in tables and timers.

### Shape and space

4px spacing grid. Border radius: `3px` small, `5px` default, `8px` cards. Separate content with hairline rules before reaching for shadows. Shadows only for genuinely floating layers — drawers, modals, dropdowns.

### Signature element

The **answer sheet rail** in the student runtime: a grid of numbered cells that fill solid when answered, with a corner marker for flagged questions, echoing an OMR bubble sheet. Question numbers appear in bordered mono boxes in the builder, the runtime, and grading — so the same question reads as the same object everywhere.

Do not add decorative elements. No gradients, no hero sections, no illustrations, no emoji.

---

## 5. Folder structure

```
src/
├── app/                        routes only — thin
│   ├── (auth)/
│   ├── (teacher)/
│   ├── (admin)/
│   └── (student)/
├── modules/                    ← all logic lives here
│   ├── auth/
│   ├── exam/
│   ├── builder/
│   ├── runtime/
│   ├── proctoring/
│   ├── grading/
│   ├── roster/
│   ├── bank/
│   └── ai-import/
│       ├── components/
│       ├── hooks/
│       ├── queries.ts          TanStack Query definitions
│       ├── types.ts
│       └── index.ts            ← the ONLY public surface
├── components/ui/              shadcn — generated, do not hand-edit
├── lib/
│   ├── api/                    fetch client, error handling
│   ├── math/                   KaTeX + MathLive wrappers
│   └── utils/
└── styles/
```

**Rules:**
1. Cross-module imports go through `index.ts` only. Never `@/modules/exam/components/Foo`.
2. Route files contain no business logic. A page component should be under 30 lines.
3. One block type = one file, named after the type (`mcq.tsx`, `fill-blank.tsx`).
4. Adding a new question type should touch exactly three predictable files: schema, builder renderer, runtime renderer.

---

## 6. Data contracts

These types are the contract with the backend. Do not invent fields. If something is missing, ask.

```ts
type BlockType =
  | 'section' | 'content'
  | 'mcq' | 'multi_select' | 'fill_blank'
  | 'short_answer' | 'long_answer' | 'code' | 'file_upload'

type Option = {
  id: string
  text: string          // may contain LaTeX in $…$
  isCorrect: boolean
  keepLast?: boolean    // "All of the above" — exempt from shuffle
}

type Blank = {
  id: string
  acceptedAnswers: string[]
  caseSensitive: boolean
  numericTolerance?: number
  marks: number
}

type Block = {
  id: string
  type: BlockType
  stem: string                  // LaTeX in $…$; blanks as {{blankId}}
  marks: number
  required: boolean
  pinned?: boolean              // stays put when section shuffles
  options?: Option[]
  blanks?: Blank[]
  language?: string             // code blocks
  charLimit?: number
  shuffleOptions?: boolean
  reviewed?: boolean            // AI-imported blocks only
  confidence?: 'high' | 'medium' | 'low'
}

type Section = {
  id: string
  title: string
  instructions: string
  mode: 'blocks' | 'pdf_pages'
  shuffleQuestions: boolean
  blocks: Block[]
  pdfPageUrls?: string[]
}

type Exam = {
  id: string
  versionId: string
  title: string
  status: 'draft' | 'published' | 'archived'
  access: 'open' | 'closed' | 'discoverable' | 'scheduled'
  security: 'low' | 'medium' | 'high'
  durationMinutes: number
  totalMarks: number
  scheduledStart?: string       // ISO
  sections: Section[]
}

type Attempt = {
  id: string
  examVersionId: string
  presentedOrder: Record<string, string[]>        // sectionId -> questionIds
  presentedOptions: Record<string, string[]>      // questionId -> optionIds
  startedAt: string
  expiresAt: string
}

type Answer = {
  questionId: string
  optionIds?: string[]
  blankAnswers?: Record<string, string>
  text?: string
  fileUrl?: string
  flaggedForReview: boolean
  updatedAt: string
}

type ProctoringEvent = {
  id: string
  type: 'blur' | 'fullscreen_exit' | 'paste' | 'burst' | 'share_stop' | 'disconnect'
  at: string
  durationMs?: number
  charCount?: number
}
```

**Rendering order rule:** the student runtime renders using `attempt.presentedOrder`. Every teacher-facing screen — monitoring, grading, analytics, export — renders in the exam's **canonical** section/block order and ignores `presentedOrder` entirely.

---

## 7. Screens and requirements

> **Build progress** — ✅ built · ☐ not started. All §7 screens built (mock-backed). Known follow-ups: CodeMirror editor for code answers, react-pdf for pdf_pages + AI-review originals, real file upload. Provisional shapes (fields beyond §6) live in each module's schema/summary file, awaiting backend confirmation (§10).

### ✅ Teacher dashboard
Exam groups as collapsible cards, each containing a table of exams: title, created date, exam key with copy button, status badge, security badge, question count, entered/total students, row actions. Empty state per group. Skeletons while loading.

### ✅ Exam builder
Three columns: palette (248px) · sheet (flex) · settings panel (320px).

- Palette: draggable block types grouped as Structure / Objective / Written
- Sheet: sections containing block cards; drag to reorder within and between sections (dnd-kit); drop indicator during drag; selected block gets a ring
- Settings panel content switches by block type
- Top bar: editable title, live counters (questions · marks · sections), Preview / Configure / Save draft / Publish
- Render LaTeX in stems with KaTeX
- Publish disabled with tooltip while any AI-imported block is unreviewed
- Warn when an option contains "all of the above" / "none of the above" and shuffle is on

### ✅ Exam configuration
Four tabs: General · Student information · Workspace · Cheat prevention.

- General: duration, pass mark, access state (Scheduled reveals date + time pickers), read-only notice that identities are anonymised
- Student information: toggle list of fields to collect
- Workspace: answer methods; block disabling all of them with inline validation
- Cheat prevention: three selectable level cards, each revealing its own sub-settings

### ✅ Student entry
Three steps: exam key (or institution sign-in) → confirm details → summary and start. Centred, max 480px, no navigation. Warn that the timer starts and the screen enters full screen.

### ✅ Student runtime — the critical screen
- Top bar: title, countdown (amber under 10 min, red under 2), save indicator, submit
- Left rail: the answer sheet grid (answered / unanswered / flagged / current)
- Centre: one question at a time, max 720px, rendered by block type
- `pdf_pages` sections: split view, original page beside the writing area
- Flag for review, Previous, Next
- Submit dialog listing unanswered and flagged counts
- Lockout overlay for medium security: countdown, reason, explanation textarea
- Timer and save state visible at all times without scrolling

### ✅ Live monitoring
Summary strip as clickable filters. Unlock queue panel with explanations and one-click unlock. Student table with anonymised IDs, status, progress, time left, flag count. Activity drawer with a chronological timeline. Neutral language throughout.

### ✅ Grading
Two modes: by question (default) and by student. By question shows the question once, then every student's answer with marks input, quick-award buttons, and a comment field. Auto-scored questions are read-only with an override. Rubric panel. Sticky totals footer. "Release results" disabled until fully graded.

### ✅ Roster import
Upload → column mapping → editable preview table. Problem rows highlighted with an inline reason. Filter to problems only. Import disabled while unresolved errors remain.

### ✅ AI conversion review
Split: original PDF page left, converted blocks right. Confidence indicator and `reviewed` checkbox per block. Low-confidence blocks sorted first. Numeric-mismatch warnings shown prominently. Per-section option to discard conversion and keep the PDF.

---

## 8. Implementation rules

**State**
- Server data: TanStack Query. Never `useEffect` + `fetch`.
- Form state: react-hook-form.
- Exam runtime answers: local state + Dexie, synced by a dedicated queue — not TanStack Query mutations fired per keystroke.
- No global state library. If something needs sharing, use a module-scoped context.

**API**
- All calls go through `lib/api`. No bare `fetch` in components.
- Every response validated with the Zod schema before use.
- Errors surface as inline messages or toasts, never as thrown UI crashes.

**Rendering**
- Server Components for dashboards, lists, and static pages.
- The student runtime is fully client-side. Do not server-render it.
- Never fetch inside a loop.

**Quality floor** — build to this without being asked:
- Every interactive element is keyboard reachable with a visible focus ring
- Colour is never the only signal — pair badges with text or icons
- Every list has loading, empty, and error states
- Responsive from 1440px down to 768px
- `prefers-reduced-motion` respected
- All inputs have associated labels

**Copy**
- Sentence case. Active voice. "Save changes", not "Submit".
- A button's label matches its result: "Publish" produces "Published".
- Errors state what happened and what to do. They do not apologise and are never vague.
- Empty states invite an action rather than describing emptiness.

---

## 9. Do not

- Do not store answer positions or option letters — rule 3.1
- Do not fetch per question during an exam — rule 3.3
- Do not write "cheating detected" or equivalent anywhere — rule 3.4
- Do not show student names during an in-progress exam — rule 3.5
- Do not auto-publish AI-converted content or auto-import roster rows — rule 3.6
- Do not add libraries outside section 2 without asking
- Do not write custom CSS where a Tailwind utility exists
- Do not hand-edit files in `components/ui/` — they are generated
- Do not implement grading calculations in the frontend; the backend is authoritative
- Do not use `any`, `@ts-ignore`, or non-null assertions to silence type errors
- Do not add animation beyond hover and state transitions under 200ms

---

## 10. When unsure

Ask rather than guess, specifically about: field names not listed in section 6, marks and partial-credit behaviour, what happens to in-progress attempts when an exam changes, and anything touching how a flag is presented to a teacher.

Guessing in those four areas produces bugs that surface during a live exam, which is the worst possible time to find them.