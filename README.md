# Éclat — Learn. Compete. Win.

Éclat is a gamified academic preparation platform designed for Nigerian primary and junior secondary scholars preparing for the National Common Entrance Examination (NCEE) and Basic Education Certificate Examination (BECE).

Turn exam prep into an adventure: practice curriculum-aligned questions, duel peers in real-time, climb national leaderboards, and win real scholarship grants.

---

## 🌐 Live Environments & Deployment

The platform operates on a two-tier continuous deployment architecture hosted on **Vercel**:

| Environment | Live URL | Tracking Git Branch | Purpose | Deployment Trigger |
| :--- | :--- | :--- | :--- | :--- |
| **Production** | [https://eclatapp.com.ng](https://eclatapp.com.ng) | `main` | Official live users (Students, Schools, Parents) | Merged PR into `main` |
| **Staging / Beta** | [https://www.eclatapp.xyz](https://www.eclatapp.xyz) | `staging` | QA testing, beta features, preview verification | Auto-deployed on push to `staging` |

> 🔒 **Branch Protection Note**: Direct terminal pushes (`git push origin main`) to the `main` branch are locked by GitHub Rulesets. All production releases must go through a Pull Request from `staging` into `main`.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling & UI**: Tailwind CSS, shadcn/ui (Radix UI primitives), Lucide Icons
- **State Management**: TanStack React Query v5
- **Backend**: Supabase (PostgreSQL, Row-Level Security, Edge Functions in Deno, Auth, Storage)
- **Testing**: Vitest
- **Hosting**: Vercel SPA

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Supabase CLI** *(optional, for database & type management)*: `npm i -D supabase`

### Local Setup

1. **Clone the repository:**
   ```bash
   git clone git@github.com:eclatdevteam/eclat-bece.git
   cd eclat-bece
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the project root:
   ```env
   VITE_SUPABASE_PROJECT_ID=your_supabase_project_id
   VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
   VITE_SUPABASE_URL=https://your_supabase_project_id.supabase.co
   ```

4. **Start the local development server:**
   ```bash
   npm run dev
   ```
   The application will be running at **`http://localhost:8080`**.

---

## 📜 Available NPM Scripts

| Command | Purpose |
| :--- | :--- |
| `npm run dev` | Starts the Vite development server on port 8080. |
| `npm run build` | Compiles TypeScript and builds production bundles to `dist/`. |
| `npm test` | Runs the Vitest test suite. |
| `npm run typecheck` | Runs `tsc --noEmit` across all project sources to verify types. |
| `npm run types:regen` | Pulls live schema from the linked Supabase project and updates `src/integrations/supabase/types.ts`. |
| `npm run preview` | Locally previews the production build output from `dist/`. |

---

## 🔀 Developer Workflow & Git Standards

We follow a strict **branch-based promotion workflow**:

```
[Local Feature Branch]
        │
        ▼ (PR)
   [staging] ──────► Auto-deploys to https://www.eclatapp.xyz (Beta Testing)
        │
        ▼ (PR after QA verification)
    [main]   ──────► Auto-deploys to https://eclatapp.com.ng (Live Production)
```

### 1. Starting New Work:
Always base your feature or bug fix branches off **`staging`**:
```bash
git checkout staging
git pull origin staging
git checkout -b feat/your-feature-name
```

### 2. Testing Before Committing:
Ensure typechecking and tests pass locally:
```bash
npm run typecheck
npm test
```

### 3. Submitting Work for Staging:
Push your branch to GitHub and open a Pull Request targeting **`staging`**:
```bash
git push -u origin feat/your-feature-name
```
Once merged into `staging`, Vercel immediately deploys your changes to **`https://www.eclatapp.xyz`** for QA and beta testing.

### 4. Promoting to Production:
When your changes have been tested and verified on staging:
1. Open a Pull Request from `staging` into `main`.
2. Ensure status checks pass and review is approved.
3. Merge the PR. Vercel automatically deploys to **`https://eclatapp.com.ng`**.

*For full details on commit conventions and PR checklists, read [CONTRIBUTING.md](./CONTRIBUTING.md).*

---

## 🗄️ Database & Supabase Workflow

Database migrations live in [`supabase/migrations/`](./supabase/migrations/).

### Executing Migrations
When a new migration SQL file is added, apply it to the remote database using the Supabase CLI:
```bash
npx supabase db query --linked -f supabase/migrations/<migration_file_name>.sql
```

### Regenerating TypeScript Database Types
After creating or modifying database tables, functions, or columns, regenerate the TypeScript database contract:
```bash
npm run types:regen
```
This updates [`src/integrations/supabase/types.ts`](./src/integrations/supabase/types.ts) so that autocomplete and type checking reflect the latest database schema.

---

## 👥 User Roles & Access Architecture

Éclat features five distinct, role-segregated user types:

| Role | Login Route | Primary Portal | Access Details |
| :--- | :--- | :--- | :--- |
| **Student** | `/auth` | `/dashboard` | Solves quizzes, duels peers, tracks XP, earns badges and scholarship points. |
| **Parent** | `/auth` | `/parent` | Supervises linked children, reviews performance analytics, assigns targeted practice. |
| **School Admin**| `/school/login` | `/dashboard/school` | Manages school classes, student rosters, exam allocations, and teacher accounts. |
| **Teacher** | `/teacher-login`| `/dashboard/teacher` | Enrolled by school; manages assigned class subjects, practice assignments, and student grades. |
| **Platform Admin**| `/admin/login` | `/admin` | Manages question bank, platform analytics, school invitations, and competitions. |

---

## 📚 Detailed Documentation

- **[SYSTEMS_DOCUMENTATION.md](./SYSTEMS_DOCUMENTATION.md)** — Complete architectural reference, database schema, RLS policies, security model, and Edge Functions.
- **[ADMIN_SETUP.md](./ADMIN_SETUP.md)** — Step-by-step instructions for provisioning the initial Super Admin account.
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** — Pull request guidelines, branch conventions, and code review standards.

---

## 📁 Repository Structure

```
├── public/                 # Static assets, logos, and icons
├── src/
│   ├── assets/             # Bundled images and styling assets
│   ├── components/         # Reusable UI & feature components
│   │   ├── admin/          # Platform admin interfaces
│   │   ├── duel/           # Real-time 1v1 arena matchmaking & duels
│   │   ├── landing/        # Homepage & marketing sections
│   │   ├── parent/         # Parent oversight components
│   │   ├── quiz/           # Quiz engine & question interactive viewers
│   │   ├── school/         # School portal & classroom views
│   │   ├── teacher/        # Teacher portal components
│   │   └── ui/             # shadcn/ui primitive design tokens
│   ├── hooks/              # Custom React Query & auth hooks
│   ├── integrations/       # Supabase client & generated database types
│   ├── lib/                # Shared utilities and query keys
│   ├── pages/              # Routed pages (Student, Parent, School, Admin)
│   ├── services/           # Backend communication & gamification services
│   ├── types/              # Domain TypeScript interfaces
│   └── utils/              # Business logic utilities (scoring, leaderboard)
├── supabase/
│   ├── functions/          # Deno Edge Functions (user provisioning, scoring)
│   ├── migrations/         # PostgreSQL database migration scripts
│   └── config.toml         # Supabase CLI project configuration
├── vercel.json             # Vercel SPA routing and rewrite rules
├── vite.config.ts          # Vite build, server, and path aliases configuration
└── package.json            # Scripts, dependencies, and project metadata
```
