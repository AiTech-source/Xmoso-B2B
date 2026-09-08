import assert from "node:assert/strict";
import {
  buildUniqueSlug,
  createCronBacklogRequests,
  isBacklogCandidate,
  listBacklogItems,
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

function createEmptyBacklogSupabase() {
  const inserted = [];
  return {
    inserted,
    from(table) {
      assert.equal(table, "seo_keyword_backlog");
      return {
        select(_columns, options) {
          if (options?.head) return Promise.resolve({ count: inserted.length, error: null });
          return this;
        },
        order() { return this; },
        eq() { return this; },
        limit() {
          return Promise.resolve({ data: [], error: null });
        },
        insert(rows) {
          inserted.push(...rows);
          return {
            select() {
              return {
                single() {
                  return Promise.resolve({ data: rows[0], error: null });
                },
              };
            },
          };
        },
      };
    },
  };
}

const emptySupabase = createEmptyBacklogSupabase();
const seededRows = await listBacklogItems(emptySupabase, { status: "new", locale: "en" });
assert.equal(emptySupabase.inserted.length > 0, true);
assert.equal(seededRows.length > 0, true);
assert.equal(seededRows.every((row) => row.status === "new" && row.locale === "en"), true);
assert.equal(seededRows.some((row) => row.content_type === "blog"), true);
assert.equal(seededRows.some((row) => row.content_type === "insight"), true);

console.log("SEO keyword backlog behavior checks passed.");
