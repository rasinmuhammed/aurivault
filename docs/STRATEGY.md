## AuriVault: Technology Stack, Competitive Landscape, and Go-To-Market

Below is a working brief capturing the technology stack assessment, competitive analysis, strategic niche, and a zero-budget go-to-market (GTM) plan. This document is intended for internal/product use and can be iterated as the product evolves.

### 1.2 Technology Stack: Strengths and Strategic Liabilities

The technology stack selected for AuriVault is modern, robust, and represents a significant strategic asset, particularly for attracting a developer‑centric audience.

#### Strengths
- Frontend: Next.js (App Router), TypeScript, Tailwind CSS provides a high‑performance, scalable, and familiar developer experience.
- Backend: tRPC for end‑to‑end type‑safe APIs, Prisma ORM, and PostgreSQL prioritize type safety and developer ergonomics for teams that may self‑host or contribute.
- AI & ML: Modular RAG design enables swapping LLMs and vector backends. Current implementation uses local MiniLM embeddings and pgvector; an LLM layer (e.g., Groq Llama) can be swapped as needed.

#### Strategic Liabilities
- Proprietary dependencies and usage‑based services (e.g., auth, storage, LLMs) can introduce ongoing costs and setup friction for a “free” self‑host.
- Financial implications: Usage‑based pricing complicates a “free forever” cloud tier and raises barriers for community adoption if multiple third‑party keys are required.

### 1.3 Feature Set and Roadmap Evaluation

#### Current State (MVP)
- Multi‑tenant auth, document uploads, basic RAG chat with citations, responsive UI.

#### In Progress / Next Up
- Vector search quality, advanced extraction/OCR, file preview, batch processing, connectors/integrations.

#### Enterprise Vision
- SSO/SAML, RBAC, API‑first design, white‑labeling—clear basis for an open‑core business model.

Positioning takeaway: For a technical audience, the stack itself is a feature. AuriVault should position as a “hackable, self‑hostable, AI‑native knowledge base for technical teams,” with a path to reduce third‑party reliance (self‑hosted embeddings, open‑source vector search).

---

## 2. Competitive Landscape

### 2.1 Commercial SaaS
- Category leaders (e.g., Zendesk, iManage) serve enterprises with deep suites.
- Modern AI‑native challengers (e.g., Guru, Slite, Document360) focus on polished UX, AI Q&A, and integrations; priced per‑user per‑month.

### 2.2 Open‑Source Alternatives
- Full solutions: Bookstack, Paperless‑ngx, Casibase (a close comparator for AI knowledge base).
- Enablers: Meilisearch, Typesense (open‑source vector search with managed cloud offerings as monetization models).

Key opportunity: Bridge the gap—open‑source control and self‑hosting with modern AI capabilities and a clear open‑core path.

---

## 3. Strategic Niche (Beachhead)

Target: Self‑hosted knowledge base for small‑to‑mid technical teams (dev/DevOps/data), 5–50 members.

Why it fits:
- Acute pain: Scattered technical docs across wikis, repos, and specs.
- High value on privacy/control: Preference for self‑hosting and transparency.
- Appreciation for the stack: Next.js + tRPC + Prisma credibility; API‑first fits programmatic workflows.

Messaging:
- Current: “AI‑powered knowledge base for your team.”
- Proposed: “Open‑source, AI‑native knowledge base you can host yourself. Turn Markdown, Confluence, and API specs into a searchable, intelligent API.”

---

## 4. Zero‑Budget Go‑To‑Market (GTM)

### 4.1 GitHub as the Product Hub
- README as a landing page: crisp value prop, quickstart (ideally Docker Compose), animated demo, and contribution guides.
- Label issues (good first issue / help wanted) to cultivate contributions.

### 4.2 Content for Developers
- “Build in public” blog posts on architecture, RAG trade‑offs, performance comparisons, self‑hosted vector search, etc.
- Documentation as product: tutorials for common deploys (e.g., DigitalOcean, Kubernetes) and API usage examples.

### 4.3 Distribution & Community
- Share major updates on HN and relevant subreddits (r/selfhosted, r/opensource, r/programming).
- Create a Discord/Slack for user support and feedback loops.
- Engage in adjacent OSS communities (Next.js, Prisma, pgvector, Typesense/Meilisearch).

Result: A product‑led, community‑driven flywheel where adoption → contribution → improvement → evangelism.


