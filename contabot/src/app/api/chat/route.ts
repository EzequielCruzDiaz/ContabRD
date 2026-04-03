import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { messages } = await req.json();

  // TODO: integrar con lib/anthropic.ts
  return NextResponse.json({ message: "ok", messages });
}
