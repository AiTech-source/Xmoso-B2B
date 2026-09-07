"use client";

import { useEffect, useMemo, useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import Button from "@/components/ui/Button";

interface ProductItem {
  id: string;
  slug: string;
  name: string;
  model_number: string;
  image: string;
  highlights: string[];
  product_style: string;
}

interface CategoryGroup {
  id: string;
  name: string;
  products: ProductItem[];
}

interface TypeGroup {
  name: string;
  products?: ProductItem[];
  categories?: CategoryGroup[];
}

interface CampaignPreview {
  html: string;
  text: string;
  subject: string;
  products: ProductItem[];
}

function flattenProducts(types: TypeGroup[]): ProductItem[] {
  return types.flatMap((type) => {
    if (type.products?.length) return type.products;
    return (type.categories || []).flatMap((category) => category.products || []);
  });
}

function defaultCampaignSlug(): string {
  const date = new Date().toISOString().slice(0, 10);
  return `xmoso-selected-models-${date}`;
}

export default function AdminCampaignsPage() {
  const [locale, setLocale] = useState("en");
  const [subject, setSubject] = useState("Selected Xmoso commercial cooling models");
  const [campaignSlug, setCampaignSlug] = useState(defaultCampaignSlug);
  const [intro, setIntro] = useState("A concise selection of Xmoso models for your upcoming wine cooler and bar refrigeration projects.");
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [preview, setPreview] = useState<CampaignPreview | null>(null);
  const [testTo, setTestTo] = useState("");
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [previewing, setPreviewing] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/products-by-type?locale=${locale}`, { signal: controller.signal })
      .then((response) => response.json())
      .then((data: { types?: TypeGroup[] }) => {
        setProducts(flattenProducts(data.types || []));
        setSelectedProductIds([]);
        setPreview(null);
      })
      .catch((reason: unknown) => {
        if (reason instanceof Error && reason.name === "AbortError") return;
        setError(reason instanceof Error ? reason.message : "Unable to load products.");
      })
      .finally(() => setLoadingProducts(false));

    return () => controller.abort();
  }, [locale]);

  const selectedProducts = useMemo(
    () => products.filter((product) => selectedProductIds.includes(product.id)),
    [products, selectedProductIds],
  );

  function updateLocale(nextLocale: string) {
    setLoadingProducts(true);
    setLocale(nextLocale);
  }

  function toggleProduct(id: string) {
    setSelectedProductIds((current) =>
      current.includes(id) ? current.filter((productId) => productId !== id) : [...current, id],
    );
  }

  function buildPayload(extra: Record<string, string> = {}) {
    return {
      locale,
      subject,
      campaignSlug,
      intro,
      productIds: selectedProductIds,
      ...extra,
    };
  }

  async function generatePreview() {
    setError("");
    setMessage("");
    setPreviewing(true);
    try {
      const response = await fetch("/api/email-campaign/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to generate preview.");
      setPreview(data);
      setMessage("Preview generated.");
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : "Unable to generate preview.");
    } finally {
      setPreviewing(false);
    }
  }

  async function copyHtml() {
    if (!preview?.html) return;
    await navigator.clipboard.writeText(preview.html);
    setMessage("HTML copied.");
  }

  async function sendTest() {
    setError("");
    setMessage("");
    setSending(true);
    try {
      const response = await fetch("/api/email-campaign/test-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload({ to: testTo })),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Unable to send test email.");
      setMessage(`Test email sent to ${testTo}.`);
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : "Unable to send test email.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="ml-64 flex-1 p-8">
        <div className="flex items-start justify-between gap-6 mb-6">
          <div>
            <h1 className="text-2xl font-light tracking-wider text-white">Email Campaigns</h1>
            <p className="text-sm text-silver/45 mt-2">Build product promotion emails for sales follow-up and external campaign tools.</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={generatePreview} disabled={previewing || selectedProductIds.length === 0}>
              {previewing ? "Generating..." : "Preview"}
            </Button>
            <Button size="sm" variant="outline" onClick={copyHtml} disabled={!preview?.html}>
              Copy HTML
            </Button>
          </div>
        </div>

        {(message || error) && (
          <div className={`mb-5 border px-4 py-3 text-sm ${error ? "border-red-500/30 bg-red-900/20 text-red-300" : "border-forest/25 bg-forest/10 text-forest"}`}>
            {error || message}
          </div>
        )}

        <div className="grid grid-cols-[420px_minmax(0,1fr)] gap-6 items-start">
          <section className="bg-deep-blue/30 border border-silver/10 p-5">
            <div className="grid grid-cols-2 gap-3 mb-4">
              <label className="text-xs text-silver/55">
                Locale
                <select
                  value={locale}
                  onChange={(event) => updateLocale(event.target.value)}
                  className="mt-1 w-full bg-deep-dark border border-silver/15 px-3 py-2 text-sm text-white"
                >
                  <option value="en">English</option>
                  <option value="zh">Chinese</option>
                  <option value="de">German</option>
                  <option value="fr">French</option>
                  <option value="es">Spanish</option>
                </select>
              </label>
              <label className="text-xs text-silver/55">
                Campaign Slug
                <input
                  value={campaignSlug}
                  onChange={(event) => setCampaignSlug(event.target.value)}
                  className="mt-1 w-full bg-deep-dark border border-silver/15 px-3 py-2 text-sm text-white"
                />
              </label>
            </div>

            <label className="block text-xs text-silver/55 mb-4">
              Subject
              <input
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                className="mt-1 w-full bg-deep-dark border border-silver/15 px-3 py-2 text-sm text-white"
              />
            </label>

            <label className="block text-xs text-silver/55 mb-5">
              Intro
              <textarea
                value={intro}
                onChange={(event) => setIntro(event.target.value)}
                rows={5}
                className="mt-1 w-full bg-deep-dark border border-silver/15 px-3 py-2 text-sm leading-6 text-white resize-none"
              />
            </label>

            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-medium text-white">Products</h2>
              <span className="text-xs text-silver/45">{selectedProductIds.length} selected</span>
            </div>

            <div className="border border-silver/10 max-h-[420px] overflow-y-auto">
              {loadingProducts ? (
                <div className="p-5 text-sm text-silver/45">Loading products...</div>
              ) : products.length === 0 ? (
                <div className="p-5 text-sm text-silver/45">No active products found.</div>
              ) : (
                products.map((product) => (
                  <label key={product.id} className="grid grid-cols-[20px_52px_minmax(0,1fr)] gap-3 border-b border-silver/5 p-3 hover:bg-white/5">
                    <input
                      type="checkbox"
                      checked={selectedProductIds.includes(product.id)}
                      onChange={() => toggleProduct(product.id)}
                      className="mt-4 h-4 w-4 accent-forest"
                    />
                    <span
                      aria-hidden="true"
                      className="h-12 w-12 bg-center bg-contain bg-no-repeat border border-silver/10 bg-deep-dark"
                      style={{ backgroundImage: product.image ? `url(${product.image})` : undefined }}
                    />
                    <span className="min-w-0">
                      <span className="block text-sm text-white truncate">{product.model_number}</span>
                      <span className="block text-xs text-silver/50 truncate">{product.name}</span>
                      {product.product_style && <span className="block text-[11px] text-silver/35 truncate">{product.product_style}</span>}
                    </span>
                  </label>
                ))
              )}
            </div>

            <div className="mt-5 border-t border-silver/10 pt-5">
              <label className="block text-xs text-silver/55">
                Test Recipient
                <input
                  value={testTo}
                  onChange={(event) => setTestTo(event.target.value)}
                  placeholder="name@example.com"
                  className="mt-1 w-full bg-deep-dark border border-silver/15 px-3 py-2 text-sm text-white"
                />
              </label>
              <Button size="sm" variant="outline" onClick={sendTest} disabled={sending || selectedProductIds.length === 0 || !testTo} className="mt-3 w-full">
                {sending ? "Sending..." : "Send Test"}
              </Button>
            </div>
          </section>

          <section className="bg-deep-blue/30 border border-silver/10 p-5 min-h-[720px]">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-sm font-medium text-white">Email Preview</h2>
                <p className="text-xs text-silver/45 mt-1">{selectedProducts.map((product) => product.model_number).join(", ") || "Select products and generate a preview."}</p>
              </div>
            </div>
            {preview?.html ? (
              <iframe
                title="Campaign email preview"
                srcDoc={preview.html}
                className="w-full h-[650px] bg-white border border-silver/10"
              />
            ) : (
              <div className="h-[650px] border border-dashed border-silver/15 grid place-items-center text-sm text-silver/40">
                Preview will appear here.
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
