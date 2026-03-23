<!--
CLAUDE INSTRUCTIONS — READ EVERY SESSION:
1. Read this entire file before making any changes to this project
2. If the user says anything like "you messed up", "fix this again",
   "you already broke this", "wrong again", "i told you this before" —
   STOP and add a new entry to the MISTAKE LOG section before fixing anything
3. When adding a mistake log entry use today's date and auto-increment the number
4. After fixing, update the RULES section if a new rule should be derived
5. Never repeat a mistake that already exists in this file
-->

# ListingOS — Project Memory

## READ THIS BEFORE TOUCHING ANYTHING

This is a Next.js 15 SaaS real estate marketing platform. Several bugs have already been found and fixed. The rules and mistake log below exist to prevent repeating them. Read every section before writing a single line of code.

---

## MISTAKES ALREADY FIXED (do not repeat)

### Tailwind v4 custom colors not generating utility classes
- **WHAT WENT WRONG:** `bg-navy`, `text-gold`, `hover:bg-navy-light` etc. were defined in a `@theme` block but did not generate Tailwind utility classes with variant support (`hover:`, `focus:`, `disabled:`). The sidebar appeared white/invisible on screen.
- **HOW IT WAS FIXED:** Added explicit `@utility` directive blocks in `app/globals.css` for every custom color:
  ```css
  @utility bg-navy { background-color: #1a2e4a; }
  @utility text-gold { color: #c9a84c; }
  /* etc. */
  ```
- **RULE:** In Tailwind v4, custom colors defined in `@theme` do NOT automatically generate utility classes with full variant support. Always add `@utility` blocks for any custom color you need to use with `hover:`, `disabled:`, `focus:`, etc.

---

### UTF-8 encoding corruption in component text
- **WHAT WENT WRONG:** `components/GenerateImageButton.tsx` contained `'Generatingâ€¦'` — a Latin-1 ellipsis (`…`) that was read as UTF-8 bytes and displayed as garbage on screen.
- **HOW IT WAS FIXED:** Replaced the corrupted character with ASCII `'Generating...'`.
- **RULE:** Never use fancy Unicode characters (curly quotes, ellipsis `…`, em dashes `—`) in JSX string literals. Use ASCII equivalents (`...`, `-`, `'`) or HTML entities (`&hellip;`, `&mdash;`).

---

### `setLoading(false)` missing on success path
- **WHAT WENT WRONG:** Both `GenerateImageButton.tsx` and `GenerateButton.tsx` only called `setLoading(false)` inside the `catch` block. On a successful API response, `router.refresh()` was called but loading state was never reset — the button stayed stuck in a spinner forever.
- **HOW IT WAS FIXED:** Added `setLoading(false)` immediately after `router.refresh()` in the `try` block of both components.
- **RULE:** `router.refresh()` is non-blocking and does NOT reset React component state. Always explicitly call `setLoading(false)` in BOTH the success path AND the catch block. The pattern is:
  ```ts
  router.refresh()
  setLoading(false)   // required on success
  } catch (err) {
    setError(...)
    setLoading(false) // required on error
  }
  ```

---

### Event handlers (`onMouseEnter`/`onMouseLeave`) in Server Components
- **WHAT WENT WRONG:** `app/dashboard/page.tsx` (a Server Component) contained an inline `ListingCard` function and a `Link` component, both using `onMouseEnter`/`onMouseLeave` JS event handlers. Next.js crashed at runtime: *"Event handlers cannot be passed to Client Component props"*. Same issue appeared on the breadcrumb `Link` in `app/dashboard/listings/[id]/page.tsx`.
- **HOW IT WAS FIXED:**
  1. Extracted the inline `ListingCard` into `components/ListingCard.tsx` with `'use client'` directive.
  2. Replaced JS hover on buttons/links in server pages with CSS-only hover via Tailwind classes or named CSS classes (`.btn-gold`, `.breadcrumb-back`) defined in `globals.css`.
