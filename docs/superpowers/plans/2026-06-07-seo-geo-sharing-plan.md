# DeepCool SEO/GEO/Sharing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add SEO meta tags, JSON-LD schema, sitemap, FAQ system, installation media, and social sharing to the DeepCool B2B wine cooler website.

**Architecture:** Three independent phases — (1) SEO infrastructure across all pages, (2) GEO/AI-optimized FAQ + installation guide system with database, (3) social share/follow components with admin configuration. Each phase produces working, independently deployable changes.

**Tech Stack:** Next.js 16.2 (App Router), Supabase (PostgreSQL), TypeScript, Tailwind CSS v4

---

## File Structure

### Phase 1 — SEO Infrastructure

**New files:**
- `src/app/sitemap.ts` — Dynamic sitemap generation
- `public/robots.txt` — Robots configuration
- `src/lib/seo/json-ld.ts` — JSON-LD generation helpers
- `src/app/api/settings/route.ts` — (modify) Add meta verification fields

**Modified files:**
- `src/app/layout.tsx` — Root layout SEO defaults + verification meta
- `src/app/[locale]/layout.tsx` — Locale layout SEO defaults
- `src/app/[locale]/products/[slug]/page.tsx` — Product schema + meta tags
- `src/app/[locale]/products/page.tsx` — Category page meta
- `src/app/[locale]/page.tsx` — Home page schema + meta
- `src/app/[locale]/about/page.tsx` — About page schema + meta
- `src/app/[locale]/contact/page.tsx` — Contact page schema + meta
- `src/app/admin/pages/page.tsx` — Admin SEO fields
- `src/app/admin/settings/page.tsx` — (modify) Add meta verification inputs

### Phase 2 — GEO + FAQ + Installation

**New files:**
- `supabase/migrations/023_faq_items.sql` — FAQ table
- `src/app/[locale]/faq/page.tsx` — FAQ frontend page
- `src/app/api/faq/route.ts` — FAQ API endpoint
- `src/app/admin/faq/page.tsx` — FAQ admin manager
- `src/components/faq/FaqAccordion.tsx` — FAQ accordion component
- `supabase/migrations/024_installation_media.sql` — Installation media column
- `src/components/products/InstallationMedia.tsx` — Installation media component

**Modified files:**
- `src/components/admin/AdminSidebar.tsx` — Add FAQ + follow links
- `src/app/[locale]/products/[slug]/page.tsx` — Add installation + FAQ schema
- `src/app/[locale]/faq/page.tsx` — Add FAQPage JSON-LD
- `src/components/layout/Header.tsx` — Add FAQ nav link

### Phase 3 — Social Sharing

**New files:**
- `src/components/social/ShareButton.tsx` — Share component
- `src/components/social/FollowLinks.tsx` — Follow component
- `supabase/migrations/025_social_settings.sql` — Social media settings keys

**Modified files:**
- `src/app/[locale]/products/[slug]/page.tsx` — Add share buttons
- `src/components/layout/Footer.tsx` — Add follow links
- `src/app/admin/settings/page.tsx` — Add social media settings
- `src/app/api/settings/route.ts` — Add social fields

---

## Phase 1: SEO Infrastructure

### Task 1.1: Create Schema.org JSON-LD helpers

**Files:**
- Create: `src/lib/seo/json-ld.ts`

- [ ] **Step 1: Create JSON-LD helper module**

```typescript
// src/lib/seo/json-ld.ts

interface ProductData {
  name: string;
  description?: string;
  image?: string;
  brand?: string;
  sku?: string;
}

export function productSchema(data: ProductData) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: data.name,
    description: data.description || undefined,
    image: data.image || undefined,
    brand: data.brand ? { "@type": "Brand", name: data.brand } : undefined,
    sku: data.sku || undefined,
    offers: {
      "@type": "Offer",
      availability: "https://schema.org/InStock",
    },
  };
}

export function organizationSchema(name: string, url: string, logo?: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name,
    url,
    ...(logo ? { logo } : {}),
  };
}

export function breadcrumbListSchema(items: { name: string; url?: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      ...(item.url ? { item: item.url } : {}),
    })),
  };
}

export function faqPageSchema(questions: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions.map((q) => ({
      "@type": "Question",
      name: q.question,
      acceptedAnswer: { "@type": "Answer", text: q.answer },
    })),
  };
}

export function renderJsonLd(data: Record<string, any>): string {
  return JSON.stringify(data, null, 2);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/seo/json-ld.ts
git commit -m "feat: add JSON-LD schema helpers"
```

