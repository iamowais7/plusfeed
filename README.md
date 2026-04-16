# PulseFeed

A high-performance, cross-media content hub — a hybrid between YouTube and Medium — built with Next.js 16, Prisma 7, PostgreSQL (Neon), and Tailwind CSS 4.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Styling | Tailwind CSS 4 |
| ORM | Prisma 7 |
| Database | PostgreSQL (Neon free tier) |
| Validation | Zod 4 |
| Auth | NextAuth v4 (credentials) |
| Deployment | Vercel |

## Features

- **Infinite-scroll Discovery Feed** — videos and articles intermingled, filter by type, sort by latest/trending
- **Optimistic UI** — Like and Bookmark respond instantly before DB confirms (React `useOptimistic`)
- **Cursor-based Pagination** — `WHERE id > last_seen_id` instead of slow `OFFSET`
- **Sub-10ms Search** — PostgreSQL `pg_trgm` GIN index on title
- **Atomic Counters** — `likes: { increment: 1 }` prevents race conditions
- **Continue Watching/Reading** — debounced progress sync every 5s
- **Admin Dashboard** — full CRUD, view count monitoring, slug integrity
- **Skeleton Screens** — Tailwind `animate-pulse` for perceived performance
- **Dark Mode** — system-level `dark:` classes throughout
- **Idempotent Engagement** — `@@id([userId, contentId, type])` catches double-clicks gracefully
- **No N+1 Queries** — engagement statuses fetched in a single `include` per page

---

## Setup Instructions

### 1. Clone and install

```bash
git clone <your-repo-url>
cd pulsefeed
npm install
```

### 2. Configure environment variables

Create a `.env` file in the project root:

```env
# Neon PostgreSQL connection string
# Get yours at https://neon.tech → New Project → Connection String
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require"

# NextAuth secret (generate with: openssl rand -base64 32)
NEXTAUTH_SECRET="your-32-char-secret-here"

# Your deployment URL (localhost for dev)
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Setup the database

```bash
# Generate Prisma client (required before running the app)
npx prisma generate

# Push the schema to your Neon database (creates all tables)
npx prisma db push
```

Then run the following in the **Neon SQL Editor** to enable fast search:

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS "content_title_trgm_idx"
  ON "Content" USING GIN (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "content_description_trgm_idx"
  ON "Content" USING GIN (description gin_trgm_ops);
```

### 4. Seed the database (10,000 records)

```bash
npm run db:seed
```

This creates:
- `admin@pulsefeed.com` / `admin123` (ADMIN role)
- `user@pulsefeed.com` / `user1234` (USER role)
- 10,000 content records with realistic data (faker.js)
- Sample engagements and progress records

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deployment to Vercel

1. Push code to GitHub
2. Import repo in [vercel.com](https://vercel.com)
3. Add environment variables in Vercel dashboard:
   - `DATABASE_URL` — your Neon connection string
   - `NEXTAUTH_SECRET` — your secret
   - `NEXTAUTH_URL` — your Vercel deployment URL (e.g. `https://pulsefeed.vercel.app`)
4. Set the build command to: `npx prisma generate && next build`
5. Deploy

---

## Application Walkthrough

| Route | Description |
|---|---|
| `/feed` | Main infinite-scroll discovery feed |
| `/feed?type=VIDEO` | Filter videos only |
| `/feed?sort=trending` | Sort by most liked |
| `/content/[slug]` | Full content view (video player / article reader) |
| `/continue` | Resume in-progress content |
| `/search?q=react` | Fuzzy search (pg_trgm powered) |
| `/login` | Sign in |
| `/register` | Create account |
| `/admin` | Admin dashboard (ADMIN role required) |
| `/admin/content` | Content management table |
| `/admin/content/new` | Create content |
| `/admin/content/[id]/edit` | Edit content |

---

## Architecture Decisions

### Cursor-based Pagination
```ts
// Good — O(log n) always
prisma.content.findMany({ take: 21, cursor: { id: lastSeenId }, skip: 1 })

// Bad — O(n) gets slower as data grows
prisma.content.findMany({ take: 20, skip: 400 })
```

### Atomic Like Counter
```ts
// Prevents race conditions
prisma.content.update({ data: { likeCount: { increment: 1 } } })
```

### No N+1 — Single Query for Engagement Status
```ts
// Fetches all engagement statuses in one DB query via Prisma include
const feed = await prisma.content.findMany({
  include: { engagements: { where: { userId } } }
})
```

### GIN Index for Sub-10ms Search
```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX content_title_trgm_idx ON "Content" USING GIN (title gin_trgm_ops);
```

### Debounced Progress Sync
```ts
// Frontend only syncs every 5s — not on every scroll/timeupdate event
setTimeout(() => syncProgress(position), 5000)
```

---

## Folder Structure

```
src/
├── app/
│   ├── (auth)/login, register    # Auth pages
│   ├── actions/                  # Server Actions (auth, content)
│   ├── admin/                    # Admin dashboard
│   ├── api/                      # Route handlers (REST API)
│   ├── content/[slug]/           # Content detail page
│   ├── continue/                 # Resume watching/reading
│   ├── feed/                     # Discovery feed
│   └── search/                   # Search results
├── components/
│   ├── admin/                    # ContentForm
│   ├── content/                  # VideoPlayer, ArticleReader
│   ├── engagement/               # LikeButton, BookmarkButton (Optimistic UI)
│   ├── feed/                     # ContentCard, FilterBar, InfiniteFeed, SkeletonCard
│   └── ui/                       # Navbar, SearchBar, Providers
├── lib/
│   ├── auth.ts                   # NextAuth config
│   ├── prisma.ts                 # Prisma singleton
│   ├── slugify.ts                # Slugify utility (slug integrity)
│   └── validations.ts            # Zod schemas for all API inputs
├── services/
│   ├── content.ts                # Content queries (feed, search, CRUD)
│   ├── engagement.ts             # Like/bookmark toggle (atomic)
│   └── progress.ts               # Progress tracking (upsert)
└── types/
    └── next-auth.d.ts            # Session type augmentation
prisma/
├── schema.prisma                 # Database schema (User, Content, Engagement, Progress)
├── seed.ts                       # Faker seed script (10,000 records)
└── migrations/
    └── 20240101_init_search_index/
        └── migration.sql         # pg_trgm GIN index
```
