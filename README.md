# SacchiSewa

India-focused crowdfunding platform with 0% platform fee. Supports medical, education, and animal welfare fundraisers. Built with React, TypeScript, Supabase, and deployed on Vercel.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite |
| UI | Tailwind CSS, shadcn/ui (Radix UI), Framer Motion |
| Backend / Database | Supabase (PostgreSQL, Auth, Storage, Edge Functions) |
| State / Data fetching | TanStack Query v5 |
| Forms | React Hook Form + Zod |
| Routing | React Router DOM v6 |
| Hosting | Vercel |

---

## Project Structure

```
src/
  components/         Reusable UI components (Admin panels, modals, sections)
  components/ui/      shadcn/ui primitives (Button, Dialog, Input, etc.)
  hooks/              Custom React hooks (useCampaigns, useNotifications, etc.)
  integrations/
    supabase/
      client.ts       Supabase client initialisation (reads from .env)
      types.ts        Auto-generated TypeScript types from Supabase schema
  pages/              Route-level page components
  lib/
    utils.ts          Shared utilities (cn helper)

supabase/
  config.toml         Supabase project config
  migrations/         All database migrations in chronological order
  functions/
    send-donation-receipt/    Edge Function: emails donor on successful donation
    send-notification/        Edge Function: sends in-app notifications
```

---

## Local Development Setup

### Prerequisites

- Node.js 18+
- npm or bun
- A Supabase account and project

### 1. Clone the repository

```bash
git clone <repo-url>
cd sewaFoundation
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Open `.env` and fill in your Supabase credentials:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-public-key
```

### 4. Set up the database

Apply all migrations to your Supabase project:

```bash
npx supabase login
npx supabase link --project-ref your-project-id
npx supabase db push
```

This creates all tables, enums, RLS policies, and functions from `supabase/migrations/`.

### 5. Run the development server

```bash
npm run dev
```

Opens at `http://localhost:8080`.

---

## Supabase Configuration

### Where the credentials are used

The Supabase client is initialised in one place:

```
src/integrations/supabase/client.ts
```

It reads two environment variables:

```ts
const SUPABASE_URL            = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
```

Both must be set before running the app locally or deploying.

### Getting your credentials

1. Go to [supabase.com](https://supabase.com) and open your project
2. Navigate to **Project Settings > API**
3. Copy:
   - **Project URL** into `VITE_SUPABASE_URL`
   - **anon / public key** into `VITE_SUPABASE_PUBLISHABLE_KEY`

The anon key is intentionally public and safe to use in frontend code. Never put the `service_role` key in a frontend environment variable.

### Setting up a fresh Supabase project

If connecting to a brand-new Supabase project:

1. Create a project at [supabase.com](https://supabase.com)
2. Install the Supabase CLI: `npm install -g supabase`
3. Link the project: `npx supabase link --project-ref <your-project-ref>`
4. Push all migrations: `npx supabase db push`
5. Update `.env` with the new project URL and anon key
6. After any schema changes, regenerate TypeScript types:
   ```bash
   npx supabase gen types typescript --project-id your-project-id \
     > src/integrations/supabase/types.ts
   ```

### Edge Functions

Two Edge Functions handle notifications and receipts:

| Function | Trigger | Location |
|---|---|---|
| `send-donation-receipt` | Successful donation | `supabase/functions/send-donation-receipt/` |
| `send-notification` | In-app events | `supabase/functions/send-notification/` |

Deploy them with:

```bash
npx supabase functions deploy send-donation-receipt
npx supabase functions deploy send-notification
```

If the functions use an email provider (Resend, SendGrid, etc.), add its API key as a Supabase secret:

```bash
npx supabase secrets set RESEND_API_KEY=your-key
```

---

## Database Schema Overview

All schema is defined in `supabase/migrations/`. Key tables:

| Table | Purpose |
|---|---|
| `campaigns` | Fundraiser campaigns created by users |
| `donations` | Donation transactions linked to campaigns |
| `user_roles` | Role assignments (admin / user) |
| `notifications` | In-app notification records |
| `page_wallpapers` | Admin-configurable page backgrounds |
| `impact_stats` | Admin-editable homepage statistics |
| `faqs` | Admin-managed FAQ entries |

Row Level Security (RLS) is enabled on all tables. Policies restrict users to their own data. Admin access is controlled via the `has_role()` SQL function and the `user_roles` table.

---

## Admin Access

To grant a registered user admin rights, run the following in the Supabase SQL editor:

```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('user-uuid-here', 'admin');
```

Replace `user-uuid-here` with the UUID from `auth.users`.

---

## Deployment on Vercel

### Initial deployment

1. Push the repository to GitHub
2. Import the project at [vercel.com/new](https://vercel.com/new)
3. Add environment variables in **Vercel project settings > Environment Variables**:

```
VITE_SUPABASE_URL                 https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY     your-anon-key
```

4. Vite build settings (auto-detected by Vercel):
   - Build command: `npm run build`
   - Output directory: `dist`
   - Install command: `npm install`

5. Add your custom domain under **Project Settings > Domains**

### Subsequent deployments

Push to the main branch. Vercel deploys automatically on every push.

---

## Available Scripts

```bash
npm run dev        # development server on port 8080
npm run build      # production build to dist/
npm run preview    # preview the production build locally
npm run lint       # run ESLint
```

---

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | Yes | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Yes | Supabase anon/public key |

All variables prefixed with `VITE_` are bundled into the client by Vite and are visible in the browser. Do not store secrets or service-role keys in these variables.

---

## Notes for the Incoming Developer

**TypeScript types**: `src/integrations/supabase/types.ts` is auto-generated from the database schema. Do not edit it by hand. After any migration, regenerate it using the CLI command above.

**shadcn/ui components**: everything under `src/components/ui/` is copied directly into the source, not installed as a package. To add or upgrade components: `npx shadcn@latest add <component>`.

**Data fetching pattern**: all Supabase queries go through custom hooks in `src/hooks/`. They use `useQuery` and `useMutation` from TanStack Query. The query client is set up in `src/main.tsx`.

**Authentication**: handled entirely by Supabase Auth. See `src/pages/Auth.tsx` for the login and signup flow. Auth state is accessed via the Supabase client directly.

**OG image**: `index.html` currently references `/og-image.png` as a placeholder. Place the actual image at `public/og-image.png` before going live.

**`package-lock.json`**: after running `npm install` for the first time, the lock file will be regenerated. 

## Owner Dashboard
**User ID** hr@slogfy.in

**Password** 12345678
