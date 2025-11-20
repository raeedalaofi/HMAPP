# Copilot Instructions for HMAPP-Web

## Project Overview
**HMAPP-Web** is a Next.js 16 frontend application with Server-Side Rendering (SSR) capabilities, connected to a Supabase backend database. It's an early-stage project (v0.1.0) focused on service category management and database connectivity.

## Architecture & Key Components

### Tech Stack
- **Framework**: Next.js 16 (App Router) with React 19
- **Styling**: Tailwind CSS v4 with PostCSS
- **Backend**: Supabase (PostgreSQL database with RLS policies)
- **Language**: TypeScript 5 with strict mode enabled
- **Path Alias**: `@/` maps to workspace root for clean imports

### Project Structure
```
hmapp-web/
├── app/                    # Next.js App Router (RSC-first)
│   ├── layout.tsx         # Root layout with Geist fonts
│   ├── page.tsx           # Home page (demonstrates Supabase connection)
│   └── globals.css        # Tailwind imports
├── utils/
│   └── supabase/          # Supabase client utilities (to be populated)
├── public/                # Static assets
├── package.json           # Dependencies (Supabase SSR + client libraries)
└── tsconfig.json          # Path alias and strict TypeScript config
```

### Data Flow Pattern
The current pattern in `app/page.tsx` demonstrates the standard architecture:
1. **Server Component** calls `createClient()` from `@/utils/supabase/server`
2. **Direct Database Queries** using Supabase JS client within React Server Components
3. **Error Handling**: Check both `data` and `error` from query results
4. **RLS-Protected Tables**: Access controlled via Row-Level Security policies (e.g., `service_categories`)

**Key Pattern**: Queries run server-side during render; no client-side API routes needed for direct table access.

## Development Workflows

### Start Development Server
```bash
npm run dev
```
Runs on `http://localhost:3000` with hot reload for `.tsx` and `.css` files.

### Build & Production
- **Build**: `npm run build` (creates optimized Next.js bundle)
- **Start**: `npm start` (runs production server)

### Linting
```bash
npm run lint
```
Uses ESLint 9 with Next.js core-web-vitals and TypeScript rules. Config in `eslint.config.mjs`.

## Code Conventions & Patterns

### Supabase Integration
- **Location**: Import from `@/utils/supabase/server` (currently empty—needs implementation)
- **Usage**: Server components only; follow `app/page.tsx` pattern
- **Query Pattern**: Destructure `{ data, error }` from Supabase queries
- **Environment**: Public URL and anon key in `.env.local` (never expose service role key in frontend)

### Styling Approach
- **CSS Framework**: Tailwind CSS v4 (PostCSS integrated)
- **Example**: `app/page.tsx` uses Tailwind utility classes with dark theme (`bg-gray-900`, `text-white`)
- **Fonts**: Geist Sans/Mono from `next/font` (loaded in `app/layout.tsx`)

### Component Structure
- **Server Components**: Default in App Router; use for data fetching (e.g., page.tsx)
- **Client Components**: Mark with `'use client'` only when needed (interactivity, hooks)
- **Metadata**: Define in `layout.tsx` or pages using `Metadata` type

### TypeScript Patterns
- **Strict Mode**: Enabled (`"strict": true`)
- **Path Aliases**: Use `@/` instead of relative paths (`import { x } from '@/utils/...'`)
- **Types**: Leverage `React.ReactNode` for children, import `type` for type-only imports

### Internationalization Note
- Code contains **Arabic comments** (العربية) and RTL text examples—preserve this convention for bilingual support

## Critical Implementation Gaps

### Missing: Supabase Server Client
`utils/supabase/server.ts` is imported but doesn't exist. Create it using `@supabase/ssr` pattern:
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const createClient = async () => {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookies) => cookies.forEach(({ name, value }) => cookieStore.set(name, value)),
      },
    }
  )
}
```

## Integration Points & Dependencies
- **Supabase Packages**: `@supabase/ssr` (0.7.0) + `@supabase/supabase-js` (2.83.0)
- **Database Access**: No API routes used; direct client queries in Server Components
- **Environment Requirements**: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` must be set in `.env.local`

## Testing & Debugging
- **Server Logs**: Output from `console.log()` in Server Components appears in terminal, not browser console
- **Database Testing**: Current `page.tsx` tests Supabase connection by querying `service_categories` table
- **RLS Debugging**: Check Supabase dashboard if queries return errors (often RLS policy issues)

---

**Last Updated**: Analysis based on Next.js 16, Supabase SSR 0.7.0, and current codebase state.
