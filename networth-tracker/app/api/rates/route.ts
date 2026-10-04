import { NextResponse } from "next/server";
import { CURRENCIES } from "@/lib/currency";

export const dynamic = "force-dynamic";

// Free, no-key exchange rates (USD base), cached for an hour.
export async function GET() {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error(`upstream ${res.status}`);
    const data = await res.json();
    const rates: Record<string, number> = {};
    for (const c of CURRENCIES) {
      if (typeof data.rates?.[c] === "number") rates[c] = data.rates[c];
    }
    return NextResponse.json({ rates, updated: data.time_last_update_utc ?? null });
  } catch {
    return NextResponse.json({ error: "Exchange rates unavailable" }, { status: 502 });
  }
}
