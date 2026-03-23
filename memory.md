<!--
MEMORY INSTRUCTIONS - READ EVERY SESSION:

1. This is the canonical memory file.
2. Read this file before making code or config changes.
3. Update only touched sections; do not rewrite the whole file without reason.
4. If the user reports a bug, regression, repeat mistake, or says a prior fix was wrong, append to MISTAKE LOG before fixing.
5. After every bug fix or reusable lesson, update this file first, then sync codex.md and CLAUDE.md.
6. Prefer reusable rules over long narrative.
7. Remove stale, disproven, or repo-divergent entries.
8. If codex.md or CLAUDE.md disagrees with this file, this file wins.
-->

# ListingOS - Memory

## Critical Context
- Project root is `listingos/`; `memory.md` is the canonical memory file. `codex.md` and `CLAUDE.md` are mirrors.
- App uses Next.js App Router (`next@16.2.1`), React 19, and strict TypeScript.
- Supabase access is split three ways: SSR/user client in `lib/supabase.ts`, browser client in `lib/supabase-client.ts`, and service-role helper in `lib/supabase.ts`.
- Signup now uses browser `signUp()` with PKCE and `emailRedirectTo` as the primary path; admin signup route is a fallback for email-rate-limit failures.
- Public listing pages and public property chat rely on active-listing filters plus Supabase public-read policies.
- Browser clients upload listing photos directly to the public-read `listing-photos` bucket before listing creation.
- Vercel deployment must provide runtime env vars for middleware and server routes; local `.env.production` alone is not enough.

## Reusable Mistakes Already Fixed

### Tailwind v4 custom utilities
- Problem: custom colors declared in `@theme` did not reliably produce the utility variants the app used.
- Fix: explicit `@utility` blocks were added in `app/globals.css` for custom colors and rings.
- Rule: for Tailwind v4 custom colors/rings, add explicit `@utility` blocks for the classes the app depends on.

### Mojibake and unsafe UI text encoding
- Problem: several UI strings were written with corrupted or fancy Unicode characters and rendered as garbage.
- Fix: corrected affected strings to ASCII-safe forms where appropriate.
- Rule: default to ASCII in UI strings unless there is a clear, verified need for Unicode.

### Loading state not cleared on success
- Problem: client actions using `router.refresh()` left loading state stuck because success paths did not reset state.
- Fix: successful paths now call `setLoading(false)` after refresh where the issue was fixed.
- Rule: async UI handlers must clear loading state on both success and error paths.

### Event handlers in Server Components
- Problem: interactive handlers were placed in server-rendered files under `app/`, causing runtime failures.
- Fix: interactive pieces were extracted to client components or rewritten as CSS-only behavior.
- Rule: do not place event handlers in Server Components.

### Orphaned helpers after extraction
- Problem: helper functions were left behind after components were extracted, creating dead code.
- Fix: unused helpers were removed after extraction.
- Rule: after extracting or moving UI, delete orphaned helpers in the old file.

### SDK typing shortcuts
- Problem: env-backed SDK options tempted `any` casts.
- Fix: proper SDK types such as `InferenceProviderOrPolicy` were used instead.
- Rule: never use `as any` when a concrete SDK type exists.

### Signup flow bypassing the standard auth path
- Problem: admin-only signup caused confirmation and redirect problems across Supabase configurations.
- Fix: browser `signUp()` with PKCE and `/auth/callback` became the primary path; admin create-user is fallback only.
- Rule: use standard auth flows first; keep admin auth creation as an explicit fallback.

### Duplicate-email detection in Supabase signUp
- Problem: duplicate emails were not surfaced cleanly because Supabase can return an empty `identities[]` array.
- Fix: signup checks `data.user?.identities?.length === 0` and shows a helpful duplicate-account message.
- Rule: do not assume success from `signUp()` means a new account was created; inspect returned identities.