- **RULE:** Server Components cannot contain ANY JavaScript event handlers (`onClick`, `onMouseEnter`, `onChange`, etc.). If you need hover/click behavior, either: (a) extract the element into a separate `'use client'` component, or (b) use pure CSS hover via Tailwind/CSS classes.

---

### Dead code left after component extraction
- **WHAT WENT WRONG:** After `ListingCard` was extracted to its own component, the `formatPrice` helper function that was only used by the inline `ListingCard` was left orphaned in `app/dashboard/page.tsx`.
- **HOW IT WAS FIXED:** Deleted the orphaned `formatPrice` function from `dashboard/page.tsx` (it still exists in `listings/[id]/page.tsx` where it is still used).
- **RULE:** When extracting a component, always check if any helper functions defined above it in the same file become unused. Delete them.

---

### `as any` cast on Hugging Face provider parameter
- **WHAT WENT WRONG:** The HF InferenceClient `provider` parameter type was `string` in the original HF SDK, causing a TypeScript error when passing the env var.
- **HOW IT WAS FIXED:** Cast as `InferenceProviderOrPolicy` (the actual SDK type) instead of `as any`:
  ```ts
  const HF_INFERENCE_PROVIDER =
    (process.env.HF_INFERENCE_PROVIDER as InferenceProviderOrPolicy) || 'hf-inference'
  ```
- **RULE:** Never use `as any`. Find and import the proper type from the SDK.

---

## CURRENT KNOWN ISSUES

### M1 — No ownership check in `/api/generate`
- **File:** `app/api/generate/route.ts`
- **Issue:** No verification that the authenticated user owns the `agent_id` from the request body. A malicious authenticated user could create listings under another user's agent.
- **Fix:** After `getUser()`, query `agents` table to confirm `agents.user_id === user.id` for the given `agent_id`.

### M2 — No input validation in `/api/chat`
- **File:** `app/api/chat/route.ts`
- **Issue:** `message` and `listing_id` are read from request body with no type, length, or emptiness checks.
- **Fix:** Validate `message` is a non-empty string under ~1000 chars; validate `listing_id` is present.

### M3 — Race condition on ContentTabs save
- **File:** `components/ContentTabs.tsx`
- **Issue:** No guard against multiple concurrent save requests. Rapid clicking triggers simultaneous Supabase writes.
- **Fix:** Add `if (saving) return` guard at the top of `handleSave()`.

### M4 — `NEXT_PUBLIC_APP_URL` rendered without fallback
- **File:** `components/ProfileForm.tsx`
- **Issue:** `{process.env.NEXT_PUBLIC_APP_URL}/agent/` renders as `undefined/agent/slug` if the env var is missing.
- **Fix:** `{process.env.NEXT_PUBLIC_APP_URL ?? 'https://yourdomain.com'}/agent/`

### L1 — "Content Generated" stat is misleading
- **File:** `app/dashboard/page.tsx`
- **Issue:** Content count stat duplicates total listings count rather than querying actual `generated_content` rows.
- **Fix:** Query `generated_content` count separately filtered by the agent's listing IDs.

### L2 — No abort/timeout on PropertyChat streaming fetch
- **File:** `components/PropertyChat.tsx`
- **Issue:** Streaming fetch has no `AbortController` timeout. If `/api/chat` hangs, user is stuck forever.
- **Fix:** Add a 30s `AbortController` timeout around the fetch.

---

## ARCHITECTURE

### Tech Stack
- **Framework:** Next.js 15 (App Router), React 19, TypeScript strict mode
- **Styling:** Tailwind v4 (CSS-first config in `app/globals.css`)
- **Database:** Supabase (PostgreSQL with RLS)
- **Auth:** Supabase Auth (email/password)
- **AI — Content:** Google Gemini 2.0 Flash (primary) → Groq llama-3.3-70b-versatile (fallback on quota)
- **AI — Images:** Hugging Face Inference API
- **AI — Chat:** Groq llama-3.3-70b-versatile (streaming)
- **Payments:** Stripe (subscriptions, webhook-driven plan updates)
- **Email:** Resend (imported, not yet wired into any route)

