<!--
CODEX INSTRUCTIONS - READ EVERY SESSION:

1. Read `./memory.md` first. It is the canonical memory file.
2. Use this file as a compact mirror only.
3. Update `memory.md` first, then sync this file and `CLAUDE.md`.
4. If the user reports a repeat mistake, add it to `memory.md` MISTAKE LOG before fixing.
5. Keep this file lean, current, and ASCII-safe.
-->

# ListingOS - Codex Mirror

## Critical Context
- `memory.md` is canonical. `codex.md` and `CLAUDE.md` are mirrors.
- App uses Next.js App Router (`next@16.2.1`), React 19, and strict TypeScript.
- Supabase access is split across SSR/user client, browser client, and service-role helper.
- Signup uses browser `signUp()` with PKCE and `/auth/callback` as the primary path; admin signup route is fallback-only.
- Public listing pages and public property chat depend on active-listing filters plus Supabase public-read policies.
- Hosted deploys need runtime env vars in Vercel; local `.env.*` files do not configure production.

## Reusable Mistakes
- Tailwind v4 custom colors and rings need explicit `@utility` blocks.
- Default to ASCII-safe UI strings; corrupted Unicode has already caused visible breakage.
- Async UI handlers must clear loading state on both success and error paths.
- Do not put event handlers in Server Components.
- Add top-of-handler concurrency guards for user-triggered async actions.
- Validate API request bodies at runtime.
- Keep reusable validation in shared Zod schemas used by both forms and API routes.
- Verify ownership after auth; auth alone is not enough.
- Add randomness to user-derived unique slugs.
- Validate email-domain deliverability on direct server-side signup paths.

## Current Issues
- `middleware.ts` still hard-fails if hosted Supabase env vars are missing.
- `components/PropertyChat.tsx` still has no timeout or abort handling for streaming fetch.
- Mojibake text still exists in multiple UI files.
- Some async handlers still miss concurrency guards.

## Architecture
- Browser auth lives in `app/auth/login/page.tsx` and `app/auth/signup/page.tsx`; `/auth/callback` exchanges code for session and creates the agent row if needed.
- Dashboard/server routes use `createServerSupabaseClient()` and re-check auth plus agent ownership.
- Client components use `createClient()` for profile edits, generated-content edits, uploads, and sign-out.
- Service-role access is reserved for fallback signup, callback agent creation, webhooks, and public property chat.

## Rules
1. Read and update `memory.md` first; sync mirrors after any reusable fix.
2. If the user reports a repeat mistake, log it before fixing.
3. Server files use `lib/supabase.ts`; client files use `lib/supabase-client.ts`.
4. Verify ownership after auth for protected reads and writes.
5. Use PKCE signup plus `/auth/callback` as the primary auth path.
6. Hosted deploys must define required runtime env vars in Vercel.
7. Keep UI strings ASCII-safe unless Unicode is clearly intentional and verified.
8. Async handlers need both loading cleanup and concurrency guards.
9. Validate request bodies at runtime before DB or external API work.
10. Keep reusable validation in shared Zod schemas used by both forms and API routes.
11. Validate email-domain deliverability on direct server-side signup paths.

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