### Form input visibility and focus utilities
- Problem: form controls did not consistently inherit readable text color, and custom focus ring classes were missing.
- Fix: `input, textarea, select` color was set in `globals.css` and `ring-navy` utility was added.
- Rule: explicitly style form control text and custom focus-ring utilities instead of assuming inheritance.

### Viewport-height dashboard layout
- Problem: `min-h-screen` on admin layout/sidebar pushed persistent actions off-screen on long pages.
- Fix: dashboard layout uses `h-screen overflow-hidden`, a full-height sidebar, and scroll on the main pane.
- Rule: admin layouts should manage viewport height with a fixed container and a dedicated scroll region.

### Deterministic slug generation
- Problem: deterministic slugs from user names collided on unique constraints.
- Fix: slug generation adds a short random suffix.
- Rule: user-derived unique slugs need a collision-avoidance suffix unless uniqueness is checked transactionally.

### Missing concurrency guards on user-triggered async handlers
- Problem: repeated clicks triggered duplicate writes or requests.
- Fix: handlers now add early `if (saving/loading) return` guards where fixed.
- Rule: every user-triggered async handler needs a top-of-handler concurrency guard.

### Missing runtime request validation
- Problem: API routes trusted TypeScript-only request shapes.
- Fix: routes now validate required strings, IDs, and lengths at runtime where fixed.
- Rule: validate request bodies at runtime before DB or external API calls.

### Validation drift between forms and API routes
- Problem: client forms and API routes drifted because validation lived in ad hoc state checks instead of shared schemas.
- Fix: shared Zod schemas now live in `lib/schemas.ts` and are reused by React Hook Form and server routes.
- Rule: define reusable validation in shared Zod schemas and reuse it across client forms and server routes.

### Missing email-domain deliverability checks on direct signup paths
- Problem: direct server-side signup could create accounts for domains that cannot receive email.
- Fix: fallback signup now checks MX records before creating auth users.
- Rule: when a server route creates users directly, validate email-domain deliverability if the product depends on email.

### Width constraints without centering
- Problem: `max-w-*` was used without `mx-auto`, leaving intended centered content left-aligned.
- Fix: page wrappers that needed centering now pair `max-w-*` with `mx-auto`.
- Rule: if a bounded layout should be centered, pair `max-w-*` with `mx-auto`.

### Ownership checks omitted after auth
- Problem: authenticated users could access or act on records that were not scoped back to their agent.
- Fix: affected routes/pages now filter by `user_id` or `agent_id` after auth.
- Rule: authentication is not enough; verify ownership for protected reads and writes.

### Hosted deployment env drift
- Problem: local env files created a false sense of production configuration while hosted runtime envs were missing.
- Fix: deployment now requires the same critical env vars to be set in Vercel production settings.
- Rule: local `.env.*` files do not configure hosted runtimes; mirror required vars into the deployment platform.

## Project-Specific Current Issues
- `middleware.ts` still hard-fails if `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` is missing in the hosted runtime; there is no graceful fallback or clearer error path.
- `components/PropertyChat.tsx` still has no `AbortController` or timeout for the streaming fetch to `/api/chat`.
- Mojibake/non-ASCII UI text still exists in `components/GenerateButton.tsx`, `components/ContentTabs.tsx`, `components/PropertyChat.tsx`, and `app/dashboard/listings/[id]/page.tsx`.
- Rule 10 is not fully applied: `components/GenerateButton.tsx` and `components/GenerateImageButton.tsx` still lack top-of-handler concurrency guards.

