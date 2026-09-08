import assert from "node:assert/strict";
import {
  buildUniqueSlug,
  createCronBacklogRequests,
  isBacklogCandidate,
  slugifyKeyword,
} from "../src/lib/seo/keyword-backlog.ts";

assert.equal(
  slugifyKeyword("Triple-pane Low-E glass door flame test for wine cooler"),
  "triple-pane-low-e-glass-door-flame-test-for-wine-cooler",
);

assert.equal(
  buildUniqueSlug("wine cooler ventilation", new Set(["wine-cooler-ventilation"])),
  "wine-cooler-ventilation-2",
);

assert.equal(
  buildUniqueSlug("wine cooler ventilation", new Set(["wine-cooler-ventilation", "wine-cooler-ventilation-2"])),
  "wine-cooler-ventilation-3",
);

assert.equal(
  isBacklogCandidate({
    status: "new",
    content_type: "blog",
    locale: "en",
    priority: 80,
  }),
  true,
);

assert.equal(
  isBacklogCandidate({
    status: "published",
    content_type: "blog",
    locale: "en",
    priority: 80,
  }),
  false,
);

assert.deepEqual(createCronBacklogRequests(2, "en", 2), [
  { path: "/api/seo/generate-blog", body: { fromBacklog: "true", content_type: "blog", locale: "en" } },
  { path: "/api/seo/generate-blog", body: { fromBacklog: "true", content_type: "blog", locale: "en" } },
]);

assert.deepEqual(createCronBacklogRequests(3, "en", 1), [
  { path: "/api/seo/generate", body: { fromBacklog: "true", content_type: "insight", locale: "en" } },
]);

console.log("SEO keyword backlog behavior checks passed.");
