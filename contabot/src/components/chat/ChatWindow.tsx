"use client";

import { useState } from "react";
import ChatMessage from "./ChatMessage";
import FacturaUpload from "./FacturaUpload";
import Button from "@/components/ui/Button";
import type { Message } from "@/types";

export default function ChatWindow() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSend() {
    if (!input.trim()) return;
    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [...messages, userMessage] }),
    });
    const data = await res.json();
    setMessages((prev) => [...prev, { role: "assistant", content: data.reply ?? "" }]);
    setLoading(false);
  }

  return (
    <div className="flex flex-col h-full border border-gray-200 rounded-xl overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <ChatMessage key={i} message={msg} />
        ))}
        {loading && <p className="text-sm text-gray-400">Escribiendo...</p>}
      </div>
      <div className="border-t border-gray-200 p-4 flex gap-2 items-end">
        <FacturaUpload />
        <input
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
          placeholder="Escribe tu consulta contable..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
        />
        <Button onClick={handleSend} disabled={loading}>
          Enviar
        </Button>
      </div>
    </div>
  );
}
