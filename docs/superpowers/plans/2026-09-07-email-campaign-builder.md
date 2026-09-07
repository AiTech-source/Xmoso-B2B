# Email Campaign Builder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an admin campaign builder that lets Xmoso choose product models, generate a promotional email, send a test email, and copy production-ready HTML.

**Architecture:** Add a shared email campaign renderer under `src/lib/email`, authenticated route handlers under `src/app/api/email-campaign`, and an admin page under `src/app/admin/(protected)/campaigns`. The MVP reuses current product data and SMTP settings and does not add campaign database tables.

**Tech Stack:** Next.js 16 App Router, React 19, Supabase, Nodemailer, Tailwind CSS, Node verification scripts.

**Spec:** `docs/superpowers/specs/2026-09-07-email-campaign-builder-design.md`

## Global Constraints

- Use existing Supabase product tables and site settings.
- Do not add subscriber list management or bulk sending in the MVP.
- Do not add salesperson, region, or customer ownership tables in the MVP; reserve names and UI copy so those can be added cleanly in phase two.
- Test send is limited to one manually entered recipient per request.
- Generated product links must include UTM parameters.
- Admin-only APIs must use `getAdminUser` and `adminRequiredResponse`.
- Follow Next.js 16 route handler conventions from `node_modules/next/dist/docs/`.

---

### Task 1: Campaign Email Renderer

**Files:**
- Create: `src/lib/email/campaign.ts`
- Create: `scripts/test-email-campaign-renderer.mjs`

**Interfaces:**
- Produces: `CampaignProduct`, `CampaignInput`, `buildCampaignProductUrl(product, locale, campaignSlug)`, `buildCampaignEmailHtml(input)`, `buildCampaignPlainText(input)`.

- [ ] **Step 1: Write the failing verification script**

```js
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync("src/lib/email/campaign.ts", "utf8");
assert.match(source, /export interface CampaignProduct/);
assert.match(source, /export function buildCampaignProductUrl/);
assert.match(source, /utm_source=email/);
assert.match(source, /export function buildCampaignEmailHtml/);
assert.match(source, /table/);
assert.match(source, /View Product/);
console.log("Campaign renderer source checks passed.");
```

- [ ] **Step 2: Run the script to verify it fails**

Run: `node scripts\test-email-campaign-renderer.mjs`

Expected: FAIL because `src/lib/email/campaign.ts` does not exist.

- [ ] **Step 3: Implement `src/lib/email/campaign.ts`**

```ts
export interface CampaignProduct {
  id: string;
  slug: string;
  name: string;
  model_number: string;
  image: string;
  highlights: string[];
  description?: string;
}

export interface CampaignInput {
  subject: string;
  intro: string;
  locale: string;
  campaignSlug: string;
  products: CampaignProduct[];
}
```

Add HTML escaping, URL generation, UTM query generation, table-based email HTML, and plain text output.

- [ ] **Step 4: Run the script to verify it passes**

Run: `node scripts\test-email-campaign-renderer.mjs`

Expected: PASS.

### Task 2: Product Selection Preview API

**Files:**
- Create: `src/app/api/email-campaign/preview/route.ts`
- Modify: `scripts/test-email-campaign-renderer.mjs`

**Interfaces:**
- Consumes: `buildCampaignEmailHtml`, `buildCampaignPlainText`.
- Produces: `POST /api/email-campaign/preview` returning `{ html, text, products, subject }`.

- [ ] **Step 1: Extend the verification script**

Add checks for `getAdminUser`, `adminRequiredResponse`, `product_translations`, `buildCampaignEmailHtml`, and `buildCampaignPlainText` in the preview route.

- [ ] **Step 2: Run the script to verify it fails**

Run: `node scripts\test-email-campaign-renderer.mjs`

Expected: FAIL because the route does not exist.

- [ ] **Step 3: Implement preview route**

The route accepts:

```ts
{
  "locale": "en",
  "campaignSlug": "xmoso-selected-wine-coolers",
  "subject": "Selected Xmoso built-in wine coolers",
  "intro": "A short buyer-facing introduction.",
  "productIds": ["uuid-1", "uuid-2"]
}
```

It validates admin auth, fetches active products and translations, preserves selected order, renders HTML/text, and returns JSON.

- [ ] **Step 4: Run the script to verify it passes**

