import { NextResponse } from "next/server";
import { adminRequiredResponse, getAdminUser, noCacheHeaders } from "@/lib/admin-auth";
import {
  buildCampaignEmailHtml,
  buildCampaignPlainText,
  type CampaignInput,
  type CampaignProduct,
} from "@/lib/email/campaign";
import { cdnUrl } from "@/lib/cdn";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface CampaignRequestBody {
  locale?: string;
  campaignSlug?: string;
  subject?: string;
  intro?: string;
  productIds?: string[];
}

interface ProductRow {
  id: string;
  model_number: string;
  image_gallery?: Array<{ url?: string }> | null;
  highlights?: string[] | null;
}

interface TranslationRow {
  product_id: string;
  slug: string | null;
  name: string | null;
  description: string | null;
}

function cleanText(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function normalizeProductIds(productIds: unknown): string[] {
  if (!Array.isArray(productIds)) return [];
  return productIds.filter((id): id is string => typeof id === "string" && Boolean(id.trim()));
}

async function buildCampaignInput(
  supabase: NonNullable<Awaited<ReturnType<typeof getAdminUser>>>["supabase"],
  body: CampaignRequestBody,
): Promise<CampaignInput> {
  const productIds = normalizeProductIds(body.productIds);
  if (productIds.length === 0) {
    throw new Error("Select at least one product.");
  }

  const locale = cleanText(body.locale, "en").toLowerCase();
  const campaignSlug = cleanText(body.campaignSlug, "xmoso-product-selection");

  const { data: productRows, error: productError } = await supabase
    .from("products")
    .select("id, model_number, image_gallery, highlights")
    .eq("is_active", true)
    .in("id", productIds);

  if (productError) throw new Error(productError.message);

  const { data: translationRows, error: translationError } = await supabase
    .from("product_translations")
    .select("product_id, slug, name, description")
    .eq("locale", locale)
    .in("product_id", productIds);

  if (translationError) throw new Error(translationError.message);

  const productById = new Map(((productRows || []) as ProductRow[]).map((product) => [product.id, product]));
  const translationByProductId = new Map(
    ((translationRows || []) as TranslationRow[]).map((translation) => [
      translation.product_id,
      translation,
    ]),
  );

  const products: CampaignProduct[] = [];
  for (const id of productIds) {
    const product = productById.get(id);
    if (!product) continue;
    const translation = translationByProductId.get(id);
    const firstImage = product.image_gallery?.[0]?.url || "";
    products.push({
      id,
      slug: translation?.slug || product.model_number.toLowerCase(),
      name: translation?.name || product.model_number,
      model_number: product.model_number,
      image: cdnUrl(firstImage, 600, 75),
      highlights: product.highlights || [],
      description: translation?.description || "",
    });
  }

  if (products.length === 0) {
    throw new Error("No active products found for this selection.");
  }

  return {
    subject: cleanText(body.subject, "Selected Xmoso commercial cooling models"),
    intro: cleanText(body.intro, "A concise selection of Xmoso models for your upcoming projects."),
    locale,
    campaignSlug,
    products,
  };
}

export async function POST(request: Request) {
  const admin = await getAdminUser();
  if (!admin) return adminRequiredResponse();

  try {
    const body = (await request.json()) as CampaignRequestBody;
    const input = await buildCampaignInput(admin.supabase, body);
    const html = buildCampaignEmailHtml(input);
    const text = buildCampaignPlainText(input);

    return NextResponse.json(
      {
        html,
        text,
        products: input.products,
        subject: input.subject,
      },
      { headers: noCacheHeaders },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to generate campaign preview.";
    return NextResponse.json({ error: message }, { status: 400, headers: noCacheHeaders });
  }
}
