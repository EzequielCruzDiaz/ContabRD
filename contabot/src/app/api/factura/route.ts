import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No se recibió imagen" }, { status: 400 });
  }

  // TODO: procesar imagen con Claude Vision
  return NextResponse.json({ extracted: {} });
}
