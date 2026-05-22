import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { chatCompletion } from "@/lib/ai/client";
import { SYSTEM_PROMPT } from "@/lib/ai/prompts";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { message, history } = await req.json();

    if (!message?.trim()) {
      return NextResponse.json({ error: "Mensaje vacío" }, { status: 400 });
    }

    let reply = "";
    try {
      reply = await chatCompletion(
        [...(history ?? []), { role: "user", content: message }],
        SYSTEM_PROMPT
      );
    } catch (aiErr) {
      console.error("[chat] AI error:", aiErr);
      return NextResponse.json(
        { error: "El servicio de IA no está disponible. Intenta de nuevo en unos segundos." },
        { status: 502 }
      );
    }

    if (!reply) {
      return NextResponse.json(
        { error: "El asistente no pudo generar una respuesta. Intenta de nuevo." },
        { status: 502 }
      );
    }

    // Persist async — don't fail the response if this errors
    const { data: profile } = await supabase
      .from("profiles")
      .select("empresa_id")
      .eq("id", user.id)
      .single();

    supabase.from("chat_mensajes").insert([
      { empresa_id: profile?.empresa_id, usuario_id: user.id, rol: "user",      contenido: message },
      { empresa_id: profile?.empresa_id, usuario_id: user.id, rol: "assistant", contenido: reply  },
    ]).then(({ error }) => { if (error) console.error("[chat] persist error:", error.message); });

    return NextResponse.json({ reply });
  } catch (err) {
    console.error("[chat] unhandled error:", err);
    return NextResponse.json({ error: "Error interno del servidor." }, { status: 500 });
  }
}
