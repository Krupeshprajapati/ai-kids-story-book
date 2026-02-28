"use client";

import { useEffect, useState } from "react";
import { API_BASE } from "@/lib/api";
import { useParams, useRouter } from "next/navigation";

export default function GeneratePage() {
  const { orderId } = useParams();
  const router = useRouter();
  const [message, setMessage] = useState("✨ Preparing magic...");

  useEffect(() => {
    if (!orderId) return;

    const generateBook = async () => {
      try {
        setMessage("📖 Writing your magical story...");

        const res = await fetch(`${API_BASE}/generate-book/${orderId}`, {
          method: "POST",
        });

        if (!res.ok) {
          throw new Error("Generation failed");
        }

        const data = await res.json();

        if (data.pdf_url) {
          setMessage("🎉 Almost done... opening your book!");
          setTimeout(() => {
            router.push(`/book/${orderId}`);
          }, 1000);
        } else {
          throw new Error("Invalid response");
        }
      } catch (error) {
        console.error(error);
        setMessage("❌ Something went wrong. Please try again.");
      }
    };

    generateBook();
  }, [orderId]);

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-gradient-to-br from-pink-200 via-purple-200 to-blue-200 text-white text-center px-6">
      
      <h1 className="text-4xl font-bold animate-pulse mb-6">
        ✨ Generating Your Magical Book ✨
      </h1>

      <p className="text-xl opacity-90">
        {message}
      </p>

      <div className="mt-10 text-4xl animate-bounce">
        📖 🌈 ⭐ 🦄
      </div>

    </div>
  );
}