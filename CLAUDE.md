<!--
CLAUDE INSTRUCTIONS - READ EVERY SESSION:
1. Read `memory.md` first. It is the canonical source of truth.
2. This file is a compatibility mirror for tools and agents that still look for `CLAUDE.md`.
3. Do not update this file without also updating `memory.md`.
4. If the user reports a bug, regression, or repeated mistake, append to `memory.md` MISTAKE LOG before fixing.
5. Keep this file aligned with `memory.md`; do not let it drift.
-->

# ListingOS - CLAUDE Mirror

## Read This First
- Canonical source of truth: `memory.md`
- Compact mirror: `codex.md`
- Compatibility mirror: this file
- If there is any conflict, `memory.md` wins.

## Critical Context
- Project root is `listingos/`.
- App uses Next.js App Router (`next@16.2.1`), React 19, and strict TypeScript.
- Supabase access is split across:
  - `lib/supabase.ts` for SSR/user-scoped work and service-role helper
  - `lib/supabase-client.ts` for browser/client work
- Signup is browser `signUp()` with PKCE and `/auth/callback` first; admin create-user route is fallback only.
- Public listing pages and public property chat depend on active-listing filters and public-read policies.
- Browser uploads use the public-read `listing-photos` bucket before listing creation.
- Hosted deploys need runtime env vars configured in Vercel; local env files alone do not configure production.

## Reusable Mistakes Already Fixed

### Tailwind v4 custom utilities
- Problem: custom colors/rings in `@theme` did not reliably produce the utility variants the app used.
- Fix: explicit `@utility` blocks were added in `app/globals.css`.
- Rule: define explicit Tailwind v4 utilities for custom classes the UI depends on.

### Mojibake in UI strings
- Problem: corrupted Unicode text rendered as garbage in the UI.
- Fix: affected text was rewritten with safe characters where fixed.
- Rule: default to ASCII-safe UI strings.

### Loading state not cleared on success
- Problem: `router.refresh()` does not reset component state by itself.
- Fix: successful paths now clear loading state where this bug was fixed.
- Rule: clear loading state on both success and error.

### Event handlers in Server Components
- Problem: interactive handlers in `app/` server files caused runtime failures.
- Fix: interaction moved to client components or CSS-only behavior.
- Rule: do not place event handlers in Server Components.

### Signup auth flow drift
- Problem: admin-only signup caused confirmation and redirect problems across Supabase setups.
- Fix: PKCE signup plus `/auth/callback` became the primary path; admin signup is fallback only.
- Rule: use standard auth flows first and keep admin auth creation as fallback.

### Missing runtime validation
- Problem: API routes trusted compile-time types for request bodies.
- Fix: runtime validation was added where this was caught.
- Rule: validate request data before DB or external API calls.

### Validation drift between forms and routes
- Problem: client forms and API routes drifted because validation was hand-written in local component state and route handlers.
- Fix: shared Zod schemas now live in `lib/schemas.ts` and are reused by React Hook Form and server routes.
- Rule: keep reusable validation in shared schemas and reuse it across forms and routes.

### Missing MX checks on direct signup fallback
- Problem: direct server-side signup could create users for domains that cannot receive email.
- Fix: fallback signup now checks MX records before creating the auth user.
- Rule: validate email-domain deliverability on direct server-side signup paths.

### Missing ownership checks
- Problem: authenticated users could reach data that was not scoped to their own agent.
- Fix: affected routes/pages now filter by `user_id` or `agent_id`.
- Rule: authentication alone is not enough; always verify ownership.

### Hosted runtime env drift
- Problem: local env files made deploys look configured while hosted runtime env vars were missing.
- Fix: required env vars were documented and must be configured in Vercel.
- Rule: local `.env.*` files do not configure the hosted runtime.

## Current Issues
- `middleware.ts` still hard-fails if hosted Supabase env vars are missing.
- `components/PropertyChat.tsx` still lacks timeout/abort handling for streaming fetch.
- Mojibake/non-ASCII text still exists in several UI files.
- Some client async handlers still lack top-of-handler concurrency guards.

## Architecture
- `middleware.ts` rebuilds a Supabase SSR client from request cookies and guards `/dashboard*`.
- `app/auth/signup/page.tsx` uses browser `signUp()` with `emailRedirectTo: <APP_URL>/auth/callback`; duplicate emails are detected via empty `identities[]`.
- `app/auth/callback/route.ts` exchanges the auth code for a session and creates the `agents` row from user metadata if needed.
- `app/api/auth/signup/route.ts` is a fallback admin signup path for email-rate-limit cases.
- `app/api/auth/resend-confirmation/route.ts` resends signup confirmation mail with the same callback URL.
- Dashboard pages use `createServerSupabaseClient()` and re-check auth plus ownership.
- Client components use `createClient()` for profile edits, generated-content edits, uploads, and sign-out.
- `/api/generate`, `/api/generate/regenerate`, and `/api/images/generate` are authenticated, user-scoped flows.
- `/api/chat` is intentionally public, validates inputs, reads active listing data with service-role access, and streams Groq output.

## Rules
1. Update `memory.md` first; sync this file and `codex.md` after.
2. Log repeat mistakes before fixing them.
3. Server files use `lib/supabase.ts`; client files use `lib/supabase-client.ts`.
4. Verify ownership after auth for protected reads and writes.
5. Use PKCE signup plus `/auth/callback` as the primary signup flow.
6. Configure required runtime env vars in Vercel for hosted deploys.
7. Keep UI strings ASCII-safe unless Unicode is clearly intentional and verified.
8. Async UI handlers need both loading cleanup and concurrency guards.
9. Validate request bodies at runtime.
10. Add explicit Tailwind v4 utilities for custom classes.
11. Pair `max-w-*` with `mx-auto` when centered layouts are intended.
12. Use viewport-height admin layout patterns for sidebars and scroll regions.
13. Add randomness to user-derived unique slugs.
14. Keep reusable validation in shared Zod schemas and reuse it across forms and routes.
15. Validate email-domain deliverability on direct server-side signup paths.

## Mistake Log
- 2026-03-23 - Tailwind v4 custom utilities invisible
- 2026-03-23 - Mojibake in UI strings
- 2026-03-23 - Loading state stuck after successful refresh
- 2026-03-23 - Event handlers in Server Components
- 2026-03-23 - Orphaned helper left after extraction
- 2026-03-23 - Admin-only signup caused confirmation and redirect failures
- 2026-03-24 - Form text invisible in some browsers
- 2026-03-24 - Sidebar action pushed off-screen
- 2026-03-24 - Slug collisions broke signup
- 2026-03-24 - Missing concurrency guards on user actions
- 2026-03-24 - API routes trusted request types without runtime checks
- 2026-03-24 - Client and server validation drifted out of sync
- 2026-03-24 - Direct fallback signup accepted undeliverable email domains
- 2026-03-24 - Centered layouts were left-aligned
- 2026-03-24 - Protected listing detail missed ownership scoping
- 2026-03-24 - Middleware deployment crashed from missing hosted env vars
