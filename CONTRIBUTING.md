# Contributing to Éclat BECE

Welcome to the Éclat BECE team! This guide explains our development standards, branching strategies, testing requirements, and release processes so all team members can ship clean, dependable code with confidence.

---

## 🏗️ Environments & Branching Strategy

We follow a two-tier promotion model to separate active development and QA from live production:

```
[Local Feature Branch]
        │
        ▼ (Pull Request)
    [staging]  ──────► Auto-deploys to https://www.eclatapp.xyz (Staging / Beta)
        │
        ▼ (Pull Request after QA verification)
     [main]    ──────► Auto-deploys to https://eclatapp.com.ng (Live Production)
```

### The Branches:
1. **`staging`**: The working integration branch. All feature branches, bug fixes, and improvements are merged here first. Every commit to `staging` automatically triggers a Vercel preview deployment to **`https://www.eclatapp.xyz`**.
2. **`main`**: The official production branch. Only tested, QA-verified code from `staging` is merged here. Every merge to `main` automatically deploys to **`https://eclatapp.com.ng`**.

> ⚠️ **Direct pushes to `main` are disabled.** GitHub Rulesets block any `git push origin main`. All changes to `main` must arrive via a Pull Request from `staging`.

---

## 🌿 Branch Naming Conventions

Always create new branches from an up-to-date **`staging`** branch:

```bash
git checkout staging
git pull origin staging
git checkout -b <prefix>/<short-description>
```

### Accepted Branch Prefixes:
| Prefix | Purpose | Example |
| :--- | :--- | :--- |
| `feat/` | New feature or capability | `feat/student-streak-shields` |
| `fix/` | Bug fix or patch | `fix/quiz-timer-freeze` |
| `refactor/` | Code refactoring without behavior change | `refactor/leaderboard-hook` |
| `docs/` | Documentation updates | `docs/update-readme` |
| `chore/` | Dependency upgrades, build or tooling tweaks | `chore/update-browserslist` |
| `test/` | Adding or updating unit/integration tests | `test/scoring-utils` |

---

## 📝 Commit Message Guidelines

We use [Conventional Commits](https://www.conventionalcommits.org/) to keep the Git log readable and informative:

```text
<type>(<scope>): <short description>
```

### Examples:
- `feat(duel): add rematch button to quick duel resolution screen`
- `fix(auth): prevent duplicate email conflicts during teacher onboarding`
- `docs(readme): add two-tier deployment architecture table`
- `test(leaderboard): add tests for student name privacy masking`

---

## 🧪 Quality Checklist Before Opening a PR

Before opening a Pull Request, run the following three commands in your terminal:

```bash
# 1. Typecheck the entire codebase
npm run typecheck

# 2. Run unit tests
npm test

# 3. Test the production build
npm run build
```

If all three commands exit with code `0`, your code is ready for review!

---

## 📬 Pull Request Process

1. **Push your branch to GitHub:**
   ```bash
   git push -u origin <branch-name>
   ```

2. **Open a PR against `staging`:**
   * **Base branch**: `staging`
   * **Compare branch**: your feature branch

3. **Fill out the PR description:**
   * **Overview**: What does this PR do?
   * **Key Changes**: Bullet list of modified components, routes, or queries.
   * **Database**: Did this require a migration? (If so, link the migration file).
   * **Verification**: How did you test it?

4. **Review & Merge:**
   * Once approved and checks pass, merge into `staging`.
   * Test your changes live on **`https://www.eclatapp.xyz`**.

---

## 🚀 Releasing to Production (`staging` ➔ `main`)

When a collection of features or fixes has been thoroughly verified on staging:

1. On GitHub, open a Pull Request from **`staging`** into **`main`**.
2. Title it clearly: `Release: <Brief Summary of features/fixes>`.
3. Submit the approving review.
4. Merge the PR.
5. Vercel automatically deploys the release to **`https://eclatapp.com.ng`**.

---

## 🗄️ Database Changes (Supabase Migrations)

If your changes involve new tables, columns, RLS policies, or stored procedures:

1. **Create a migration file** in `supabase/migrations/` using timestamped naming:
   ```text
   YYYYMMDDHHMMSS_brief_description.sql
   ```
2. **Security & Permissions**:
   * Always write explicit Row-Level Security (`RLS`) policies.
   * Always grant appropriate execute permissions if creating `SECURITY DEFINER` functions:
     ```sql
     GRANT EXECUTE ON FUNCTION public.my_function() TO anon, authenticated, service_role;
     ```
3. **Execute against Supabase**:
   ```bash
   npx supabase db query --linked -f supabase/migrations/<file_name>.sql
   ```
4. **Regenerate TypeScript Types**:
   ```bash
   npm run types:regen
   ```
   Commit both the migration SQL file and the updated `src/integrations/supabase/types.ts`.
