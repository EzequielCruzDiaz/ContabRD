"use client";

import { useRef } from "react";

interface FacturaUploadProps {
  onUploaded?: (data: unknown) => void;
}

export default function FacturaUpload({ onUploaded }: FacturaUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/factura", { method: "POST", body: formData });
    const data = await res.json();
    onUploaded?.(data);
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={handleFile}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="rounded-lg border border-gray-300 p-2 text-gray-500 hover:bg-gray-100 transition-colors"
        title="Subir factura"
      >
        📎
      </button>
    </>
  );
}
