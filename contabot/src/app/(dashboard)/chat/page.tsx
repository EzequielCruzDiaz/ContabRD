import ChatWindow from "@/components/chat/ChatWindow";

export default function ChatPage() {
  return (
    <div className="flex flex-col h-full">
      <h1 className="text-2xl font-bold mb-4">Asistente Contable</h1>
      <ChatWindow />
    </div>
  );
}
