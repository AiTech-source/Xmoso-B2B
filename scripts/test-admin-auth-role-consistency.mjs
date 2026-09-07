import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const rolesSource = readFileSync("src/lib/admin-roles.ts", "utf8");
const loginSource = readFileSync("src/app/admin/login/page.tsx", "utf8");
const protectedLayoutSource = readFileSync("src/app/admin/(protected)/layout.tsx", "utf8");
const adminAuthSource = readFileSync("src/lib/admin-auth.ts", "utf8");

assert.match(rolesSource, /export function getAdminRole/);
assert.match(rolesSource, /app_metadata/);
assert.match(rolesSource, /user_metadata/);
assert.match(loginSource, /import \{ getAdminRole \}/);
assert.match(protectedLayoutSource, /import \{ getAdminRole \}/);
assert.match(adminAuthSource, /import \{ getAdminRole \}/);

console.log("Admin auth role consistency checks passed.");