### Supabase Client Split — CRITICAL

There are TWO Supabase client files. Using the wrong one causes runtime errors.

| File | Export | When to use |
|------|--------|-------------|
| `lib/supabase.ts` | `createServerSupabaseClient()` | Server Components, API routes (user-scoped queries) |
| `lib/supabase.ts` | `createAdminClient()` | API routes needing RLS bypass (signup, webhooks, chat) |
| `lib/supabase-client.ts` | `createClient()` | `'use client'` components ONLY |

**Never import `lib/supabase.ts` in a client component. Never import `lib/supabase-client.ts` in a server component or API route.**

### Authentication Flow
1. **Signup:** Form → `POST /api/auth/signup` → admin client creates auth user with `email_confirm: true` + agent record → redirect to login
2. **Login:** Browser client (`createClient()`) → `supabase.auth.signInWithPassword()` → redirect to `/dashboard`
3. **Middleware:** `middleware.ts` reads cookies → guards all `/dashboard/*` routes → redirects anon to `/auth/login`
4. **Server page auth:** Every server page calls `supabase.auth.getUser()` → redirect if null → query agent to verify ownership

### Content Generation Flow
```
NewListingForm → POST /api/generate
  → insert listing (createServerSupabaseClient)
  → generateListingContent() in lib/gemini.ts
      → Gemini 2.0 Flash (primary)
      → Groq llama-3.3-70b-versatile (fallback if quota hit)
  → insert generated_content
  → return listing ID → redirect to /dashboard/listings/[id]
```

### Image Generation Flow
```
GenerateImageButton → POST /api/images/generate
  → Hugging Face InferenceClient.textToImage()
  → upload to Supabase storage bucket: listing-photos
  → update listings.photo_urls array
  → return new URLs → router.refresh() + setLoading(false)
```

### Chat Flow (streaming)
```
PropertyChat → POST /api/chat (streaming)
  → createAdminClient (bypass RLS for public listing read)
  → Groq llama-3.3-70b-versatile streaming
  → TextEncoder → ReadableStream → TextDecoder on client
```

### Database Tables
- **`agents`** — one per user; profile, plan, Stripe subscription ID, slug
- **`listings`** — many per agent; property details + `photo_urls` array
- **`generated_content`** — one per listing (latest); 6 fields: MLS, Instagram, Facebook, email, WhatsApp, TikTok

### Next.js 15 Required Patterns
```ts
// params is a Promise — always await it
const { id } = await params

// cookies() is async — always await it
const cookieStore = await cookies()
```

### Tailwind v4 Config
- Design tokens in `app/globals.css` under `:root` CSS variables
- Custom utility classes use `@utility` directive (NOT `@theme` alone)
- Dark luxury theme: background `#0a0a0f`, surface `#13131a`, primary gold `#c9a84c`
- Navy: `#1a2e4a`, navy-light: `#243d63`

### Route Map
| Route | Auth |
|-------|------|
| `/` | public (redirects to /auth/login) |
| `/auth/login`, `/auth/signup` | public |
| `/dashboard` | required |
| `/dashboard/listings/new` | required |
| `/dashboard/listings/[id]` | required |
| `/dashboard/profile` | required |
| `/dashboard/billing` | required |
| `/listing/[id]` | public (active listings only) |
| `POST /api/generate` | required |
| `POST /api/generate/regenerate` | required |
| `POST /api/chat` | public |
| `POST /api/images/generate` | required |
| `POST /api/webhooks/stripe` | Stripe signature |
| `POST /api/auth/signup` | public |

### `lib/claude.ts`
This is a backward-compatibility stub that re-exports from `lib/gemini.ts`. There is NO Anthropic/Claude API integration. Do not assume it calls the Claude API.

---

