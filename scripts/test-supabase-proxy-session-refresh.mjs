import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync("src/proxy.ts", "utf8");

assert.match(source, /createServerClient/);
assert.match(source, /refreshSupabaseSession/);
assert.match(source, /await supabase\.auth\.getUser\(\)/);
assert.match(source, /request\.cookies\.set/);
assert.match(source, /response\.cookies\.set/);
assert.match(source, /export async function proxy/);

console.log("Supabase proxy session refresh checks passed.");
