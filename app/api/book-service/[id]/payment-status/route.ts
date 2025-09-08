import { NextRequest, NextResponse } from "next/server";
import * as StatusRoute from "../status/route";

export const runtime = 'nodejs';

// Delegate GET to the existing status handler to keep behavior consistent
export async function GET(request: NextRequest, context: { params: { id: string } }) {
  try {
    return await (StatusRoute as any).GET(request, context);
  } catch (error) {
    console.error("payment-status alias error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