## ENVIRONMENT VARIABLES

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✓ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✓ | Supabase anon key (safe for browser) |
| `SUPABASE_SERVICE_ROLE_KEY` | ✓ | Admin key — server/API only, NEVER expose to browser |
| `NEXT_PUBLIC_APP_URL` | ✓ | Full app URL e.g. `https://listingos.com` — add `?? 'fallback'` everywhere used |
| `GEMINI_API_KEY` | ✓ | Google AI key — falls back to Groq on quota exhaustion |
| `GEMINI_MODEL` | optional | Overrides model (default: `gemini-2.0-flash`) |
| `GROQ_API_KEY` | ✓ | Groq key for fallback content generation + chat streaming |
| `GROQ_MODEL` | optional | Override Groq model (default: `llama-3.3-70b-versatile`) |
| `HUGGINGFACE_API_KEY` | ✓ | HF key for image generation |
| `HF_IMAGE_MODEL` | optional | Override HF model ID |
| `HF_INFERENCE_PROVIDER` | optional | HF provider (default: `hf-inference`) |
| `STRIPE_SECRET_KEY` | ✓ | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | ✓ | Stripe webhook signing secret |
| `STRIPE_STARTER_PRICE_ID` | ✓ | Stripe price ID for Starter plan |
| `STRIPE_PRO_PRICE_ID` | ✓ | Stripe price ID for Pro plan |
| `STRIPE_AGENCY_PRICE_ID` | ✓ | Stripe price ID for Agency plan |
| `RESEND_API_KEY` | optional | Resend email key — not currently used in any route |

---

## RULES FOR THIS PROJECT

1. **Never put event handlers in Server Components.** Any file in `app/` without `'use client'` is a Server Component. Extract interactive elements into separate `'use client'` files in `components/`.

2. **Always call `setLoading(false)` in both the success AND catch paths.** `router.refresh()` does not reset component state.

3. **Use `@utility` blocks in `globals.css` for ALL custom Tailwind colors.** The `@theme` block alone does not generate hover/focus/disabled variants in Tailwind v4.

4. **Never use `as any`.** Import and use the proper type from the SDK. If unavoidable, use `as unknown as TargetType` with a comment.

5. **Server files import from `lib/supabase.ts`. Client components import from `lib/supabase-client.ts`.** Mixing these causes auth session bugs or build failures.

6. **Always verify ownership, not just authentication.** After `getUser()`, confirm `agents.user_id === user.id` before any write.

7. **Always `await params`** in dynamic route pages (`const { id } = await params`). It is a Promise in Next.js 15.

8. **Never use Unicode special characters in JSX string literals** (curly quotes, `…`, `—`). Use ASCII (`...`, `-`) or HTML entities (`&hellip;`).

9. **Read a file before editing it.** The Edit tool requires the file to have been read in the current session.

10. **`NEXT_PUBLIC_APP_URL` needs a fallback** everywhere it is rendered: `process.env.NEXT_PUBLIC_APP_URL ?? 'https://yourdomain.com'`.

11. **Stripe is lazy-initialized** via `getStripe()` in `lib/stripe.ts`. Never call `new Stripe(...)` at module top level.

12. **When extracting a component, delete any helpers that become orphaned** in the original file.

13. **Supabase signup must use standard PKCE `signUp()` as primary, admin bypass only as fallback.** Admin-only bypass (`email_confirm: true`) is unreliable across Supabase project configs and leaves users stuck. Always set `emailRedirectTo` to `NEXT_PUBLIC_APP_URL + '/auth/callback'`. The `/auth/callback` route handles code exchange + agent creation. Admin bypass is only triggered when the email rate limit is hit.

14. **Supabase Dashboard must have the correct Site URL and Allowed Redirect URLs.** Go to Auth → URL Configuration. Set Site URL to production URL. Add `<APP_URL>/auth/callback` to Redirect URLs. Without this, `emailRedirectTo` is rejected or defaults to localhost.

15. **`signUp()` returns empty `identities[]` for duplicate emails** — Supabase does not reveal if an email exists. Always check `data.user?.identities?.length === 0` and show a helpful "already registered" message.

---

## SIGNUP AUTH FLOW (current implementation)

