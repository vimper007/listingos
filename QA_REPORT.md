# QA Report - ListingOS

Date: 2026-03-23 (Asia/Colombo)

## Scope
Static code review across auth, dashboard, listings, storage, and API routes. Limited local checks only.

### Limitations
- Browser E2E not executed (no configured Supabase project, Stripe, Gemini, or Groq keys in this environment).
- `npm run lint` could not be executed because PowerShell script execution is disabled on this machine.

## Summary
- Blockers: 4
- High: 2
- Medium: 4
- Low/UX: 5

## Blockers

### 1) Email confirmation flow missing if Supabase requires it
**Files:** `app/auth/signup/page.tsx`, `app/api/auth/signup/route.ts`, `middleware.ts`  
**What happens:** The UI has no email confirmation or resend flow. If Supabase has email confirmation enabled and the admin signup path fails (missing `SUPABASE_SERVICE_ROLE_KEY`, misconfigured project, or API error), users cannot confirm and will get auth/RLS errors when trying to proceed.  
**Expected:** Either enforce auto-confirm consistently or provide confirmation and resend flows.  
**Actual:** Users can get stuck without a path to confirm, leading to login failures and downstream RLS errors.  
**Notes:** The current signup flow relies entirely on `admin.auth.admin.createUser({ email_confirm: true })`.

### 2) Image uploads fail unless bucket/policies are manually created
**Files:** `supabase/migrations/001_initial.sql`, `components/NewListingForm.tsx`  
**What happens:** The app assumes a public `listing-photos` bucket exists and the listed policies are applied. If the bucket is not created or policies aren’t applied, uploads fail.  
**Expected:** Storage setup is automated or surfaced in setup docs/UI checks.  
**Actual:** Uploads error until manual SQL and bucket creation are performed.

### 3) Content generation failure leaves listing unrecoverable
**Files:** `app/api/generate/route.ts`, `app/dashboard/listings/[id]/page.tsx`, `app/api/generate/regenerate/route.ts`  
**What happens:** If Gemini generation fails (missing `GEMINI_API_KEY`, model error, JSON parse failure), the listing is still created but `generated_content` is not. The detail page shows “No content generated yet” with no regenerate button. `/api/generate/regenerate` also fails because it expects an existing `generated_content` row.  
**Expected:** Either rollback the listing on failure or allow regeneration to create the missing content.  
**Actual:** Listing is stuck without recoverability.

### 4) Slug collisions can block signup
**Files:** `app/api/auth/signup/route.ts`, `supabase/migrations/001_initial.sql`  
**What happens:** `slug` is `UNIQUE` and generated as `${fullName}-realty`. Any duplicate full name (or names that collapse to the same slug) causes signup failure, then the created auth user is deleted.  
**Expected:** Unique slug generation with retries or a user-editable slug.  
**Actual:** Signup fails for common/duplicate names or non‑latin names that reduce to empty/short slugs.

## High

### 5) RLS allows any authenticated user to read any active listing/content
**Files:** `supabase/migrations/001_initial.sql`, `app/dashboard/listings/[id]/page.tsx`  
**What happens:** The “public read active” policies apply to all roles (Postgres `public`), which includes authenticated users. A logged‑in user can read any active listing and its generated content by ID, including in dashboard routes.  
**Expected:** Owner‑only access in dashboard; public access only for anonymous/public pages.  
**Actual:** Active listings are globally readable to any authenticated user.

### 6) Storage policies allow cross‑user update/delete in `listing-photos`
**Files:** `supabase/migrations/001_initial.sql`  
**What happens:** Policies only check `bucket_id`, not ownership/path or `auth.uid()`. Any authenticated user can update or delete any object in the bucket.  
**Expected:** Users can only modify their own files (e.g., prefix by `auth.uid()` or agent id and check it).  
**Actual:** No ownership enforcement.

## Medium

### 7) Billing upgrade flow is non‑functional
**Files:** `app/dashboard/billing/page.tsx`  
**What happens:** Upgrade buttons have no action; there is no checkout session creation or Stripe redirect.  
**Expected:** Buttons create a checkout session and redirect to Stripe.  
**Actual:** Buttons do nothing.

### 8) Stripe webhook may not update plan on first subscription
**Files:** `app/api/webhooks/stripe/route.ts`  
**What happens:** Subscription events update by `stripe_customer_id`, but that field is only set later in `checkout.session.completed`. If subscription events arrive first, the plan update is a no‑op.  
**Expected:** Reliable plan updates on the first successful checkout.  
**Actual:** Plan can stay `trial` even after payment.

### 9) API input validation gaps can cause DB errors
**Files:** `app/api/generate/route.ts`, `components/NewListingForm.tsx`  
**What happens:** Numeric fields are parsed with `parseFloat/parseInt` and sent without validation. Invalid inputs yield `NaN`, leading to insert failures or bad data.  
**Expected:** Server‑side validation and clear error messages.  
**Actual:** Unclear failures or invalid values.

### 10) Missing agent public page route
**Files:** `components/ProfileForm.tsx`  
**What happens:** Profile shows a public URL `.../agent/{slug}`, but there is no `/agent/[slug]` route.  
**Expected:** A public agent page exists or the UI doesn’t claim one.  
**Actual:** Link is a dead end (404).

## Low / UX

### 11) Regenerate/save errors are silent
**Files:** `components/ContentTabs.tsx`  
**What happens:** Regenerate failures are only logged to console; users see no error.  
**Expected:** Visible error state.  
**Actual:** Silent failures.

### 12) File input edge cases and leaks
**Files:** `components/NewListingForm.tsx`  
**What happens:**  
- Selecting the same file again won’t trigger `onChange`.  
- Preview URLs dropped due to the 10‑file cap aren’t revoked.  
**Expected:** Clean handling for re‑selection and proper cleanup.  
**Actual:** Minor UX issues and potential memory leak.

### 13) Orphaned photos if generation fails
**Files:** `components/NewListingForm.tsx`, `app/api/generate/route.ts`  
**What happens:** Photos are uploaded before `/api/generate` runs. If generation fails, photos are left in storage with no listing.  
**Expected:** Cleanup on failure or upload after successful listing creation.  
**Actual:** Orphans in storage.

### 14) `NEXT_PUBLIC_APP_URL` not required but used in UI
**Files:** `components/ProfileForm.tsx`, `app/listing/[id]/page.tsx`  
**What happens:** If `NEXT_PUBLIC_APP_URL` is missing, UI prints `undefined/...`.  
**Expected:** Safe fallback or validation.  
**Actual:** Broken URLs in UI.

### 15) Chat errors are generic
**Files:** `components/PropertyChat.tsx`, `app/api/chat/route.ts`  
**What happens:** User sees a generic error message on chat failures (missing `GROQ_API_KEY`, rate limits, etc.).  
**Expected:** Actionable guidance or retry messaging.  
**Actual:** Generic failure.

## Suggested E2E Checklist (manual)
1. Sign up with a fresh email and confirm the dashboard loads.  
2. Create a listing with 1–3 photos and verify storage URLs render.  
3. Verify generated content appears and can be saved/edited.  
4. Regenerate content and ensure it updates.  
5. Open the public listing page and verify contact links work.  
6. Attempt to access another user’s listing ID (should be denied).  
7. Run through billing upgrade flow (should create Stripe checkout).  
8. Verify Stripe webhooks update plan and trial status.
