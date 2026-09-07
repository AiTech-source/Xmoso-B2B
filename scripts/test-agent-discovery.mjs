import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import assert from "node:assert/strict";

const root = process.cwd();

function readRequired(relativePath) {
  return readFileSync(join(root, relativePath), "utf8");
}

function parseJson(relativePath) {
  return JSON.parse(readRequired(relativePath));
}

const llms = readRequired("public/llms.txt");
assert.match(llms, /Xmoso/i);
assert.match(llms, /wine cool/i);
assert.match(llms, /sitemap-index\.xml/);

const skillPath = "public/.well-known/agent-skills/xmoso-site-profile.md";
const skillBody = readRequired(skillPath);
assert.match(skillBody, /Xmoso Site Profile/i);
assert.match(skillBody, /products/i);

const skillSha = createHash("sha256").update(skillBody).digest("hex");
const skillIndex = parseJson("public/.well-known/agent-skills/index.json");
assert.equal(skillIndex.$schema, "https://agentskills.io/schemas/agent-skills-index-v0.2.json");
assert.ok(Array.isArray(skillIndex.skills));
const siteProfile = skillIndex.skills.find((skill) => skill.name === "xmoso-site-profile");
assert.ok(siteProfile, "xmoso-site-profile skill is indexed");
assert.equal(siteProfile.url, "https://xmoso.com/.well-known/agent-skills/xmoso-site-profile.md");
assert.equal(siteProfile.sha256, skillSha);

const openapi = parseJson("public/openapi.json");
assert.equal(openapi.openapi, "3.1.0");
for (const apiPath of ["/api/products-by-type", "/api/product-compare", "/api/categories", "/api/faqs"]) {
  assert.ok(openapi.paths?.[apiPath], `${apiPath} is described in OpenAPI`);
}

const apiCatalogRoute = readRequired("src/app/.well-known/api-catalog/route.ts");
assert.match(apiCatalogRoute, /application\/linkset\+json/);
assert.match(apiCatalogRoute, /service-desc/);
assert.match(apiCatalogRoute, /service-doc/);
assert.match(apiCatalogRoute, /status/);

const proxySource = readRequired("src/proxy.ts");
assert.match(proxySource, /\.well-known/, "proxy must not run next-intl for .well-known discovery routes");
assert.match(proxySource, /txt/, "proxy must not run next-intl for root text discovery files such as llms.txt");

const dnsAidDoc = readRequired("docs/dns-aid-xmoso.md");
assert.match(dnsAidDoc, /_index\._agents\.xmoso\.com/);
assert.match(dnsAidDoc, /DNSSEC/);

console.log("Agent discovery artifacts verified.");
