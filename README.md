# Lớp Mình Hiểu Bài

Helps primary-school teachers find **why** pupils answer wrongly, reteach the right concept and measure the result, with pupils working only on paper.

Loop: quick 3-question check → teacher enters paper answers → misconception diagnosis → AI remedial activity and differentiated worksheets → follow-up check → before/after report.

See [docs/PLAN.md](docs/PLAN.md) for requirements, architecture and milestones, and [PROJECT-GUIDELINES.md](PROJECT-GUIDELINES.md) for project rules.

## Stack

Next.js 16 · TypeScript · Tailwind CSS 4 · Prisma 7 + PostgreSQL · Groq API (OpenAI-compatible) · Zod · Vitest

## Requirements

- Node.js 24+
- Docker, for the local Postgres database

## Local setup

```bash
cp .env.example .env          # fill GROQ_API_KEY to enable AI features
docker compose up -d db       # Postgres on localhost:5433
npm install                   # also generates the Prisma client
npm run db:migrate            # apply migrations
npm run dev                   # http://localhost:3000
```

## Environment variables

| Name | Description |
| --- | --- |
| `DATABASE_URL` | Postgres connection string |
| `GROQ_API_KEY` | server-side only; empty runs demo fixtures only |
| `GROQ_MODEL` | Groq model id used for all AI tasks; must support strict JSON schema output |
| `APP_PASSCODE` | shared passcode for teachers |
| `SESSION_SECRET` | secret for signing the session cookie |

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | development server |
| `npm run build` | production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | route type generation and `tsc` |
| `npm test` | unit tests |
| `npm run db:migrate` | create and apply migrations in development |

## Deployment

Production runs on **Vercel (Hobby)** with **Neon Postgres (Free)**.

1. Create a Neon project and copy its pooled connection string.
2. Import the GitHub repository into Vercel. Production branch: `main`.
3. Set the environment variables above in Vercel.
4. Apply migrations against Neon: `DATABASE_URL=<neon-url> npx prisma migrate deploy`.

Vercel's filesystem is ephemeral, so the database must be external. SQLite is not used.

## Privacy

Pupils are identified only by anonymous codes (H01, H02…). Do not enter names or other identifying information. Only aggregated statistics are sent to the AI model.
