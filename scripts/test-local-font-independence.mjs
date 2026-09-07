import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync("src/app/layout.tsx", "utf8");

assert.doesNotMatch(source, /next\/font\/google/);
assert.doesNotMatch(source, /fonts\.googleapis\.com/);
assert.doesNotMatch(source, /fonts\.gstatic\.com/);
assert.doesNotMatch(source, /inter\.className/);

console.log("Local font independence checks passed.");
