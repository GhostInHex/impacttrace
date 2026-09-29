import { NextResponse } from "next/server";
import { getProviderStatus } from "@/lib/provider-status";

export const runtime = "nodejs";
// Provider state is in-process, so this must never be cached.
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(getProviderStatus(), {
    headers: { "Cache-Control": "no-store" },
  });
}
