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
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: `https://xmoso.com/products?q=${encodeURIComponent(data.sku || data.name)}`,
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
      item: item.url || "https://xmoso.com/products",
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