Run: `node scripts\test-email-campaign-renderer.mjs`

Expected: PASS.

### Task 3: SMTP Test Send API

**Files:**
- Create: `src/lib/email/smtp.ts`
- Create: `src/app/api/email-campaign/test-send/route.ts`
- Modify: `src/lib/email/send.ts`
- Modify: `scripts/test-email-campaign-renderer.mjs`

**Interfaces:**
- Produces: `sendHtmlEmailWithSettings(supabase, message)` returning `{ success: boolean; error?: string }`.
- Consumes: campaign preview route payload shape.

- [ ] **Step 1: Extend verification for reusable SMTP helper**

Check that `src/lib/email/smtp.ts` reads SMTP keys from `site_settings`, creates a Nodemailer transport, and sends `{ to, subject, html, text }`.

- [ ] **Step 2: Run the script to verify it fails**

Run: `node scripts\test-email-campaign-renderer.mjs`

Expected: FAIL because `smtp.ts` and `test-send/route.ts` do not exist.

- [ ] **Step 3: Implement reusable SMTP helper**

Move shared SMTP sending into `src/lib/email/smtp.ts`. Keep `sendInquiryEmail` behavior intact by calling the helper from `src/lib/email/send.ts`.

- [ ] **Step 4: Implement test-send route**

The route accepts preview fields plus `to`, validates admin auth, fetches selected products, renders campaign email, sends one message through SMTP, and returns `{ success, error }`.

- [ ] **Step 5: Run verification**

Run: `node scripts\test-email-campaign-renderer.mjs`

Expected: PASS.

### Task 4: Admin Campaign Builder UI

**Files:**
- Create: `src/app/admin/(protected)/campaigns/page.tsx`
- Modify: `src/components/admin/AdminSidebar.tsx`
- Modify: `scripts/test-email-campaign-renderer.mjs`

**Interfaces:**
- Consumes: `/api/products-by-type?locale={locale}`, `/api/email-campaign/preview`, `/api/email-campaign/test-send`.

- [ ] **Step 1: Extend verification for admin UI**

Check that the sidebar links to `/admin/campaigns`, the page fetches products, posts to preview, renders an iframe preview, supports copying HTML, and calls test-send.

- [ ] **Step 2: Run the script to verify it fails**

Run: `node scripts\test-email-campaign-renderer.mjs`

Expected: FAIL because the page and sidebar link are missing.

- [ ] **Step 3: Implement the admin page**

Use the existing admin layout style: fixed `AdminSidebar`, `ml-64`, dark panels, compact controls, and a product table. Add locale select, subject input, campaign slug input, intro textarea, product checkboxes, preview button, copy HTML button, test recipient input, and send test button.

- [ ] **Step 4: Add sidebar navigation**

Add `{ href: "/admin/campaigns", label: "Email Campaigns" }` near Products or SEO.

- [ ] **Step 5: Run verification**

Run: `node scripts\test-email-campaign-renderer.mjs`

Expected: PASS.

### Task 5: Final Verification

**Files:**
- No new files.

**Interfaces:**
- Verifies all previous tasks.

- [ ] **Step 1: Run campaign verification**

Run: `node scripts\test-email-campaign-renderer.mjs`

Expected: PASS.

- [ ] **Step 2: Run targeted lint**

Run: `npx eslint src/lib/email/campaign.ts src/lib/email/smtp.ts src/lib/email/send.ts src/app/api/email-campaign/preview/route.ts src/app/api/email-campaign/test-send/route.ts src/app/admin/(protected)/campaigns/page.tsx src/components/admin/AdminSidebar.tsx`

Expected: no errors in the new or modified campaign files. Existing unrelated warnings may remain if they are in already-dirty files.

- [ ] **Step 3: Run production build**

Run: `npm run build`

Expected: build exits 0.

- [ ] **Step 4: Manual smoke test**

Open `/admin/campaigns`, choose two products, generate preview, confirm product cards render, copy HTML, and send one test email to a controlled address.

## Self-Review

- Spec coverage: The plan covers product selection, HTML generation, one-recipient test send, UTM links, admin auth, and SMTP reuse.
- Placeholder scan: The plan contains no placeholder implementation fields.
- Type consistency: `CampaignProduct`, `CampaignInput`, and renderer function names are consistent across tasks.