## Architecture
- `middleware.ts` rebuilds a Supabase SSR client from request cookies and gates `/dashboard*`; signed-in users are redirected away from `/`, `/auth/login`, and `/auth/signup`.
- Browser auth lives in `app/auth/login/page.tsx` and `app/auth/signup/page.tsx`; session establishment is cookie-backed via Supabase auth.
- Primary signup flow is browser `signUp()` with `emailRedirectTo: <APP_URL>/auth/callback`; fallback admin signup lives in `app/api/auth/signup/route.ts`.
- `app/auth/callback/route.ts` exchanges the code for a session and creates the `agents` row from `user_metadata` if it does not already exist.
- `app/api/auth/resend-confirmation/route.ts` resends signup confirmation mail using the same callback URL.
- Dashboard pages use `createServerSupabaseClient()` and re-check `supabase.auth.getUser()` plus agent ownership.
- Client components use `createClient()` for profile updates, generated-content edits, uploads, and sign-out.
- `/api/generate` creates a listing for the authenticated agent, generates AI content, and inserts `generated_content`.
- `/api/generate/regenerate` verifies listing ownership through `agents!inner(user_id)` and inserts or updates `generated_content`.
- `/api/images/generate` verifies listing ownership, generates up to three images per call, uploads to `listing-photos`, and appends public URLs to `listings.photo_urls`.
- Public `/listing/[id]` renders active listings only, loads latest generated content, and embeds public chat and share/contact links.
- `/api/chat` is intentionally public, uses the service-role client, validates request input, reads active listing data, and streams Groq output.
- Stripe webhooks use the service-role client to update `agents.plan` and `stripe_customer_id`.

## Env Vars
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL for browser, middleware, and SSR clients
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key for browser auth and SSR session work
- `SUPABASE_SERVICE_ROLE_KEY` - server-only admin access for fallback signup, callback agent creation, webhooks, and public chat
- `NEXT_PUBLIC_APP_URL` - absolute app URL used for auth callback redirects and public listing links
- `GEMINI_API_KEY` - primary content-generation provider
- `GEMINI_MODEL` - optional Gemini model override
- `GROQ_API_KEY` - Groq chat provider and content-generation fallback
- `GROQ_MODEL` - optional Groq model override
- `HUGGINGFACE_API_KEY` - image-generation provider key
- `HF_IMAGE_MODEL` - optional preferred image model
- `HF_INFERENCE_PROVIDER` - optional Hugging Face provider override
- `STRIPE_SECRET_KEY` - Stripe server SDK auth
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signature verification
- `STRIPE_STARTER_PRICE_ID` - maps Stripe subscriptions to starter
- `STRIPE_PRO_PRICE_ID` - maps Stripe subscriptions to pro
- `STRIPE_AGENCY_PRICE_ID` - maps Stripe subscriptions to agency

## Rules
1. Read and update `memory.md` first; sync `codex.md` and `CLAUDE.md` after any reusable fix or rule change.
2. If the user reports a repeat mistake or says a prior fix was wrong, append to MISTAKE LOG before changing code.
3. Server components and API routes use `lib/supabase.ts`; client components use `lib/supabase-client.ts`.
4. After auth, verify ownership for protected reads and writes unless the route is intentionally public and tightly filtered.
5. Keep public listing access restricted to active listings/content only.
6. Use browser `signUp()` with explicit `emailRedirectTo` and `/auth/callback` as the primary signup path; keep admin signup as fallback only.
7. Hosted deploys must set required runtime env vars in Vercel or the target platform; local `.env.*` files are not enough.
8. Default to ASCII-safe UI strings unless a file intentionally needs Unicode and renders it correctly.
9. Async UI handlers must clear loading state on both success and error paths.
10. Every user-triggered async handler needs a top-of-handler concurrency guard.
11. Validate API request bodies at runtime before touching the DB or external APIs.
12. For Tailwind v4 custom colors/rings used by the app, add explicit `@utility` blocks in `app/globals.css`.
13. Pair `max-w-*` with `mx-auto` when a constrained layout should be centered.
14. Use viewport-height admin layout patterns (`h-screen`, bounded sidebar, scrollable main pane) instead of `min-h-screen` sidebars.
15. User-derived unique slugs need a randomness suffix or another real collision-avoidance strategy.
16. Define reusable validation in shared Zod schemas and reuse it across client forms and server routes.
17. When a server route creates users directly, validate email-domain deliverability if the product depends on email.

## Mistake Log

