"use client";

import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

// ─── Floating background characters ───────────────────────────────────────────
const BG_CHARS = [
  { e: "🦄", x: 6, y: 12, s: 64, d: 0 },
  { e: "🐉", x: 84, y: 8, s: 60, d: 0.4 },
  { e: "🧚", x: 3, y: 58, s: 52, d: 0.7 },
  { e: "🦋", x: 87, y: 52, s: 48, d: 0.2 },
  { e: "🌈", x: 14, y: 82, s: 56, d: 1.1 },
  { e: "🌙", x: 78, y: 78, s: 50, d: 0.5 },
  { e: "🍄", x: 48, y: 90, s: 42, d: 0.9 },
  { e: "⭐", x: 90, y: 30, s: 44, d: 0.3 },
  { e: "🌸", x: 22, y: 30, s: 46, d: 0.6 },
  { e: "🎠", x: 62, y: 5, s: 58, d: 0.8 },
];

// ─── Sparkle dots ──────────────────────────────────────────────────────────────
const SPARKLES_COUNT = 20; // Reduced for performance

// ─── Story cards shown below the buttons ──────────────────────────────────────
const STORY_CARDS = [
  { e: "🐻", title: "Brave Bear", color: "#FF6B6B", bg: "#FFF0F0" },
  { e: "🧜", title: "Mermaid Ocean", color: "#00C9B1", bg: "#F0FFFE" },
  { e: "🚀", title: "Space Bunny", color: "#A855F7", bg: "#F9F0FF" },
  { e: "🏰", title: "Magic Castle", color: "#F59E0B", bg: "#FFFBF0" },
];

import FlashScreen from "./components/FlashScreen";

// ─── Interactive character picker ─────────────────────────────────────────────
const HERO_CHARS = ["🧙", "🦊", "🐼", "🦁", "🐸", "🐨"];