### Task 1.2: Add meta tags to product detail page

**Files:**
- Modify: `src/app/[locale]/products/[slug]/page.tsx`

- [ ] **Step 1: Add generateMetadata export to product detail page**

```typescript
// In src/app/[locale]/products/[slug]/page.tsx
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: translation } = await supabase
    .from("product_translations")
    .select("name, description, meta_title, meta_description, og_image, product:products(image_gallery)")
    .eq("locale", locale).eq("slug", slug).single();

  if (!translation) return { title: "Product" };

  const images = translation.product?.image_gallery;
  const ogImage = translation.og_image || images?.[0]?.url || undefined;

  return {
    title: translation.meta_title || translation.name,
    description: translation.meta_description || translation.description || undefined,
    openGraph: {
      title: translation.meta_title || translation.name,
      description: translation.meta_description || translation.description || undefined,
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
  };
}
```

- [ ] **Step 2: Add JSON-LD script to the page JSX**

```typescript
// In the return statement of ProductDetailPage, after breadcrumbs
import { productSchema, breadcrumbListSchema, renderJsonLd } from "@/lib/seo/json-ld";

// Add before the closing </main> tag or in a <head> fragment:
const schema = productSchema({
  name: translation.name,
  description: translation.description,
  image: images?.[0]?.url || undefined,
  brand: "DeepCool",
  sku: product.model_number,
});

const breadcrumbSchema = breadcrumbListSchema([
  { name: "Products", url: `/${locale}/products` },
  ...(category?.product_type ? [{ name: category.product_type, url: `/${locale}/products?type=${encodeURIComponent(category.product_type)}` }] : []),
  ...(category?.name ? [{ name: category.name }] : []),
  { name: product.model_number },
]);

// Add to JSX after breadcrumbs:
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: renderJsonLd(schema) }}
/>
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: renderJsonLd(breadcrumbSchema) }}
/>
```

- [ ] **Step 3: Commit**

```bash
git add src/app/[locale]/products/[slug]/page.tsx src/lib/seo/json-ld.ts
git commit -m "feat: add SEO meta and JSON-LD to product detail page"
```

### Task 1.3: Add SEO meta to About, Contact, Home pages

**Files:**
- Modify: `src/app/[locale]/page.tsx`
- Modify: `src/app/[locale]/about/page.tsx`
- Modify: `src/app/[locale]/contact/page.tsx`
- Modify: `src/app/[locale]/products/page.tsx`

- [ ] **Step 1: Add generateMetadata to HomePage**

```typescript
// src/app/[locale]/page.tsx
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const supabase = await createServerSupabaseClient();
  let title = "DeepCool — Precision Wine Cooling Cabinets";
  let desc = "German-engineered wine cooling cabinets with precision temperature control.";

  if (supabase) {
    const { data } = await supabase.from("page_contents")
      .select("title, content").eq("page_key", "home").eq("locale", locale).maybeSingle();
    if (data?.title) title = data.title + " — DeepCool";
  }

  return { title, description: desc };
}
```

- [ ] **Step 2: Add generateMetadata to AboutPage, ContactPage, ProductsPage**

```typescript
// About — similar pattern reading page_contents
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: locale === "zh" ? "关于我们 — DeepCool" : "About Us — DeepCool" };
}

// Contact
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: locale === "zh" ? "联系我们 — DeepCool" : "Contact Us — DeepCool" };
}

// Products
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: locale === "zh" ? "产品中心 — DeepCool" : "Products — DeepCool" };
}
```

- [ ] **Step 3: Add Organization + BreadcrumbList JSON-LD to these pages**

```typescript
// In HomePage, after Breadcrumbs:
const orgSchema = organizationSchema("DeepCool", `https://deepcool.com/${locale}`, logoUrl || undefined);

