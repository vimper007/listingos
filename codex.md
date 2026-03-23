<!-- 
CODEX INSTRUCTIONS — READ EVERY SESSION:

1. Always read this file before making changes

2. When modifying the codebase:
   - Update ONLY affected sections
   - Do NOT rewrite the whole file

3. If new patterns or fixes appear:
   - Add to "MISTAKES ALREADY FIXED" OR "RULES"

4. If user indicates a mistake:
   - Add entry to MISTAKE LOG BEFORE fixing

5. Keep this file LEAN:
   - Remove outdated info
   - Merge duplicates
   - Prefer rules over long explanations

6. If a section grows too large:
   - Summarize it
   - Keep only actionable insights

7. Never repeat a known mistake

-->

# ListingOS - Codex Memory

## ⚠️ CRITICAL CONTEXT
- Project root is `listingos/`; do not create memory files in `c:\Code\SAAS`.
- App uses Next.js App Router (`next@16.2.1`), React 19, strict TypeScript.
- Supabase access is split three ways: SSR user client in [`lib/supabase.ts`](./lib/supabase.ts), browser client in [`lib/supabase-client.ts`](./lib/supabase-client.ts), service-role helper in [`lib/supabase.ts`](./lib/supabase.ts).
- Signup bypasses email confirmation by calling admin `createUser({ email_confirm: true })` in [`app/api/auth/signup/route.ts`](./app/api/auth/signup/route.ts).
- Public property pages depend on RLS policies that expose only active listings and generated content from [`supabase/migrations/001_initial.sql`](./supabase/migrations/001_initial.sql).
- Photo uploads happen client-side before listing creation and use a public `listing-photos` bucket.
- Content generation is Gemini-first with Groq fallback; image generation uses Hugging Face; property chat uses Groq streaming.
- [`lib/claude.ts`](./lib/claude.ts) is only a compatibility re-export to Gemini code, not Anthropic integration.

## 🔁 MISTAKES ALREADY FIXED

### GenerateImageButton loading reset
- PROBLEM: `router.refresh()` alone does not clear client loading state.
- FIX: [`GenerateImageButton.tsx`](./components/GenerateImageButton.tsx) resets loading after successful refresh.
- RULE: Clear loading in explicit success and error paths.

### Hugging Face provider typing
- PROBLEM: provider env values need SDK typing.
- FIX: [`app/api/images/generate/route.ts`](./app/api/images/generate/route.ts) casts to `InferenceProviderOrPolicy` instead of using `any`.
- RULE: Use concrete SDK types for env-backed options.

### Claude naming ambiguity
- PROBLEM: `lib/claude.ts` name can imply Anthropic support.
- FIX: file explicitly re-exports Gemini helpers only.
- RULE: Do not assume Anthropic/Claude behavior unless real code calls it.

## ⚠️ CURRENT ISSUES
- [`components/ProfileForm.tsx`](./components/ProfileForm.tsx) renders `NEXT_PUBLIC_APP_URL` without fallback.
- [`app/listing/[id]/page.tsx`](./app/listing/[id]/page.tsx) renders share URL from `NEXT_PUBLIC_APP_URL` without fallback.
- [`app/api/chat/route.ts`](./app/api/chat/route.ts) has no request-shape or length validation for `message` / `listing_id`.
- [`app/api/auth/signup/route.ts`](./app/api/auth/signup/route.ts) generates `slug = <name>-realty` with no collision handling against the unique `agents.slug` constraint.
- [`supabase/migrations/001_initial.sql`](./supabase/migrations/001_initial.sql) storage policies allow any authenticated user to insert/update/delete any object in `listing-photos`; path ownership is not enforced.
- Repo UI text still contains mojibake in multiple files; keep new strings ASCII unless the file already uses valid Unicode intentionally.

## 🧠 ARCHITECTURE (LEAN)
- Signup page posts to `/api/auth/signup`; route uses service-role client to create auth user and `agents` row, sets trial plan and `trial_ends_at`.
- Signup then signs the user in client-side with `supabase.auth.signInWithPassword()` and redirects to `/dashboard`.
- Login is browser-only auth via [`app/auth/login/page.tsx`](./app/auth/login/page.tsx); session is cookie-backed.
- [`middleware.ts`](./middleware.ts) rebuilds an SSR Supabase client from request cookies and guards `/dashboard*`; signed-in users are redirected away from `/`, `/auth/login`, and `/auth/signup`.
- Dashboard server pages still call `supabase.auth.getUser()` and fetch the current `agents` row by `user_id`.
- Client components write directly to Supabase for profile updates, content edits, storage uploads, and sign-out.
- `/api/generate` verifies `agent_id` ownership with the user-scoped SSR client, inserts `listings`, generates AI content, then inserts `generated_content`.
- `/api/generate/regenerate` verifies listing ownership through `agents!inner(user_id)` and inserts or updates `generated_content`.
- `/api/images/generate` verifies listing ownership, generates up to 3 images per call, uploads them to `listing-photos`, then appends public URLs to `listings.photo_urls`.
- Public `/listing/[id]` reads only active listings, latest generated content, and the linked agent; it also embeds public chat and share/contact links.
- `/api/chat` is intentionally public and uses the admin client to read active listing data plus latest MLS text before streaming Groq output.
- Stripe webhooks use the admin client to update `agents.plan` and `stripe_customer_id`.
- Storage is public-read; image URLs are stored as public URLs, not signed URLs.

## 🔐 ENV VARS (ESSENTIAL ONLY)
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL for browser and SSR clients
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - anon key for browser and SSR auth/session work
- `SUPABASE_SERVICE_ROLE_KEY` - server-only admin access for signup, webhooks, and public chat
- `NEXT_PUBLIC_APP_URL` - absolute app URL used in profile and listing share links
- `GEMINI_API_KEY` - primary content-generation provider
- `GEMINI_MODEL` - optional Gemini model override
- `GROQ_API_KEY` - Groq fallback for content generation and chat
- `GROQ_MODEL` - optional Groq model override
- `HUGGINGFACE_API_KEY` - image-generation provider key
- `HF_IMAGE_MODEL` - optional preferred text-to-image model
- `HF_INFERENCE_PROVIDER` - optional Hugging Face inference provider override
- `STRIPE_SECRET_KEY` - Stripe server SDK auth
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signature verification
- `STRIPE_STARTER_PRICE_ID` - maps Stripe subscription to starter plan
- `STRIPE_PRO_PRICE_ID` - maps Stripe subscription to pro plan
- `STRIPE_AGENCY_PRICE_ID` - maps Stripe subscription to agency plan

## 📏 RULES (NON-NEGOTIABLE)
1. Write agent memory files in `listingos/` root only.
2. Server components and API routes use `lib/supabase.ts`; client components use `lib/supabase-client.ts`.
3. After auth, verify ownership before writes unless the route is intentionally public and tightly filtered.
4. Keep public listing access restricted to active listings/content only.
5. Treat `lib/claude.ts` as a Gemini compatibility shim, not a real Claude integration.
6. Keep new UI strings ASCII unless valid Unicode is already clearly intentional in that file.
7. Do not assume `NEXT_PUBLIC_APP_URL` is defined when rendering share/profile URLs.
8. Any storage change must account for the current bucket-wide authenticated write policy.

## 🧾 MISTAKE LOG