// ══════════════════════════════════════════════════════════════════════════════
// MAIN HOME PAGE
// ══════════════════════════════════════════════════════════════════════════════
export default function Home() {
  const router = useRouter();
  const [showFlash, setShowFlash] = useState(true);
  const [mainVisible, setMainVisible] = useState(false);
  const [selectedChar, setSelectedChar] = useState(0);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [trail, setTrail] = useState<{ x: number; y: number; id: number }[]>([]);
  const [mounted, setMounted] = useState(false);
  const [sparkles, setSparkles] = useState<{ id: number, x: number, y: number, s: number, d: number, dur: number }[]>([]);

  // Setup client-side only values
  useEffect(() => {
    setMounted(true);
    const generatedSparkles = Array.from({ length: SPARKLES_COUNT }, (_, i) => ({
      id: i,
      x: (i * 17) % 100,
      y: (i * 23) % 100,
      s: (i % 5) + 5,
      d: i * 0.2,
      dur: 2 + (i % 3),
    }));
    setSparkles(generatedSparkles);
  }, []);

  // Custom sparkle cursor trail
  useEffect(() => {
    if (!mounted) return;
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouch) return;

    const handler = (e: MouseEvent) => {
      setCursorPos({ x: e.clientX, y: e.clientY });
      setTrail(prev => [...prev.slice(-10), { x: e.clientX, y: e.clientY, id: Date.now() + Math.random() }]);
    };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, [mounted]);

  const handleFlashDone = () => {
    setShowFlash(false);
    setTimeout(() => setMainVisible(true), 100);
  };

  if (!mounted) return null;

  return (
    <div style={{ fontFamily: "'Nunito', 'Fredoka One', sans-serif", cursor: "none" }} className="relative">

      {/* ── Cursor trail ── */}
      {trail.map((t, i) => (
        <motion.div
          key={t.id}
          className="fixed pointer-events-none z-[999] text-lg"
          style={{ left: t.x - 10, top: t.y - 10 }}
          initial={{ opacity: 1, scale: 1 }}
          animate={{ opacity: 0, scale: 0 }}
          transition={{ duration: 0.6 }}
        >
          {["✨", "⭐", "💫", "🌟"][i % 4]}
        </motion.div>
      ))}
      {/* Real cursor dot */}
      <motion.div
        className="fixed pointer-events-none z-[1000] w-5 h-5 rounded-full border-2 border-yellow-300 bg-white/20"
        style={{ left: cursorPos.x - 10, top: cursorPos.y - 10 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />

      <AnimatePresence>
        {showFlash && (
          <FlashScreen
            key="flash"
            emoji="📖"
            title="✨ Magic Story World ✨"
            tagline="Where Every Child is the Hero 🌟"
            onDone={handleFlashDone}
          />
        )}
      </AnimatePresence>

      {/* ── Main Page ── */}
      <AnimatePresence>
        {mainVisible && (
          <motion.div
            key="main"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="min-h-screen relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #667eea 0%, #f093fb 30%, #f5576c 55%, #fda085 80%, #ffecd2 100%)",
            }}
          >
            {/* ── Animated cloud layer ── */}
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute text-6xl opacity-20 select-none pointer-events-none"
                style={{ top: `${10 + i * 18}%` }}
                animate={{ x: ["-10%", "110%"] }}
                transition={{
                  duration: 18 + i * 5,
                  repeat: Infinity,
                  delay: i * 3,
                  ease: "linear",
                }}
              >
                ☁️
              </motion.div>
            ))}

            {/* ── Sparkle dots ── */}
            {sparkles.map(sp => (
              <motion.div
                key={sp.id}
                className="absolute rounded-full bg-white pointer-events-none"
                style={{ left: `${sp.x}%`, top: `${sp.y}%`, width: sp.s, height: sp.s, opacity: 0 }}
                animate={{ opacity: [0, 0.85, 0], scale: [0.5, 1.3, 0.5] }}
                transition={{ duration: sp.dur, repeat: Infinity, delay: sp.d, ease: "easeInOut" }}
              />
            ))}

            {/* ── Floating BG characters ── */}
            {BG_CHARS.map((c, i) => (
              <motion.div
                key={i}
                className="absolute select-none pointer-events-none"
                style={{ left: `${c.x}%`, top: `${c.y}%`, fontSize: c.s }}
                animate={{ y: [0, -22, 0], rotate: [-6, 6, -6], scale: [1, 1.12, 1] }}
                transition={{ duration: 3.5 + (i % 3), repeat: Infinity, delay: c.d, ease: "easeInOut" }}
              >
                {c.e}
              </motion.div>
            ))}

            {/* ══ HERO CONTENT ══ */}
            <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 pb-10 pt-6">

              {/* ── Character Picker ──
              <motion.div
                initial={{ y: -40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="mb-6"
              >
                <p className="text-white text-center font-bold text-lg mb-3 drop-shadow" style={{ textShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>
                  🎭 Choose Your Story Hero!
                </p>
                <div className="flex gap-3 justify-center">
                  {HERO_CHARS.map((c, i) => (
                    <motion.button
                      key={i}
                      onClick={() => setSelectedChar(i)}
                      whileHover={{ scale: 1.3, rotate: 10 }}
                      whileTap={{ scale: 0.9 }}
                      className="text-4xl rounded-2xl p-2 transition-all duration-200"
                      style={{
                        background: selectedChar === i
                          ? "rgba(255,255,255,0.9)"
                          : "rgba(255,255,255,0.25)",
                        boxShadow: selectedChar === i
                          ? "0 0 0 3px #FFD700, 0 4px 20px rgba(0,0,0,0.2)"
                          : "none",
                        border: "none",
                        cursor: "none",
                      }}
                    >
                      {c}
                    </motion.button>
                  ))}
                </div>
              </motion.div> */}

              {/* ── Title ── */}
              <motion.div
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.4 }}
                className="text-center mb-4"
              >
                {/* Bouncing letters */}
                <h1
                  className="font-extrabold text-white text-center leading-tight"
                  style={{
                    fontSize: "clamp(2.5rem, 7vw, 5rem)",
                    fontFamily: "'Fredoka One', cursive",
                    textShadow: "0 6px 0 rgba(0,0,0,0.15), 0 0 40px rgba(255,200,50,0.5)",
                    letterSpacing: "0.03em",
                  }}
                >
                  {"✨ Magic Story World ✨".split("").map((ch, i) => (
                    <motion.span
                      key={i}
                      className="inline-block"
                      animate={{ y: [0, -8, 0] }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: i * 0.07,
                        ease: "easeInOut",
                      }}
                    >
                      {ch === " " ? "\u00A0" : ch}
                    </motion.span>
                  ))}
                </h1>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="text-yellow-200 font-bold text-xl mt-2 drop-shadow-md"
                  style={{ fontFamily: "'Nunito', sans-serif", textShadow: "0 2px 8px rgba(0,0,0,0.3)" }}
                >
                  {/* {HERO_CHARS[selectedChar]}  */}
                  Your magical adventure starts here!
                </motion.p>
              </motion.div>

              {/* ── Big CTA Buttons ── */}
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.5 }}
                className="flex flex-col sm:flex-row gap-5 mb-10"
              >
                {/* Library button */}
                <motion.button
                  whileHover={{ scale: 1.08, rotate: -2 }}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => router.push("/library")}
                  className="relative px-10 py-5 text-2xl font-extrabold rounded-3xl overflow-hidden group"
                  style={{
                    background: "white",
                    color: "#7C3AED",
                    fontFamily: "'Fredoka One', cursive",
                    boxShadow: "0 8px 0 #C4B5FD, 0 12px 30px rgba(124,58,237,0.35)",
                    border: "none",
                    cursor: "none",
                  }}
                >
                  <span className="relative z-10">📚 Library</span>
                  {/* Shimmer */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12"
                    animate={{ x: ["-100%", "200%"] }}
                    transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1 }}
                  />
                </motion.button>

                {/* Create Story button */}
                <motion.button
                  whileHover={{ scale: 1.08, rotate: 2 }}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => router.push("/upload")}
                  className="relative px-10 py-5 text-2xl font-extrabold rounded-3xl overflow-hidden"
                  style={{
                    background: "linear-gradient(135deg, #10B981, #059669)",
                    color: "white",
                    fontFamily: "'Fredoka One', cursive",
                    boxShadow: "0 8px 0 #065F46, 0 12px 30px rgba(16,185,129,0.4)",
                    border: "none",
                    cursor: "none",
                  }}
                >
                  <span className="relative z-10">✨ Create Story</span>
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12"
                    animate={{ x: ["-100%", "200%"] }}
                    transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1.3 }}
                  />
                </motion.button>

                {/* Personalized Magic button */}
                <motion.button
                  whileHover={{ scale: 1.08, rotate: 2 }}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => router.push("/personalized")}
                  className="relative px-10 py-5 text-2xl font-extrabold rounded-3xl overflow-hidden"
                  style={{
                    background: "linear-gradient(135deg, #F59E0B, #EF4444)",
                    color: "white",
                    fontFamily: "'Fredoka One', cursive",
                    boxShadow: "0 8px 0 #92400E, 0 12px 30px rgba(239,68,68,0.4)",
                    border: "none",
                    cursor: "none",
                  }}
                >
                  <span className="relative z-10">🎭 Magic Personalized</span>
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12"
                    animate={{ x: ["-100%", "200%"] }}
                    transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1.5 }}
                  />
                </motion.button>
              </motion.div>

              {/* ── Story Preview Cards ── */}
              <motion.div
                initial={{ y: 60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.9, duration: 0.6 }}
                className="w-full max-w-2xl"
              >
                <p className="text-white/80 text-center font-bold mb-3 text-base" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.3)" }}>
                  📖 Popular Stories
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {STORY_CARDS.map((card, i) => (
                    <motion.div
                      key={i}
                      whileHover={{ scale: 1.1, rotate: i % 2 === 0 ? 3 : -3, y: -6 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => router.push("/library")}
                      className="rounded-2xl p-4 text-center flex flex-col items-center gap-1"
                      style={{
                        background: card.bg,
                        boxShadow: `0 6px 0 ${card.color}66, 0 8px 24px rgba(0,0,0,0.15)`,
                        cursor: "none",
                      }}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.1 + i * 0.1 }}
                    >
                      <span className="text-4xl">{card.e}</span>
                      <span className="text-xs font-extrabold" style={{ color: card.color, fontFamily: "'Fredoka One', cursive" }}>
                        {card.title}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* ── Fun fact ticker ── */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.4 }}
                className="mt-8 rounded-full px-6 py-3 text-white font-bold text-sm"
                style={{
                  background: "rgba(255,255,255,0.18)",
                  backdropFilter: "blur(8px)",
                  border: "2px solid rgba(255,255,255,0.35)",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                }}
              >
                <motion.span
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ duration: 4, repeat: Infinity }}
                >
                  🌟 Over 1000+ magical stories created by kids just like you!
                </motion.span>
              </motion.div>

            </div>

            {/* ── Bottom wave ── */}
            <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none" style={{ zIndex: 5 }}>
              <svg viewBox="0 0 1440 96" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                <path
                  d="M0,60 C240,100 480,20 720,60 C960,100 1200,20 1440,60 L1440,96 L0,96 Z"
                  fill="rgba(255,255,255,0.15)"
                />
                <path
                  d="M0,75 C200,110 400,40 720,75 C1040,110 1240,40 1440,75 L1440,96 L0,96 Z"
                  fill="rgba(255,255,255,0.1)"
                />
              </svg>
            </div>

          </motion.div>
        )}
      </AnimatePresence>

      {/* Google Fonts preload */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@700;800;900&display=swap');
      `}</style>
    </div>
  );
}