# Email Campaign Builder Design

## Purpose

Build a lightweight email promotion workflow inside the existing Xmoso admin. Admin users can choose product models, generate a polished product-promotion email, send a test email, and copy the final HTML into an external email platform.

## Scope

The first version is a campaign builder, not a bulk email platform. It does not store subscriber lists, send mass campaigns, process unsubscribes, or track opens. Those functions belong in a professional email service such as Brevo, Mailchimp, SendGrid, Resend, or Amazon SES.

Sales ownership, regional assignment, customer segmentation, and account-level permissions are explicitly deferred to phase two. The MVP should avoid modeling customers in a way that blocks that future work.

## User Workflow

1. Admin opens `Campaigns` in the admin sidebar.
2. Admin selects locale, subject line, intro copy, campaign slug, and product models.
3. The page shows a live email preview with product images, model numbers, product names, core highlights, and CTA buttons.
4. Admin sends a test email to one address using the existing SMTP settings.
5. Admin copies the generated HTML for use in a marketing email platform.
6. Each product CTA links to the canonical product page with UTM parameters.

## Architecture

The builder reuses existing product data and SMTP configuration. A shared server-side email rendering module creates client-safe previews and send-ready HTML. Admin APIs require the same Supabase admin authentication used by existing settings and test-email routes.

## Data Sources

- `products`: model number, image gallery, highlights, style, active status, sort order.
- `product_translations`: localized slug, name, and description.
- `site_settings`: SMTP settings and footer email.

No new database tables are required for the MVP.

## Routes

- `/admin/campaigns`: Admin UI for creating product-promotion emails.
- `/api/email-campaign/preview`: Authenticated POST endpoint that returns generated email HTML, plain text, landing URLs, and product data.
- `/api/email-campaign/test-send`: Authenticated POST endpoint that sends the generated email to one test recipient.

## Email Content Rules

- Use table-based email HTML with inline CSS for Outlook and Gmail compatibility.
- Use absolute image URLs.
- Include a visible product image, product name, model number, up to four highlights, and CTA button per product.
- CTA links point to `https://xmoso.com/products/{slug}` for English and `https://xmoso.com/{locale}/products/{slug}` for other locales.
- Add UTM parameters: `utm_source=email`, `utm_medium=campaign`, and `utm_campaign={campaignSlug}`.
- Include a small footer linking to `https://xmoso.com/contact`.

## Safety And Compliance

- MVP sends only test emails to a manually entered recipient.
- It does not import customer lists or bulk send.
- It does not bypass unsubscribe requirements.
- SMTP failures are shown clearly and do not mutate product data.

## Phase Two Account Model

Later versions should connect campaigns to business users and customer ownership:

- Admin users can manage all campaigns, customers, regions, and templates.
- Sales users can see only assigned regions, customer groups, and campaign history.
- Customers can be tagged by country, region, buyer type, language, interested product types, and assigned salesperson.
- Campaigns can be scoped to an owner, region, locale, product set, and target segment.
- Sending should move from SMTP to a professional email platform with unsubscribe, bounce handling, suppression lists, and delivery analytics.

## Testing

- Add a Node verification script for campaign email rendering.
- Verify generated links include UTM parameters.
- Verify HTML includes selected product models, images, highlights, and CTA buttons.
- Verify preview and test-send routes enforce admin authentication by following the existing `getAdminUser` pattern.
- Run targeted lint for new campaign files and `npm run build`.
