import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync("src/app/layout.tsx", "utf8");

assert.match(source, /themeScript/);
assert.match(source, /!isAdminRoute && themeScript/);

console.log("Admin theme hydration checks passed.");