<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: renderJsonLd(orgSchema) }} />
```

- [ ] **Step 4: Commit**

```bash
git add src/app/[locale]/page.tsx src/app/[locale]/about/page.tsx src/app/[locale]/contact/page.tsx src/app/[locale]/products/page.tsx
git commit -m "feat: add SEO meta and schema to pages"
```

### Task 1.4: Create sitemap.ts and robots.txt

**Files:**
- Create: `src/app/sitemap.ts`
- Create: `public/robots.txt`

- [ ] **Step 1: Create sitemap.ts**

```typescript
// src/app/sitemap.ts
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function sitemap() {
  const baseUrl = "https://deepcool.com";
  const supabase = await createServerSupabaseClient();

  // Static pages
  const locales = ["en", "zh"];
  const staticPages = ["", "products", "about", "contact", "faq"];
  const staticEntries = locales.flatMap((locale) =>
    staticPages.map((page) => ({
      url: `${baseUrl}/${locale}${page ? `/${page}` : ""}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: page === "" ? 1.0 : 0.8,
    }))
  );

  // Product pages
  let productEntries: any[] = [];
  if (supabase) {
    const { data: translations } = await supabase
      .from("product_translations")
      .select("slug, locale, updated_at");
    productEntries = (translations || []).map((t) => ({
      url: `${baseUrl}/${t.locale}/products/${t.slug}`,
      lastModified: new Date(t.updated_at || Date.now()),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    }));
  }

  return [...staticEntries, ...productEntries];
}
```

- [ ] **Step 2: Create robots.txt**

```
# public/robots.txt
User-agent: *
Allow: /

Sitemap: https://deepcool.com/sitemap.xml
```

- [ ] **Step 3: Add base URL to env**

```bash
# .env.local — add
NEXT_PUBLIC_SITE_URL=https://deepcool.com
```

- [ ] **Step 4: Commit**

```bash
git add src/app/sitemap.ts public/robots.txt
git commit -m "feat: add sitemap and robots.txt"
```

### Task 1.5: Admin SEO fields for page editor

**Files:**
- Modify: `src/app/admin/pages/page.tsx`

- [ ] **Step 1: Add SEO fields to page editor state and load/save**

```typescript
// Add to AdminPagesPage state
const [seoTitle, setSeoTitle] = useState("");
const [seoDesc, setSeoDesc] = useState("");
const [seoImage, setSeoImage] = useState("");

// In loadContent, after setTitle:
setSeoTitle(data.seo_title || "");
setSeoDesc(data.seo_description || "");
setSeoImage(data.seo_image || "");

// In handleSave:
seo_title: seoTitle || null,
seo_description: seoDesc || null,
seo_image: seoImage || null,
```

- [ ] **Step 2: Add SEO section UI to page editor**

```typescript
// Add after the Page settings toggle section:
{/* SEO Settings */}
<div className="p-4 bg-deep-dark/40 border border-silver/10 rounded-lg">
  <p className="text-[10px] text-silver/40 uppercase tracking-wider mb-3">🔍 SEO</p>
  <input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)}
    placeholder="Meta Title (leave empty for auto)" className="w-full bg-deep-dark border border-silver/10 rounded px-3 py-2 text-sm text-white mb-2" />
  <textarea value={seoDesc} onChange={(e) => setSeoDesc(e.target.value)} rows={2}
    placeholder="Meta Description" className="w-full bg-deep-dark border border-silver/10 rounded px-3 py-2 text-sm text-white mb-2" />
  <input value={seoImage} onChange={(e) => setSeoImage(e.target.value)}
    placeholder="OG Image URL" className="w-full bg-deep-dark border border-silver/10 rounded px-3 py-2 text-sm text-white font-mono text-xs" />
</div>
```

- [ ] **Step 3: Add SEO migration**

```sql
-- supabase/migrations/023_seo_fields.sql
ALTER TABLE page_contents ADD COLUMN IF NOT EXISTS seo_title TEXT DEFAULT '';
ALTER TABLE page_contents ADD COLUMN IF NOT EXISTS seo_description TEXT DEFAULT '';
ALTER TABLE page_contents ADD COLUMN IF NOT EXISTS seo_image TEXT DEFAULT '';
```

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/pages/page.tsx supabase/migrations/023_seo_fields.sql
git commit -m "feat: add SEO fields to page editor"
```

---

## Phase 2: GEO + FAQ + Installation

### Task 2.1: Create FAQ database table

**Files:**
- Create: `supabase/migrations/024_faq_items.sql`

- [ ] **Step 1: Create migration**

```sql
-- supabase/migrations/024_faq_items.sql
CREATE TABLE IF NOT EXISTS faq_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  locale VARCHAR(5) NOT NULL DEFAULT 'en',
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category VARCHAR(100) NOT NULL DEFAULT 'general',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE faq_items DISABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_faq_locale_category ON faq_items(locale, category, sort_order);
```

- [ ] **Step 2: Create FAQ API endpoint**

```typescript
// src/app/api/faq/route.ts
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const locale = searchParams.get("locale") || "en";
  const category = searchParams.get("category");

  const supabase = await createServerSupabaseClient();
  if (!supabase) return Response.json({ items: [] });

  let query = supabase.from("faq_items").select("*").eq("locale", locale).order("sort_order");
  if (category) query = query.eq("category", category);
  const { data } = await query;

  return Response.json({ items: data || [] });
}
```

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/024_faq_items.sql src/app/api/faq/route.ts
git commit -m "feat: add FAQ table and API"
```

### Task 2.2: Create FAQ accordion component

**Files:**
- Create: `src/components/faq/FaqAccordion.tsx`

- [ ] **Step 1: Create the accordion component**

```typescript
"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category?: string;
}

export default function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id} className="border border-silver/10 rounded-xl overflow-hidden">
          <button
            onClick={() => setOpenId(openId === item.id ? null : item.id)}
            className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-deep-blue/20 transition-colors"
          >
            <span className="text-sm text-white font-light tracking-wide">{item.question}</span>
            <motion.span
              animate={{ rotate: openId === item.id ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="text-silver/40 flex-shrink-0 ml-4"
            >▼</motion.span>
          </button>
          <AnimatePresence>
            {openId === item.id && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-6 pb-4 text-sm text-silver/60 leading-relaxed border-t border-silver/10 pt-4">
                  {item.answer}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/faq/FaqAccordion.tsx
git commit -m "feat: add FAQ accordion component"
```

### Task 2.3: Create FAQ frontend page

**Files:**
- Create: `src/app/[locale]/faq/page.tsx`

- [ ] **Step 1: Create FAQ page**

```typescript
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import FaqAccordion from "@/components/faq/FaqAccordion";
import { faqPageSchema, renderJsonLd } from "@/lib/seo/json-ld";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function FaqPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const supabase = await createServerSupabaseClient();

  let items: any[] = [];
  if (supabase) {
    const { data } = await supabase.from("faq_items").select("*").eq("locale", locale).order("sort_order");
    items = data || [];
  }

  // Group by category
  const categories = [...new Set(items.map((i) => i.category))];

  // FAQPage Schema
  const schema = faqPageSchema(items.map((i) => ({ question: i.question, answer: i.answer })));

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: renderJsonLd(schema) }} />
      <Header />
      <main style={{ paddingTop: "64px" }}>
        <Breadcrumbs items={[{ label: "FAQ" }]} />
        <div className="max-w-3xl mx-auto px-4 py-16">
          <h1 className="text-3xl md:text-4xl font-light tracking-wider text-white mb-4">
            {locale === "zh" ? "常见问题" : "Frequently Asked Questions"}
          </h1>
          <p className="text-silver/60 mb-12">{locale === "zh" ? "关于产品、安装、质保的常见问题" : "Common questions about our products, installation, and warranty."}</p>

          {categories.map((cat) => (
            <div key={cat} className="mb-10">
              <h2 className="text-sm text-forest uppercase tracking-wider mb-4">{cat}</h2>
              <FaqAccordion items={items.filter((i) => i.category === cat)} />
            </div>
          ))}

          {items.length === 0 && (
            <div className="text-center py-16 text-silver/40 text-sm">No FAQs yet.</div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/[locale]/faq/page.tsx
git commit -m "feat: add FAQ page with accordion"
```

### Task 2.4: Create FAQ admin manager

**Files:**
- Create: `src/app/admin/faq/page.tsx`

- [ ] **Step 1: Create FAQ admin CRUD page**

```typescript
"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import AdminSidebar from "@/components/admin/AdminSidebar";
import Button from "@/components/ui/Button";

const CATEGORIES = ["Product", "Installation", "Warranty", "Shipping", "General"];

export default function AdminFaqPage() {
  const supabase = createClient();
  const [items, setItems] = useState<any[]>([]);
  const [locale, setLocale] = useState("en");
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");
  const [newCategory, setNewCategory] = useState("General");

  function loadFaq() {
    fetch(`/api/faq?locale=${locale}`)
      .then((r) => r.json())
      .then((data) => setItems(data.items || []));
  }

  useEffect(() => { loadFaq(); }, [locale]);

  async function addItem() {
    if (!newQuestion || !newAnswer || !supabase) return;
    await supabase.from("faq_items").insert({
      locale, question: newQuestion, answer: newAnswer,
      category: newCategory, sort_order: items.length + 1,
    });
    setNewQuestion(""); setNewAnswer(""); setNewCategory("General");
    loadFaq();
  }

  async function deleteItem(id: string) {
    if (!supabase) return;
    await supabase.from("faq_items").delete().eq("id", id);
    loadFaq();
  }

  async function moveItem(id: string, dir: -1 | 1) {
    // Simple: re-fetch and update sort_orders
  }

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="ml-64 flex-1 p-8">
        <h1 className="text-2xl font-light tracking-wider text-white mb-8">📋 FAQ Manager</h1>

        {/* Locale toggle */}
        <div className="flex gap-2 mb-6">
          <button onClick={() => setLocale("en")}
            className={`px-3 py-1.5 text-xs rounded border ${locale === "en" ? "bg-ice/20 text-ice border-ice/30" : "text-silver/50 border-silver/20"}`}>🇬🇧 EN</button>
          <button onClick={() => setLocale("zh")}
            className={`px-3 py-1.5 text-xs rounded border ${locale === "zh" ? "bg-ice/20 text-ice border-ice/30" : "text-silver/50 border-silver/20"}`}>🇨🇳 ZH</button>
        </div>

        {/* Add new */}
        <div className="bg-deep-blue/30 border border-silver/10 rounded-xl p-4 mb-6 space-y-2">
          <input value={newQuestion} onChange={(e) => setNewQuestion(e.target.value)}
            placeholder="Question" className="w-full bg-deep-dark border border-silver/10 rounded px-3 py-2 text-sm text-white" />
          <textarea value={newAnswer} onChange={(e) => setNewAnswer(e.target.value)} rows={3}
            placeholder="Answer" className="w-full bg-deep-dark border border-silver/10 rounded px-3 py-2 text-sm text-white" />
          <div className="flex gap-2">
            <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)}
              className="bg-deep-dark border border-silver/10 rounded px-3 py-2 text-sm text-silver/60">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <Button size="sm" onClick={addItem}>+ Add</Button>
          </div>
        </div>

        {/* List */}
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={item.id} className="bg-deep-blue/30 border border-silver/10 rounded-xl p-4">
              <div className="flex justify-between items-start mb-1">
                <span className="text-xs text-forest/80 px-2 py-0.5 rounded bg-forest/10">{item.category}</span>
                <button onClick={() => deleteItem(item.id)} className="text-red-400/60 hover:text-red-400 text-xs">×</button>
              </div>
              <p className="text-sm text-white font-medium mb-1">{item.question}</p>
              <p className="text-xs text-silver/60">{item.answer}</p>
            </div>
          ))}
          {items.length === 0 && <p className="text-xs text-silver/40 py-8 text-center">No FAQs yet.</p>}
        </div>
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Add FAQ to AdminSidebar**

```typescript
// In AdminSidebar.tsx, add to links array:
{ href: "/admin/faq", label: "📋 FAQ" }
```

- [ ] **Step 3: Add FAQ to Header nav**

```typescript
// In Header.tsx, add to links:
{ href: `/${locale}/faq`, label: isZh ? "常见问题" : "FAQ" }
```

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/faq/page.tsx src/components/admin/AdminSidebar.tsx src/components/layout/Header.tsx
git commit -m "feat: add FAQ admin manager and nav links"
```

### Task 2.5: Create Installation Media system

**Files:**
- Create: `supabase/migrations/025_installation_media.sql`
- Create: `src/components/products/InstallationMedia.tsx`
- Modify: `src/app/[locale]/products/[slug]/page.tsx`
- Modify: `src/app/admin/products/[id]/edit/page.tsx`

- [ ] **Step 1: Create migration**

```sql
-- supabase/migrations/025_installation_media.sql
ALTER TABLE products ADD COLUMN IF NOT EXISTS installation_media JSONB DEFAULT '[]';
```

- [ ] **Step 2: Create InstallationMedia component**

```typescript
"use client";
import { useState } from "react";

interface MediaItem {
  type: "image" | "pdf" | "video";
  url: string;
  label: string;
}

export default function InstallationMedia({ media }: { media: MediaItem[] }) {
  const [active, setActive] = useState(0);
  if (!media || media.length === 0) return null;

  const current = media[active];

  return (
    <div className="mb-16">
      <h3 className="text-xl text-white tracking-wide mb-6">📐 Installation</h3>
      {/* Tabs */}
      <div className="flex gap-1 mb-4 flex-wrap">
        {media.map((item, i) => (
          <button key={i} onClick={() => setActive(i)}
            className={`px-4 py-2 text-xs rounded-full border transition-colors ${
              i === active ? "bg-forest/20 text-forest border-forest/30" : "text-silver/50 border-silver/20 hover:text-white"
            }`}>
            {item.label}
          </button>
        ))}
      </div>
      {/* Content */}
      <div className="bg-deep-blue/20 border border-silver/10 rounded-xl overflow-hidden">
        {current.type === "image" && (
          <img src={current.url} alt={current.label} className="w-full object-contain max-h-[500px]" />
        )}
        {current.type === "pdf" && (
          <div className="p-12 text-center">
            <p className="text-silver/60 mb-4">📄 {current.label}</p>
            <a href={current.url} target="_blank" rel="noopener noreferrer"
              className="px-6 py-3 bg-forest/20 text-forest rounded-lg text-sm hover:bg-forest/30 transition-colors">
              Download PDF
            </a>
          </div>
        )}
        {current.type === "video" && (
          <div className="aspect-video">
            <iframe src={current.url} className="w-full h-full" allowFullScreen />
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Add to product detail page**

```typescript
// After SpecTable section:
{product.installation_media?.length > 0 && (
  <InstallationMedia media={product.installation_media} />
)}
```

- [ ] **Step 4: Add editor to admin product edit page**

In `src/app/admin/products/[id]/edit/page.tsx`, add after the Images section:

```typescript
// State:
const [installMedia, setInstallMedia] = useState<any[]>([]);

// Load:
setInstallMedia(data.installation_media || []);

// Save:
installation_media: installMedia,

// UI — after Images section:
{/* Installation Media */}
<div className="bg-deep-blue/30 border border-silver/10 rounded-xl p-6">
  <h3 className="text-white tracking-wide mb-4">📐 Installation Resources</h3>
  <div className="space-y-2">
    {installMedia.map((item, i) => (
      <div key={i} className="flex gap-2 items-center">
        <select value={item.type} onChange={(e) => {
          const s = [...installMedia]; s[i] = { ...s[i], type: e.target.value }; setInstallMedia(s);
        }} className="bg-deep-dark border border-silver/10 rounded px-2 py-2 text-xs text-silver/60">
          <option value="image">Image</option>
          <option value="pdf">PDF</option>
          <option value="video">Video</option>
        </select>
        <input value={item.label} onChange={(e) => {
          const s = [...installMedia]; s[i] = { ...s[i], label: e.target.value }; setInstallMedia(s);
        }} placeholder="Label" className="w-32 bg-deep-dark border border-silver/10 rounded px-2 py-2 text-xs text-white" />
        <input value={item.url} onChange={(e) => {
          const s = [...installMedia]; s[i] = { ...s[i], url: e.target.value }; setInstallMedia(s);
        }} placeholder="URL" className="flex-1 bg-deep-dark border border-silver/10 rounded px-2 py-2 text-xs text-white font-mono" />
        <button onClick={() => setInstallMedia(installMedia.filter((_, idx) => idx !== i))}
          className="text-red-400/60 hover:text-red-400 text-xs">×</button>
      </div>
    ))}
    <button onClick={() => setInstallMedia([...installMedia, { type: "image", url: "", label: "" }])}
      className="text-xs text-ice/60 hover:text-ice">+ Add Resource</button>
  </div>
</div>
```

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/025_installation_media.sql src/components/products/InstallationMedia.tsx src/app/[locale]/products/[slug]/page.tsx src/app/admin/products/[id]/edit/page.tsx
git commit -m "feat: add installation media system"
```

---

## Phase 3: Social Sharing

### Task 3.1: Create ShareButton component

**Files:**
- Create: `src/components/social/ShareButton.tsx`

- [ ] **Step 1: Create floating share component**

```typescript
"use client";
import { useState } from "react";

const PLATFORMS = [
  { id: "linkedin", label: "LinkedIn", color: "#0A66C2", share: (u: string, t: string) => `https://linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(u)}` },
  { id: "facebook", label: "Facebook", color: "#1877F2", share: (u: string) => `https://facebook.com/sharer/sharer.php?u=${encodeURIComponent(u)}` },
  { id: "twitter", label: "X", color: "#000", share: (u: string, t: string) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(t)}&url=${encodeURIComponent(u)}` },
  { id: "whatsapp", label: "WhatsApp", color: "#25D366", share: (u: string) => `https://wa.me/?text=${encodeURIComponent(u)}` },
  { id: "email", label: "Email", color: "#666", share: (u: string, t: string) => `mailto:?subject=${encodeURIComponent(t)}&body=${encodeURIComponent(u)}` },
];

export default function ShareButton({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const fullUrl = typeof window !== "undefined" ? window.location.href : url;

  function copyLink() {
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-silver/50 tracking-wider">Share:</span>
      {PLATFORMS.map((p) => (
        <a key={p.id} href={p.share(fullUrl, title)} target="_blank" rel="noopener noreferrer"
          onClick={(e) => { if (p.id !== "email") { e.preventDefault(); window.open(p.share(fullUrl, title), "_blank", "width=600,height=400"); } }}
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs text-white hover:opacity-80 transition-opacity"
          style={{ backgroundColor: p.color }}
          title={p.label}
        >{p.id === "linkedin" ? "in" : p.id === "twitter" ? "𝕏" : p.id === "facebook" ? "f" : p.id === "whatsapp" ? "wa" : "✉"}</a>
      ))}
      <button onClick={copyLink}
        className="w-8 h-8 rounded-full bg-silver/20 text-silver/60 text-xs flex items-center justify-center hover:bg-silver/30 transition-colors"
        title="Copy link">
        {copied ? "✓" : "🔗"}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/social/ShareButton.tsx
git commit -m "feat: add social share button component"
```

### Task 3.2: Create FollowLinks component

**Files:**
- Create: `src/components/social/FollowLinks.tsx`

- [ ] **Step 1: Create follow links component**

```typescript
"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const PLATFORMS = [
  { key: "social_youtube", icon: "▶", label: "YouTube" },
  { key: "social_instagram", icon: "📷", label: "Instagram" },
  { key: "social_tiktok", icon: "🎵", label: "TikTok" },
  { key: "social_linkedin", icon: "in", label: "LinkedIn" },
];

export default function FollowLinks() {
  const [links, setLinks] = useState<Record<string, string>>({});
  const [showWechat, setShowWechat] = useState(false);
  const [wechatQr, setWechatQr] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        const result: Record<string, string> = {};
        PLATFORMS.forEach((p) => { if (data[p.key]) result[p.key] = data[p.key]; });
        setLinks(result);
        setWechatQr(data.social_wechat_qr || "");
      });
  }, []);

  if (Object.keys(links).length === 0 && !wechatQr) return null;

  return (
    <div className="mt-6">
      <h4 className="text-sm font-medium text-white mb-3 uppercase tracking-wider">Follow Us</h4>
      <div className="flex flex-wrap gap-3">
        {PLATFORMS.filter((p) => links[p.key]).map((p) => (
          <a key={p.key} href={links[p.key]} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-deep-blue/30 border border-silver/10 text-xs text-silver/60 hover:text-white hover:border-forest/30 transition-all">
            <span>{p.icon}</span>
            <span>{p.label}</span>
          </a>
        ))}
        {wechatQr && (
          <div className="relative">
            <button onClick={() => setShowWechat(!showWechat)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-deep-blue/30 border border-silver/10 text-xs text-silver/60 hover:text-white hover:border-forest/30 transition-all">
              <span>💬</span><span>WeChat</span>
            </button>
            <AnimatePresence>
              {showWechat && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-deep-blue border border-silver/10 rounded-xl p-4 shadow-2xl">
                  <img src={wechatQr} alt="WeChat QR" className="w-36 h-36 object-contain" />
                  <p className="text-xs text-silver/50 text-center mt-2">Scan to follow</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/social/FollowLinks.tsx
git commit -m "feat: add social follow links component"
```

### Task 3.3: Integrate Share + Follow into pages and admin

**Files:**
- Modify: `src/components/layout/Footer.tsx` — Add FollowLinks above Quick Links
- Modify: `src/app/[locale]/products/[slug]/page.tsx` — Add ShareButton
- Modify: `src/app/[locale]/about/page.tsx` — Add ShareButton
- Modify: `src/app/[locale]/contact/page.tsx` — Add ShareButton
- Modify: `src/app/admin/settings/page.tsx` — Add social link inputs
- Modify: `src/app/api/settings/route.ts` — Add social fields

- [ ] **Step 1: Add ShareButton to product detail page**

```typescript
// In product detail page, near the top right of the product info section:
<ShareButton url={`/${locale}/products/${slug}`} title={translation.name} />
```

- [ ] **Step 2: Add FollowLinks to Footer**

```typescript
// In Footer.tsx, before the Quick Links column:
<FollowLinks />
```

- [ ] **Step 3: Add social link inputs to Admin Settings**

```typescript
// Add to admin settings page after Footer section:
{/* Social Media */}
<div className="bg-deep-blue/30 border border-silver/10 rounded-xl p-6">
  <h3 className="text-white tracking-wide mb-4">📱 Social Media</h3>
  <p className="text-xs text-silver/50 mb-4">Enter your brand social media URLs. Leave blank to hide.</p>
  <div className="space-y-2">
    {[
      { key: "social_youtube", label: "YouTube URL", icon: "▶" },
      { key: "social_instagram", label: "Instagram URL", icon: "📷" },
      { key: "social_tiktok", label: "TikTok URL", icon: "🎵" },
      { key: "social_linkedin", label: "LinkedIn URL", icon: "in" },
    ].map((field) => (
      <div key={field.key} className="flex items-center gap-2">
        <span className="w-6 text-center">{field.icon}</span>
        <input value={social[field.key] || ""} onChange={(e) => setSocial({...social, [field.key]: e.target.value})}
          placeholder={field.label} className="flex-1 bg-deep-dark border border-silver/10 rounded px-3 py-2 text-xs text-white" />
        <Button size="sm" onClick={async () => { await saveSetting(field.key, social[field.key] || ""); }}>Save</Button>
      </div>
    ))}
    <div className="flex items-center gap-2">
      <span className="w-6 text-center">💬</span>
      <input value={wechatQrUrl} onChange={(e) => setWechatQrUrl(e.target.value)}
        placeholder="WeChat QR Code Image URL" className="flex-1 bg-deep-dark border border-silver/10 rounded px-3 py-2 text-xs text-white font-mono" />
      <Button size="sm" onClick={async () => { await saveSetting("social_wechat_qr", wechatQrUrl); }}>Save</Button>
    </div>
  </div>
</div>
```

- [ ] **Step 4: Update API settings route to include social fields**

```typescript
// In GET response, add:
social_youtube: (await getSetting("social_youtube")) || "",
social_instagram: (await getSetting("social_instagram")) || "",
social_tiktok: (await getSetting("social_tiktok")) || "",
social_linkedin: (await getSetting("social_linkedin")) || "",
social_wechat_qr: (await getSetting("social_wechat_qr")) || "",

// In POST allowed keys, add:
"social_youtube", "social_instagram", "social_tiktok", "social_linkedin", "social_wechat_qr"
```

- [ ] **Step 5: Add social media migration**

```sql
-- supabase/migrations/026_social_settings.sql
INSERT INTO site_settings (key, value) VALUES
  ('social_youtube', ''), ('social_instagram', ''), ('social_tiktok', ''),
  ('social_linkedin', ''), ('social_wechat_qr', '')
ON CONFLICT (key) DO NOTHING;
```

- [ ] **Step 6: Commit**

```bash
git add src/app/[locale]/products/[slug]/page.tsx src/app/[locale]/about/page.tsx src/app/[locale]/contact/page.tsx src/components/layout/Footer.tsx src/app/admin/settings/page.tsx src/app/api/settings/route.ts supabase/migrations/026_social_settings.sql
git commit -m "feat: integrate share and follow components"
```

### Task 3.5: Add WeChat QR upload to admin settings

**Files:**
- Modify: `src/app/admin/settings/page.tsx`

- [ ] **Step 1: Add WeChat QR upload button**

```typescript
// Near the WeChat URL input, add upload button:
<input ref={wechatInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleWechatQrUpload(e.target.files)} />
<Button size="sm" variant="outline" onClick={() => wechatInputRef.current?.click()}>📁 Upload QR</Button>
```

- [ ] **Step 2: Add upload handler**

```typescript
async function handleWechatQrUpload(files: FileList | null) {
  if (!files?.length) return;
  const file = files[0];
  try {
    const compressed = await compressImage(file, 400, 0.85);
    const path = `social/wechat-${Date.now()}.webp`;
    const formData = new FormData();
    formData.append("file", compressed, `wechat.webp`);
    formData.append("path", path);
    formData.append("bucket", "products");
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const result = await res.json();
    if (result.error) { alert(result.error); return; }
    await saveSetting("social_wechat_qr", result.url);
    setWechatQrUrl(result.url);
  } catch (e: any) { alert(e.message); }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/settings/page.tsx
git commit -m "feat: add WeChat QR code upload"
```
