# Plan — Bắt Mạch Lớp Học AI

Product background and competition context: [CONTEXT.md](../CONTEXT.md).

## 1. Problem

A rural primary-school teacher (30–40 pupils, one phone, no pupil devices) cannot tell **why** pupils answer wrongly, so remediation is generic. The app closes one learning loop:

```
quick check → enter paper answers → find misconceptions → remedial activity → re-check → report
```

- **Input:** lesson objective from the teacher; A/B/C/D answers written on paper, entered per anonymous code (H01…) or as class totals.
- **Output:** misconception hypotheses, a 5-minute remedial activity with differentiated A4 worksheets, a descriptive before/after report.
- **Core idea:** every wrong option carries a misconception hypothesis, so the distribution of answers points to what to reteach.

## 2. Scope decisions

- Primary school, Mathematics grades 4–5.
- Teacher enters answers manually. Photo/OCR answer reading is out of scope.
- Single teacher-facing app protected by one shared passcode. No accounts, roles or multi-tenancy.
- Deterministic TypeScript computes all statistics. The LLM only generates content and wording.
- Everything AI-generated is a draft until the teacher edits and approves it.
- Demo data lives in a classroom flagged `isDemo` and is labelled "Dữ liệu minh họa" everywhere.

## 3. Architecture

Modular monolith on Next.js 16 (App Router), deployed to Vercel Hobby with Neon Postgres.

```
src/
  app/                 pages and route handlers
  components/          shared UI
  server/
    db.ts              Prisma client (pg driver adapter)
    stats/             pure statistics, unit tested
    ai/                Groq client (fetch), versioned prompts, Zod schemas
    repositories/      data access per aggregate
    auth.ts            passcode session
prisma/                schema, migrations, seed
tests/unit, tests/e2e
```

Constraints:

- The Groq key and model stay server-side (`GROQ_API_KEY`, `GROQ_MODEL`). Groq is called through its OpenAI-compatible HTTP endpoint with plain `fetch`, so no SDK dependency is needed.
- AI calls: structured JSON output, Zod validation, bounded input, timeout, no retry loops. On failure the teacher sees a clear error and can retry or write questions by hand. A failed call never produces fake output.
- Each AI-generated record stores `aiModel` and `promptVersion`.
- Only aggregated statistics are sent to the model, never pupil-level rows.

## 4. Data model

See [prisma/schema.prisma](../prisma/schema.prisma).

| Model | Purpose |
| --- | --- |
| Classroom | class name, grade, size, `isDemo` |
| Student | anonymous code per class |
| Lesson | subject, title, objective, reference text, teacher observations |
| Assessment | one `PRE` and one `POST` per lesson, entry mode |
| Question | content, options, correct option, misconception per wrong option, AI provenance |
| Response | one pupil's chosen option per question (individual mode) |
| AggregateAnswer | count per option per question (aggregate mode) |
| Diagnosis | teacher-confirmed misconceptions, group overrides, AI summary |
| Material | remedial activity and worksheets, edit flag, AI provenance |

Statistics are recomputed from responses on demand rather than stored, so they cannot drift from the source data.

## 5. Modules

| # | Module | Status target |
| --- | --- | --- |
| A | Classroom and lesson setup, seeded demo lesson | required |
| B | AI diagnostic quiz (3 questions) with teacher review and manual fallback | required |
| C | Answer entry: individual grid (H01 × Q) and class totals | required |
| D | Diagnosis: statistics, misconception ranking, provisional groups with override | required |
| E | AI remedial activity and A/B/C worksheets, print CSS, answer keys kept off pupil sheets | required |
| F | Post-assessment and printable before/after report | required |
| G | Lesson history: list, reopen, delete | reduced |
| — | Passcode gate | required before deploy |

Cut for the competition deadline: AI misconception summary (rule-based ranking is enough), blackboard mode beyond a large-text toggle, charting library (CSS bars instead).

## 6. User flow and screens

`Tạo bài → Nhập kết quả → Xem lỗi sai → Chữa lỗi → Kiểm tra lại`

1. Dashboard: classes and lessons, "Xem bản mẫu" entry.
2. Lesson setup.
3. Quiz generation and review.
4. Answer entry.
5. Diagnosis.
6. Remedial material editor and print view.
7. Post-assessment entry.
8. Before/after report and print view.

## 7. API surface

Server actions for form mutations. Route handlers only where a plain HTTP endpoint is needed:

| Endpoint | Purpose |
| --- | --- |
| `GET /api/health` | liveness and database check |
| `POST /api/ai/quiz` | generate diagnostic or follow-up questions |
| `POST /api/ai/remedial` | generate remedial activity and worksheets |

## 8. Milestones

| Date | Milestone | Verify |
| --- | --- | --- |
| 22/10 | repo setup, schema, statistics module, CI | `npm test`, `npm run typecheck`, migration applies |
| 23/10 | modules A–E | full flow on a 360px viewport |
| 24/10 am | module F, passcode, deploy to Vercel + Neon, one E2E flow | public HTTPS URL, data survives redeploy |
| 24/10 pm | real classroom pilot | real before/after data recorded |
| 25/10 | fixes, slides, video, poster, submission | submitted before 23:59 |

## 9. Acceptance criteria

1. Lessons can be created and persist across reloads and redeploys.
2. AI returns schema-valid questions when a key is configured; failures show a clear error and a manual path.
3. Teachers can edit and approve every question field.
4. Answers can be entered without pupil devices, in both modes.
5. Statistics match the unit-tested rules; aggregate mode never yields per-pupil data.
6. Worksheets are editable and print cleanly on A4 in black and white.
7. The report uses stored data and is labelled descriptive, not causal.
8. Demo data is always labelled as synthetic.
9. Layout is usable at 360px width.

## 10. Risks

| Risk | Mitigation |
| --- | --- |
| Deadline | strict module order, cut list above |
| Unstable school internet | prepare and print materials before class; answer entry is light |
| LLM produces wrong maths | teacher review is mandatory before use; Zod validation; flag for review |
| Over-claiming impact | report wording is descriptive; demo data labelled |
| Vercel Hobby is non-commercial | acceptable for school and competition use; revisit if commercialised |
| Neon scale-to-zero cold start | first request after idle is slower; acceptable |
