"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { API_BASE } from "@/lib/api";
import { motion } from "framer-motion";
import BookReader from "@/app/components/BookReader";

export default function BookPage() {
  const { orderId } = useParams();
  const router = useRouter();
  const [book, setBook] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBook() {
      try {
        const res = await fetch(`${API_BASE}/book/${orderId}`);
        if (res.ok) {
          const data = await res.json();
          setBook(data);
        } else {
          console.error("Failed to fetch book");
        }
      } catch (err) {
        console.error("Error fetching book:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchBook();
  }, [orderId]);

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center text-center bg-gradient-to-br from-purple-700 to-indigo-900 text-white font-bold">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="text-6xl mb-4"
        >
          🪄
        </motion.div>
        <div className="text-2xl tracking-widest uppercase">✨ Opening Magic...</div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="h-screen flex flex-col items-center justify-center text-center bg-[#1a1a1a] text-white p-6">
        <div className="text-8xl mb-6">😢</div>
        <h1 className="text-4xl font-black mb-4">Story Not Found</h1>
        <p className="text-gray-400 mb-8 max-w-md">We couldn't find your magical story. It might have vanished into another dimension!</p>
        <button
          onClick={() => router.push('/library')}
          className="px-8 py-3 bg-purple-600 rounded-full font-bold hover:bg-purple-700 transition-all"
        >
          Back to Library
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center p-4 md:p-10"
      style={{
        background: "radial-gradient(circle at center, #1a1a1a, #000000)",
      }}>

      {/* Back to Library Button */}
      <button
        onClick={() => router.push('/library')}
        className="absolute top-6 left-6 z-[110] px-6 py-2 bg-white/10 hover:bg-white/20 text-white font-bold rounded-full backdrop-blur-md transition-all border border-white/20 flex items-center gap-2"
      >
        <span>⬅️</span> Library
      </button>

      {/* Close Button / X */}
      <button
        onClick={() => router.push('/')}
        className="absolute top-6 right-6 z-[110] text-white/50 hover:text-white transition-colors text-4xl"
      >
        ✕
      </button>

      <BookReader
        title={book.title}
        pages={book.pages}
        coverImage={book.cover_image}
        onSave={() => alert("Your magic story is already safe in your library! ✨")}
      />

      {/* Ambient Background Elements */}
      <div className="absolute top-1/4 left-10 w-64 h-64 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-10 w-80 h-80 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>
    </div>
  );
}
