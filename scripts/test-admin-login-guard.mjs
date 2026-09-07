import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync("src/app/admin/login/page.tsx", "utf8");

assert.match(source, /if \(!supabase\)/);
assert.match(source, /useState\(Boolean\(supabase\)\)/);
assert.match(source, /Admin login is not configured/);

console.log("Admin login Supabase guard checks passed.");
