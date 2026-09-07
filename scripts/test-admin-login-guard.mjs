import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync("src/app/admin/login/page.tsx", "utf8");

assert.match(source, /if \(!supabase\)/);
assert.match(source, /useState\(Boolean\(supabase\)\)/);
assert.match(source, /Admin login is not configured/);
assert.match(source, /getAdminRole/);
assert.match(source, /setAlreadyLoggedIn\(true\)/);
assert.match(source, /await supabase\.auth\.signOut\(\)/);
assert.match(source, /AUTH_CHECK_TIMEOUT_MS/);
assert.match(source, /Promise\.race/);
assert.match(source, /Session check timed out/);

console.log("Admin login Supabase guard checks passed.");
