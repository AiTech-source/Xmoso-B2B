import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

function readSource(path) {
  assert.equal(existsSync(path), true, `${path} should exist`);
  return readFileSync(path, "utf8");
}

const backlogSource = readSource("src/lib/seo/keyword-backlog.ts");
assert.match(backlogSource, /export function createCronBacklogRequests/);
assert.match(backlogSource, /export async function claimNextBacklogItem/);
assert.match(backlogSource, /export function buildUniqueSlug/);
assert.match(backlogSource, /export async function markBacklogPublished/);
assert.match(backlogSource, /export async function markBacklogError/);
assert.match(backlogSource, /seo_keyword_backlog/);
assert.match(backlogSource, /site_settings/);

const backlogRouteSource = readSource("src/app/api/seo/keyword-backlog/route.ts");
assert.match(backlogRouteSource, /listBacklogItems/);
assert.match(backlogRouteSource, /insertBacklogItem/);
assert.match(backlogRouteSource, /x-api-key/);

const cronSource = readSource("src/app/api/seo/cron/route.ts");
assert.match(cronSource, /createCronBacklogRequests/);
assert.match(cronSource, /Tuesday - Blog backlog x2/);
assert.match(cronSource, /Wednesday - Insight backlog/);
assert.match(cronSource, /Friday - Blog backlog x2/);
assert.doesNotMatch(cronSource, /wine-cooler-oem-quality-control/);
assert.doesNotMatch(cronSource, /import-wine-coolers-china-guide/);
assert.doesNotMatch(cronSource, /wine-cooler-refrigeration-system-design/);

for (const routePath of ["src/app/api/seo/generate/route.ts", "src/app/api/seo/generate-blog/route.ts"]) {
  const source = readSource(routePath);
  assert.match(source, /fromBacklog/);
  assert.match(source, /claimNextBacklogItem/);
  assert.match(source, /buildUniqueSlug/);
  assert.match(source, /markBacklogPublished/);
  assert.match(source, /markBacklogError/);
}

const adminSeoSource = readSource("src/app/admin/(protected)/seo/page.tsx");
assert.match(adminSeoSource, /\/api\/seo\/keyword-backlog/);
assert.match(adminSeoSource, /Keyword Backlog/);

console.log("SEO automation backlog checks passed.");
