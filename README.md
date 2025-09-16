# Create T3 App

## AuriVault

Secure brilliance — a multi-tenant knowledge vault that turns documents into cited, glowing insights.

### Brand & Design
- Dark foundation (`#0A0F1A`) with white and golden gradient accents.
- Tagline: "Where Knowledge Glows, Securely."

### Current MVP Scope
- Auth: Clerk with organizations (orgId → tenant).
- Documents: Upload PDF/DOCX/TXT, extract, chunk, embed with MiniLM, store vectors in pgvector.
- RAG: Similarity search per-tenant with citations. MVP answer shows context; LLM optional later.
- UI: Navbar, video hero homepage, `/documents` for upload/list, `/chat` for questions.

### Tech
- Next.js 15, tRPC 11, Prisma, Neon Postgres + pgvector, Clerk, Tailwind v4.
- Embeddings: `@xenova/transformers` MiniLM-L6-v2 (local, free).

### Setup
1. Env
   - `DATABASE_URL` (Postgres/Neon)
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`
2. DB
   - Enable extension: `CREATE EXTENSION IF NOT EXISTS vector;`
   - `npm install`
   - `npm run db:push`
3. Run
   - `npm run dev`

### Usage
- Sign in, create/select an Organization (tenant).
- Upload files at `/documents`.
- Ask questions at `/chat` and see cited context.

### Roadmap
- Analytics: top queries, confidence, gap analysis, CSV/PDF exports.
- Security: audit logs, role-based access, GDPR tooling.
- Personalization: per-tenant adapters (LoRA/PEFT), model switching.
- Integrations: Slack/Teams/LMS, REST API & webhooks.

### Contributing
PRs welcome. Focus: reliability, clarity, and tenant isolation.

## What's next? How do I make an app with this?

We try to keep this project as simple as possible, so you can start with just the scaffolding we set up for you, and add additional things later when they become necessary.

If you are not familiar with the different technologies used in this project, please refer to the respective docs. If you still are in the wind, please join our [Discord](https://t3.gg/discord) and ask for help.

- [Next.js](https://nextjs.org)
- [NextAuth.js](https://next-auth.js.org)
- [Prisma](https://prisma.io)
- [Drizzle](https://orm.drizzle.team)
- [Tailwind CSS](https://tailwindcss.com)
- [tRPC](https://trpc.io)

## Learn More

To learn more about the [T3 Stack](https://create.t3.gg/), take a look at the following resources:

- [Documentation](https://create.t3.gg/)
- [Learn the T3 Stack](https://create.t3.gg/en/faq#what-learning-resources-are-currently-available) — Check out these awesome tutorials

You can check out the [create-t3-app GitHub repository](https://github.com/t3-oss/create-t3-app) — your feedback and contributions are welcome!

## How do I deploy this?

Follow our deployment guides for [Vercel](https://create.t3.gg/en/deployment/vercel), [Netlify](https://create.t3.gg/en/deployment/netlify) and [Docker](https://create.t3.gg/en/deployment/docker) for more information.
