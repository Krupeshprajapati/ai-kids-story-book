"use client";

import { useParams } from "next/navigation";
import { API_BASE } from "@/lib/api";

export default function DownloadPage() {
  const { orderId } = useParams();

  return (
    <div className="h-screen flex flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-bold">Your Book is Ready 🎉</h1>

      <a
        href={`${API_BASE}/generate-pdf/${orderId}`}
        className="px-6 py-2 bg-green-600 text-white rounded"
      >
        Download PDF
      </a>
    </div>
  );
}