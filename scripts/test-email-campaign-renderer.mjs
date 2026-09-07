import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

function readSource(path) {
  assert.equal(existsSync(path), true, `${path} should exist`);
  return readFileSync(path, "utf8");
}

const campaignSource = readSource("src/lib/email/campaign.ts");
assert.match(campaignSource, /export interface CampaignProduct/);
assert.match(campaignSource, /export interface CampaignInput/);
assert.match(campaignSource, /export function buildCampaignProductUrl/);
assert.match(campaignSource, /utm_source=email/);
assert.match(campaignSource, /utm_medium=campaign/);
assert.match(campaignSource, /export function buildCampaignEmailHtml/);
assert.match(campaignSource, /export function buildCampaignPlainText/);
assert.match(campaignSource, /<table/);
assert.match(campaignSource, /View Product/);

const authSource = readSource("src/lib/admin-auth.ts");
assert.match(authSource, /export async function getAdminUser/);
assert.match(authSource, /export function adminRequiredResponse/);
assert.match(authSource, /super_admin/);
assert.match(authSource, /editor/);

const previewRouteSource = readSource("src/app/api/email-campaign/preview/route.ts");
assert.match(previewRouteSource, /getAdminUser/);
assert.match(previewRouteSource, /adminRequiredResponse/);
assert.match(previewRouteSource, /product_translations/);
assert.match(previewRouteSource, /buildCampaignEmailHtml/);
assert.match(previewRouteSource, /buildCampaignPlainText/);
assert.match(previewRouteSource, /productIds/);

const smtpSource = readSource("src/lib/email/smtp.ts");
assert.match(smtpSource, /site_settings/);
assert.match(smtpSource, /nodemailer\.createTransport/);
assert.match(smtpSource, /sendHtmlEmailWithSettings/);
assert.match(smtpSource, /to, subject, html, text/);

const inquirySendSource = readSource("src/lib/email/send.ts");
assert.match(inquirySendSource, /sendHtmlEmailWithSettings/);

const testSendRouteSource = readSource("src/app/api/email-campaign/test-send/route.ts");
assert.match(testSendRouteSource, /getAdminUser/);
assert.match(testSendRouteSource, /adminRequiredResponse/);
assert.match(testSendRouteSource, /buildCampaignEmailHtml/);
assert.match(testSendRouteSource, /sendHtmlEmailWithSettings/);
assert.match(testSendRouteSource, /to/);

const campaignPageSource = readSource("src/app/admin/(protected)/campaigns/page.tsx");
assert.match(campaignPageSource, /\/api\/products-by-type\?locale=/);
assert.match(campaignPageSource, /\/api\/email-campaign\/preview/);
assert.match(campaignPageSource, /\/api\/email-campaign\/test-send/);
assert.match(campaignPageSource, /iframe/);
assert.match(campaignPageSource, /navigator\.clipboard\.writeText/);
assert.match(campaignPageSource, /selectedProductIds/);

const sidebarSource = readSource("src/components/admin/AdminSidebar.tsx");
assert.match(sidebarSource, /\/admin\/campaigns/);
assert.match(sidebarSource, /Email Campaigns/);

console.log("Campaign email source checks passed.");
