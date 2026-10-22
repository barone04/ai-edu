# Project Guidelines

Project-specific rules on top of [ENGINEER_STANDARDS_EN.md](ENGINEER_STANDARDS_EN.md).

## Architecture

- Modular monolith. Do not add queues, caches, microservices or external auth providers.
- `src/server/stats` holds pure, deterministic functions. All numbers shown to teachers come from here. The LLM never computes or overrides scores.
- `src/server/ai` holds one prompt per task. Each prompt has a `PROMPT_VERSION` constant, stored with every generated record together with the model id.
- AI output is validated with Zod before it is saved. Invalid output is an error, never silently patched.
- `src/generated/` is produced by `prisma generate` and is not committed.

## Domain rules

- Pupils are anonymous codes only. Never add fields for names, faces, addresses or parents.
- Aggregate entry mode supports class-level analysis only. Never derive per-pupil data from totals.
- Diagnoses are hypotheses for the teacher to confirm, never definitive judgements.
- Before/after differences are descriptive classroom results, not causal learning gains.
- Demo records live in a classroom with `isDemo = true` and are always labelled "Dữ liệu minh họa".

## Language

- Code, comments, commits, branches, PRs and engineering docs: English.
- User interface and AI-generated teaching content: Vietnamese.

## Review exception

The project currently has a single developer. Until a second reviewer joins, the author self-reviews each PR against the PR checklist and CI must pass before merging into `dev` or `main`.

## Deployment

- Vercel deploys `main` to production. Preview deployments come from PRs.
- Run `prisma migrate deploy` against Neon before promoting a schema change to `main`.
