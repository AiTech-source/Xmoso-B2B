// Vercel Cron — keeps server warm, prevents cold starts
import { NextResponse } from "next/server";

export async function GET() {
  Promise.all([
    fetch("https://xmoso.com").catch(() => {}),
    fetch("https://xmoso.com/products/xbi70d-wine-cooler").catch(() => {}),
  ]);
  return NextResponse.json({ ok: true, ts: Date.now() });
}
