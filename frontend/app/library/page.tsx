"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import FlashScreen from "../components/FlashScreen";

export default function LibraryPage() {
  const [books, setBooks] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const router = useRouter();
  const [showFlash, setShowFlash] = useState(true);

  useEffect(() => { fetchBooks(); }, []);

  const fetchBooks = async () => {
    try {
      const res = await fetch(`${API_BASE}/books`);
      const data = await res.json();
      setBooks(data || []);
    } catch { console.error("Failed to fetch books"); }
  };

  const handleRemoveBook = async (e: any, id: string) => {
    e.stopPropagation();
    if (!confirm("Delete this story? 😢")) return;
    try {
      const res = await fetch(`${API_BASE}/book/${id}`, { method: "DELETE" });
      if (res.ok) setBooks(books.filter((b) => b._id !== id));
    } catch { console.error("Failed to delete book"); }
  };

  const filtered = books.filter(b =>
    !search || b.title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: "linear-gradient(160deg, #0d0b1e 0%, #12082e 40%, #0a1628 100%)" }}>
      <AnimatePresence>
        {showFlash && (
          <FlashScreen
            key="flash-library"
            emoji="📚"
            title="Kids World Library"
            tagline="Opening your magical collection... ✨"
            onDone={() => setShowFlash(false)}
            bgColor="radial-gradient(circle, #7c3aed 0%, #1a0533 100%)"
          />
        )}
      </AnimatePresence>

      {/* ── HERO HEADER ── */}
      <div className="relative overflow-hidden pt-24 pb-10 px-4 sm:px-8 text-center">
        {/* Ambient glows */}
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full blur-[120px] pointer-events-none opacity-20" style={{ background: "#7c3aed" }} />
        <div className="absolute top-10 right-1/4 w-80 h-80 rounded-full blur-[100px] pointer-events-none opacity-15" style={{ background: "#ec4899" }} />

        {/* Floating decorations */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {["📖", "📚", "✨", "🌟", "🎨", "📖"].map((emoji, i) => (
            <motion.div key={i}
              animate={{ y: [0, -16, 0], rotate: [0, i % 2 === 0 ? 8 : -8, 0] }}
              transition={{ duration: 3 + i * 0.5, repeat: Infinity, delay: i * 0.4 }}
              className="absolute text-3xl sm:text-4xl opacity-15"
              style={{ left: `${8 + i * 16}%`, top: `${20 + (i % 3) * 20}%` }}>
              {emoji}
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }}>
          <div className="inline-flex items-center gap-3 mb-3">
            <span className="text-4xl sm:text-5xl">📚</span>
            <h1 className="text-3xl sm:text-5xl md:text-7xl font-black text-white tracking-tight leading-none"
              style={{ fontFamily: "var(--font-caveat), cursive", textShadow: "0 0 40px rgba(124,58,237,0.6)" }}>
              My Story Library
            </h1>
          </div>
          <p className="text-purple-300 text-sm sm:text-base font-medium mb-6">
            {books.length} magical {books.length === 1 ? "story" : "stories"} in your collection ✨
          </p>

          {/* Search bar */}
          <div className="relative max-w-md mx-auto mb-6">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg">🔍</span>
            <input
              suppressHydrationWarning
              type="text"
              placeholder="Search your stories..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-12 pr-5 py-3 rounded-full text-white font-medium outline-none transition-all"
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1.5px solid rgba(255,255,255,0.15)",
                backdropFilter: "blur(10px)",
                fontFamily: "var(--font-caveat), cursive",
                fontSize: "1.1rem",
              }}
            />
          </div>

          {/* Create CTA */}
          <motion.button
            whileHover={{ scale: 1.06, boxShadow: "0 0 40px rgba(236,72,153,0.5)" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push("/personalized")}
            className="inline-flex items-center gap-2 px-6 sm:px-10 py-3 sm:py-4 rounded-full font-black text-white text-base sm:text-xl"
            style={{
              background: "linear-gradient(135deg, #ec4899, #a855f7)",
              boxShadow: "0 8px 30px rgba(168,85,247,0.4)",
              fontFamily: "var(--font-caveat), cursive",
            }}>
            ✨ Create New Story
          </motion.button>
        </motion.div>
      </div>

      {/* ── ALL BOOKS GRID ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pb-24">
        {filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-center mt-20 space-y-4">
            <div className="text-7xl">🏰</div>
            <h3 className="text-2xl font-black text-white" style={{ fontFamily: "var(--font-caveat), cursive" }}>
              {search ? "No stories found!" : "Your library is empty!"}
            </h3>
            <p className="text-purple-300">{search ? "Try a different search" : "Create your first magical story 🌟"}</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
            {filtered.map((book, idx) => (
              <BookCard key={book._id} book={book} idx={idx}
                onClick={() => router.push(`/book/${book._id}`)}
                onDelete={handleRemoveBook} />
            ))}

            {/* + New Story card */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              whileHover={{ scale: 1.04, borderColor: "rgba(168,85,247,0.5)" }}
              onClick={() => router.push("/personalized")}
              className="cursor-pointer rounded-2xl flex flex-col items-center justify-center gap-2 transition-all"
              style={{
                aspectRatio: "9/14",
                background: "rgba(255,255,255,0.03)",
                border: "2px dashed rgba(255,255,255,0.1)",
              }}>
              <div className="text-3xl text-white/20">+</div>
              <span className="text-white/25 text-xs font-bold text-center px-2"
                style={{ fontFamily: "var(--font-caveat), cursive", fontSize: "0.85rem" }}>
                New Story
              </span>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── BOOK CARD ──
function BookCard({ book, idx, onClick, onDelete }: any) {
  const [hover, setHover] = useState(false);

  // Accent color per card based on index
  const accents = ["#7c3aed", "#0ea5e9", "#f59e0b", "#10b981", "#ec4899", "#6366f1", "#f97316", "#06b6d4"];
  const accent = accents[idx % accents.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.04 }}
      whileHover={{ y: -8, scale: 1.04 }}
      className="cursor-pointer relative group"
      style={{ aspectRatio: "9/14" }}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className="w-full h-full rounded-2xl overflow-hidden relative shadow-xl"
        style={{
          borderLeft: `4px solid ${accent}`,
          boxShadow: hover
            ? `0 20px 50px rgba(0,0,0,0.6), 0 0 24px ${accent}55`
            : "0 6px 20px rgba(0,0,0,0.4)",
          transition: "box-shadow 0.3s",
        }}>

        {/* Cover image */}
        {book.cover_image ? (
          <img
            src={book.cover_image.startsWith("http") ? book.cover_image : `${API_BASE}${book.cover_image}`}
            alt={book.title}
            className="absolute inset-0 w-full h-full object-cover object-top"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        ) : (
          <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${accent}88, #1a1a2e)` }} />
        )}

        {/* Bottom gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />

        {/* Delete button */}
        <AnimatePresence>
          {hover && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={(e) => onDelete(e, book._id)}
              className="absolute top-2 right-2 z-30 w-6 h-6 sm:w-7 sm:h-7 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-[10px] text-white shadow-lg"
            >
              ✕
            </motion.button>
          )}
        </AnimatePresence>

        {/* Read button on hover */}
        <AnimatePresence>
          {hover && (
            <motion.div
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              className="absolute inset-0 flex items-center justify-center z-20"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-lg sm:text-xl shadow-xl"
                style={{ background: "rgba(255,255,255,0.92)", boxShadow: `0 0 24px ${accent}` }}>
                📖
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Title */}
        <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-2.5 z-10">
          <h4 className="text-white font-black leading-tight line-clamp-2 text-center drop-shadow-lg"
            style={{
              fontFamily: "var(--font-caveat), cursive",
              fontSize: "clamp(0.65rem, 1.8vw, 0.85rem)",
              textShadow: "0 1px 6px rgba(0,0,0,1)"
            }}>
            {book.title || "Magic Story"}
          </h4>
        </div>
      </div>
    </motion.div>
  );
}