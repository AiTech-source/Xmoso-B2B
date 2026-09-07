const SITE_URL = "https://xmoso.com";

const apiCatalog = {
  linkset: [
    {
      anchor: `${SITE_URL}/api/products-by-type`,
      "service-desc": [
        {
          href: `${SITE_URL}/openapi.json`,
          type: "application/openapi+json",
        },
      ],
      "service-doc": [
        {
          href: `${SITE_URL}/llms.txt`,
          type: "text/markdown",
        },
      ],
      status: [
        {
          href: `${SITE_URL}/api/warmup`,
          type: "application/json",
        },
      ],
    },
    {
      anchor: `${SITE_URL}/api/product-compare`,
      "service-desc": [
        {
          href: `${SITE_URL}/openapi.json`,
          type: "application/openapi+json",
        },
      ],
      "service-doc": [
        {
          href: `${SITE_URL}/products/compare`,
          type: "text/html",
        },
      ],
      status: [
        {
          href: `${SITE_URL}/api/warmup`,
          type: "application/json",
        },
      ],
    },
  ],
};

export const dynamic = "force-static";

export async function GET() {
  return new Response(JSON.stringify(apiCatalog, null, 2), {
    headers: {
      "Content-Type": "application/linkset+json; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