```
Primary (standard PKCE):
  signup/page.tsx → supabase.auth.signUp({ emailRedirectTo: APP_URL/auth/callback, data: { full_name, phone } })
  → if identities[] empty → "Email already registered"
  → if success → show "Check your email" screen
  → user clicks email link → GET /auth/callback?code=xxx
    → exchangeCodeForSession(code)
    → check agents table → if no agent → create from user_metadata
    → redirect /dashboard

Fallback (email quota exceeded):
  signup/page.tsx → POST /api/auth/signup (admin bypass)
  → admin.createUser({ email_confirm: true, user_metadata })
  → insert agent record
  → return { ok: true }
  → client signInWithPassword → redirect /dashboard

Stuck users (login "Email not confirmed"):
  login/page.tsx → shows "Resend confirmation email" button
  → POST /api/auth/resend-confirmation
  → supabase.auth.resend({ type: 'signup', email, options: { emailRedirectTo } })
  → user confirms → /auth/callback → /dashboard
```

---

## MISTAKE LOG

### 1. 2026-03-23 — Tailwind v4 custom colors invisible
- **SPOTTED BY:** user (screenshot showing white sidebar)
- **WHAT HAPPENED:** `bg-navy`, `text-gold` etc. defined in `@theme` did not generate utility classes with variant support in Tailwind v4
- **FIX APPLIED:** Added `@utility` directive blocks in `globals.css` for all custom colors
- **RULE ADDED:** Rule #3

### 2. 2026-03-23 — UTF-8 mojibake in button text
- **SPOTTED BY:** user ("Generatingâ€¦ wtf is this?")
- **WHAT HAPPENED:** `GenerateImageButton.tsx` had a Latin-1 ellipsis rendered as garbage
- **FIX APPLIED:** Replaced with ASCII `'Generating...'`
- **RULE ADDED:** Rule #8

### 3. 2026-03-23 — Generate button stuck in loading state after success
- **SPOTTED BY:** user (button never reset after image/content generation)
- **WHAT HAPPENED:** `setLoading(false)` only in catch block in both `GenerateImageButton.tsx` and `GenerateButton.tsx`
- **FIX APPLIED:** Added `setLoading(false)` after `router.refresh()` in both components
- **RULE ADDED:** Rule #2

### 4. 2026-03-23 — Runtime crash: event handlers in Server Component
- **SPOTTED BY:** user (Next.js runtime error in browser)
- **WHAT HAPPENED:** `onMouseEnter`/`onMouseLeave` used inside server components `dashboard/page.tsx` and `listings/[id]/page.tsx`
- **FIX APPLIED:** Extracted `ListingCard` to `components/ListingCard.tsx` ('use client'). Replaced JS hover with CSS classes `.btn-gold` and `.breadcrumb-back`
- **RULE ADDED:** Rule #1

### 5. 2026-03-23 — Dead `formatPrice` left after component extraction
- **SPOTTED BY:** self (QA audit)
- **WHAT HAPPENED:** `formatPrice` in `dashboard/page.tsx` orphaned after `ListingCard` extraction
- **FIX APPLIED:** Deleted the dead function
- **RULE ADDED:** Rule #12

### 6. 2026-03-23 — Admin-only signup caused "Email not confirmed" + localhost redirect
- **SPOTTED BY:** user (screenshot: "Email not confirmed" error; email link pointing to localhost:3000)
- **WHAT HAPPENED:** (1) Admin bypass with `email_confirm: true` doesn't work for all Supabase project configs — users left unable to log in. (2) No `emailRedirectTo` ever set, so confirmation emails used the Supabase project's Site URL which was `http://localhost:3000`. (3) No resend mechanism for stuck users. (4) Duplicate email silently returned empty identities — not handled.
- **FIX APPLIED:** Switched primary to standard PKCE `signUp()` in browser client with explicit `emailRedirectTo`. Admin bypass is now fallback only (quota exceeded). Created `/auth/callback/route.ts` for code exchange + agent creation. Added resend UI + `/api/auth/resend-confirmation`. Added empty-identities detection.
- **RULE ADDED:** Rules #13, #14, #15
