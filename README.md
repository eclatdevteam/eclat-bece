# Éclat — Learn. Compete. Win.

Turn exam prep into a game. Practice questions, climb the leaderboard, and earn rewards.

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui (Radix primitives)
- **Backend**: Supabase (Auth, Database, Edge Functions, Storage)
- **Hosting**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Local Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

The app will be available at `http://localhost:8080`.

### Environment Variables

Create a `.env` file in the project root:

```
VITE_SUPABASE_PROJECT_ID=your_project_id
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
VITE_SUPABASE_URL=https://your_project_id.supabase.co
```

### Building for Production

```bash
npm run build
```

Output is generated in the `dist/` directory.

### Type Checking & Database Types

```bash
npm run typecheck      # tsc over the app sources
npm run types:regen    # regenerate src/integrations/supabase/types.ts
```

`types:regen` requires the Supabase CLI (`npm i -D supabase`) and an authenticated
session (`npx supabase login`); it reads the linked project in
`supabase/.temp/linked-project.json`. Run it after every new migration so the
generated `Database` types stay in sync — new tables/RPCs are unusable without
casts until it runs.

## Project Structure

```
├── public/              # Static assets
├── src/
│   ├── components/      # Reusable UI components
│   ├── hooks/           # Custom React hooks
│   ├── integrations/    # Supabase client config
│   ├── lib/             # Utility functions
│   ├── pages/           # Route pages
│   └── types/           # TypeScript type definitions
├── supabase/
│   ├── functions/       # Supabase Edge Functions
│   └── migrations/      # Database migrations
├── vercel.json          # Vercel SPA rewrite config
└── vite.config.ts       # Vite build config
```

## Deployment

This project is deployed on Vercel. Push to the `main` branch to trigger an automatic deployment.

For admin setup instructions, see [ADMIN_SETUP.md](./ADMIN_SETUP.md).
