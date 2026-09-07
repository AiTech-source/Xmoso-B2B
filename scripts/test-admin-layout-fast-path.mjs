import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const layoutSource = readFileSync("src/app/layout.tsx", "utf8");
const proxySource = readFileSync("src/proxy.ts", "utf8");

assert.match(proxySource, /x-xmoso-admin-route/);
assert.match(proxySource, /NextResponse\.next\(\{ request: \{ headers/);
assert.match(layoutSource, /x-xmoso-admin-route/);
assert.match(layoutSource, /isAdminRoute/);
assert.match(layoutSource, /if \(!isAdminRoute\)/);

console.log("Admin layout fast-path checks passed.");
