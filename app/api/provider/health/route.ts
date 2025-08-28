import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ 
    status: "healthy", 
    message: "Provider API health check", 
    timestamp: new Date().toISOString() 
  });
}
