const SITE_ORIGIN = "https://xmoso.com";

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

const INSTANTLY_CSV_HEADERS = [
  "Email",
  "FirstName",
  "LastName",
  "CompanyName",
  "Website",
  "Region",
  "SalesOwner",
  "ProductModels",
  "ProductLinks",
  "CampaignSlug",
  "EmailSubject",
];

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeLocale(locale: string): string {
  return locale.trim().toLowerCase() || "en";
}

function absoluteUrl(value: string): string {
  if (!value) return `${SITE_ORIGIN}/placeholder.svg`;
  if (/^https?:\/\//i.test(value)) return value;
  return `${SITE_ORIGIN}${value.startsWith("/") ? value : `/${value}`}`;
}

function escapeCsv(value: string): string {
  if (!/[",\r\n]/.test(value)) return value;
  return `"${value.replace(/"/g, '""')}"`;
}

export function buildCampaignProductUrl(
  product: CampaignProduct,
  locale: string,
  campaignSlug: string,
): string {
  const normalizedLocale = normalizeLocale(locale);
  const path =
    normalizedLocale === "en"
      ? `/products/${product.slug}`
      : `/${normalizedLocale}/products/${product.slug}`;
  const url = new URL(path, SITE_ORIGIN);
  const utmParams = new URLSearchParams("utm_source=email&utm_medium=campaign");
  utmParams.set("utm_campaign", campaignSlug || "xmoso-product-selection");
  url.search = utmParams.toString();
  return url.toString();
}

function renderHighlights(highlights: string[]): string {
  const items = highlights
    .filter(Boolean)
    .slice(0, 4)
    .map(
      (highlight) =>
        `<li style="margin:0 0 6px 0;color:#3f4c45;font-size:14px;line-height:1.45">${escapeHtml(highlight)}</li>`,
    )
    .join("");

  if (!items) return "";
  return `<ul style="padding:0 0 0 18px;margin:12px 0 0 0">${items}</ul>`;
}

function renderProduct(product: CampaignProduct, input: CampaignInput): string {
  const productUrl = buildCampaignProductUrl(product, input.locale, input.campaignSlug);
  return `
    <tr>
      <td style="padding:0 0 24px 0">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border:1px solid #d9e1dc;background:#ffffff">
          <tr>
            <td width="220" valign="top" style="padding:18px">
              <img src="${escapeHtml(absoluteUrl(product.image))}" alt="${escapeHtml(product.model_number)}" width="184" style="display:block;width:184px;max-width:100%;height:auto;border:0" />
            </td>
            <td valign="top" style="padding:18px 18px 18px 0">
              <p style="margin:0 0 6px 0;color:#748178;font-size:12px;letter-spacing:0;text-transform:uppercase">${escapeHtml(product.model_number)}</p>
              <h2 style="margin:0;color:#10251b;font-size:20px;line-height:1.25;font-weight:700">${escapeHtml(product.name)}</h2>
              ${product.description ? `<p style="margin:10px 0 0 0;color:#4f5c54;font-size:14px;line-height:1.55">${escapeHtml(product.description)}</p>` : ""}
              ${renderHighlights(product.highlights)}
              <table role="presentation" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin-top:16px">
                <tr>
                  <td style="background:#0f7a3b;padding:10px 16px">
                    <a href="${escapeHtml(productUrl)}" style="color:#ffffff;text-decoration:none;font-size:14px;font-weight:700">View Product</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>`;
}

export function buildCampaignEmailHtml(input: CampaignInput): string {
  const safeSubject = escapeHtml(input.subject || "Selected Xmoso Products");
  const safeIntro = escapeHtml(input.intro || "Here are selected Xmoso products for your upcoming projects.");
  const productRows = input.products.map((product) => renderProduct(product, input)).join("");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${safeSubject}</title>
</head>
<body style="margin:0;padding:0;background:#eef3f0;font-family:Arial,Helvetica,sans-serif;color:#10251b">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#eef3f0">
    <tr>
      <td align="center" style="padding:28px 14px">
        <table role="presentation" width="680" cellspacing="0" cellpadding="0" style="border-collapse:collapse;width:680px;max-width:100%">
          <tr>
            <td style="background:#10251b;padding:24px 26px;color:#ffffff">
              <p style="margin:0 0 8px 0;color:#8fd1a8;font-size:13px;letter-spacing:0;text-transform:uppercase">Xmoso Commercial Cooling</p>
              <h1 style="margin:0;color:#ffffff;font-size:28px;line-height:1.18;font-weight:700">${safeSubject}</h1>
              <p style="margin:14px 0 0 0;color:#dbe7df;font-size:15px;line-height:1.6">${safeIntro}</p>
            </td>
          </tr>
          <tr>
            <td style="background:#f8fbf9;padding:24px 24px 0 24px">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse">
                ${productRows}
              </table>
            </td>
          </tr>
          <tr>
            <td style="background:#f8fbf9;padding:0 24px 28px 24px">
              <p style="margin:0;color:#5e6b63;font-size:13px;line-height:1.5">Need specifications, lead time, or regional model guidance? Contact Xmoso for project support.</p>
              <p style="margin:10px 0 0 0;color:#5e6b63;font-size:13px"><a href="${SITE_ORIGIN}/contact" style="color:#0f7a3b;text-decoration:underline">Contact Xmoso</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function buildCampaignPlainText(input: CampaignInput): string {
  const lines = [
    input.subject || "Selected Xmoso Products",
    "",
    input.intro || "Here are selected Xmoso products for your upcoming projects.",
    "",
  ];

  for (const product of input.products) {
    lines.push(`${product.model_number} - ${product.name}`);
    if (product.description) lines.push(product.description);
    for (const highlight of product.highlights.filter(Boolean).slice(0, 4)) {
      lines.push(`- ${highlight}`);
    }
    lines.push(buildCampaignProductUrl(product, input.locale, input.campaignSlug));
    lines.push("");
  }

  lines.push("Contact Xmoso: https://xmoso.com/contact");
  return lines.join("\n");
}

export function buildInstantlyLeadCsvTemplate(input: CampaignInput): string {
  const productModels = input.products
    .map((product) => product.model_number)
    .filter(Boolean)
    .join(" | ");
  const productLinks = input.products
    .map((product) => buildCampaignProductUrl(product, input.locale, input.campaignSlug))
    .join(" | ");
  const sampleRow = [
    "buyer@example.com",
    "First",
    "Last",
    "Company",
    "https://example.com",
    "EU",
    "Sales Owner",
    productModels,
    productLinks,
    input.campaignSlug || "xmoso-product-selection",
    input.subject || "Selected Xmoso Products",
  ];

  return [
    INSTANTLY_CSV_HEADERS.join(","),
    sampleRow.map(escapeCsv).join(","),
  ].join("\n");
}