### 1. 2026-03-23 - Tailwind v4 custom utilities invisible
- What: custom theme colors did not produce the utility variants the UI relied on.
- Fix: explicit `@utility` blocks were added for custom colors.
- Rule: Rule 12.

### 2. 2026-03-23 - Mojibake in UI strings
- What: corrupted Unicode characters rendered as garbage in the interface.
- Fix: affected strings were rewritten with safe text.
- Rule: Rule 8.

### 3. 2026-03-23 - Loading state stuck after successful refresh
- What: success paths using `router.refresh()` did not reset loading state.
- Fix: loading reset was added after successful refresh.
- Rule: Rule 9.

### 4. 2026-03-23 - Event handlers in Server Components
- What: interactive handlers were placed in server-rendered files and caused runtime failures.
- Fix: interaction was moved to client components or CSS.
- Rule: Rule 3 plus the Server Component interaction rule in Reusable Mistakes.

### 5. 2026-03-23 - Orphaned helper left after extraction
- What: helper code was left behind after component extraction.
- Fix: dead helper code was removed.
- Rule: clean up helpers after extraction.

### 6. 2026-03-23 - Admin-only signup caused confirmation and redirect failures
- What: admin-only signup left users with confirmation problems and localhost redirects.
- Fix: PKCE signup plus `/auth/callback` became primary; admin signup became fallback.
- Rule: Rule 6.

### 7. 2026-03-24 - Form text invisible in some browsers
- What: form controls did not consistently inherit readable text color and custom focus ring utility was missing.
- Fix: explicit form-control color and `ring-navy` utility were added.
- Rule: form inputs need explicit text/focus utility support.

### 8. 2026-03-24 - Sidebar action pushed off-screen
- What: `min-h-screen` admin layout stretched with document height and pushed sidebar actions below the viewport.
- Fix: layout moved to a viewport-height container with scroll on the main area.
- Rule: Rule 14.

### 9. 2026-03-24 - Slug collisions broke signup
- What: deterministic slugs from repeated names hit the unique constraint.
- Fix: slug generation added a short random suffix.
- Rule: Rule 15.

### 10. 2026-03-24 - Missing concurrency guards on user actions
- What: repeated clicks could trigger duplicate save/generate requests.
- Fix: top-of-handler guards were added where caught.
- Rule: Rule 10.

### 11. 2026-03-24 - API routes trusted request types without runtime checks
- What: empty or malformed request data reached DB and external API code.
- Fix: runtime input validation was added where fixed.
- Rule: Rule 11.

### 12. 2026-03-24 - Centered layouts were left-aligned
- What: `max-w-*` was used without `mx-auto`.
- Fix: page wrappers that should be centered gained `mx-auto`.
- Rule: Rule 13.

### 13. 2026-03-24 - Protected listing detail missed ownership scoping
- What: an authenticated user could reach another agent's listing detail page by ID.
- Fix: listing lookup was filtered by the current agent.
- Rule: Rule 4.

### 14. 2026-03-24 - Middleware deployment crashed from missing hosted env vars
- What: hosted runtime was missing Supabase env vars, causing `MIDDLEWARE_INVOCATION_FAILED`.
- Fix: required vars were identified for Vercel production configuration.
- Rule: Rule 7.

### 15. 2026-03-24 - Client and server validation drifted out of sync
- What: login had moved to RHF plus Zod, but signup, profile, listing creation, and `/api/generate` still relied on hand-written validation and duplicated rules.
- Fix: `react-hook-form`, `@hookform/resolvers`, `zod`, and `libphonenumber-js` were installed; shared schemas moved into `lib/schemas.ts`; signup, profile, listing creation, and `/api/generate` now reuse them.
- Rule: Rule 16.

### 16. 2026-03-24 - Direct fallback signup accepted undeliverable email domains
- What: the fallback admin signup route could create users for domains with no MX records.
- Fix: `/api/auth/signup` now validates MX records before creating the auth user.
- Rule: Rule 17.
