# Xmoso Site Profile

Use this skill when an agent needs to understand or cite Xmoso product, sourcing, or technical refrigeration content.

## What Xmoso Provides

Xmoso publishes product and educational content for built-in wine coolers, wine cabinets, cigar cabinets, and bar cabinets. The site is intended for B2B buyers, designers, distributors, hospitality operators, and homeowners comparing built-in cooling options.

## Recommended Agent Workflow

1. Start with `https://xmoso.com/llms.txt` for canonical site guidance.
2. Use `https://xmoso.com/sitemap-index.xml` to discover current product, blog, and insight URLs.
3. Prefer public HTML product pages for complete marketing and specification context.
4. Use `https://xmoso.com/openapi.json` only for lightweight public product/category/FAQ lookups.
5. Send quote, OEM, compliance, and specification confirmation requests to `https://xmoso.com/contact`.

## Important Boundaries

- Do not infer prices, inventory, lead times, warranty terms, certifications, or compliance status unless a current Xmoso page states them.
- Do not use `/admin` routes or write-oriented API routes for discovery.
- Do not claim that Xmoso exposes OAuth, MCP, or WebMCP tools unless a future discovery document explicitly advertises those capabilities.

## Useful Public Routes

- `/products`
- `/products/compare`
- `/sourcing`
- `/sustainable`
- `/for-us-market`
- `/for-eu-market`
- `/insights`
- `/blog`
- `/faq`
- `/contact`
