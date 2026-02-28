"use client";

import { useState, useEffect, useRef } from "react";
import { API_BASE } from "@/lib/api";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import FlashScreen from "../components/FlashScreen";

// ── Theme options kids can pick ────────────────────────────────────────────────
const THEMES = [
  { emoji: "🏰", label: "Castle", color: "#A855F7", bg: "linear-gradient(135deg,#E9D5FF,#C4B5FD)" },
  { emoji: "🌊", label: "Ocean", color: "#0EA5E9", bg: "linear-gradient(135deg,#BAE6FD,#7DD3FC)" },
  { emoji: "🚀", label: "Space", color: "#6366F1", bg: "linear-gradient(135deg,#C7D2FE,#A5B4FC)" },
  { emoji: "🌳", label: "Forest", color: "#22C55E", bg: "linear-gradient(135deg,#BBF7D0,#86EFAC)" },
  { emoji: "🦄", label: "Fantasy", color: "#EC4899", bg: "linear-gradient(135deg,#FBCFE8,#F9A8D4)" },
  { emoji: "🎪", label: "Circus", color: "#F59E0B", bg: "linear-gradient(135deg,#FDE68A,#FCD34D)" },
];

const LANGUAGES = [
  { label: "English", emoji: "🇬🇧" },
  { label: "Hindi", emoji: "🇮🇳" },
  { label: "Hinglish", emoji: "🇮🇳💬" },
];

const LOADING_STEPS = [
  { icon: "🧙", text: "Calling the Story Wizard...", dur: 2000 },
  { icon: "📜", text: "Writing magical words...", dur: 2500 },
  { icon: "🎨", text: "Painting colorful pictures...", dur: 2500 },
  { icon: "✨", text: "Sprinkling fairy dust...", dur: 2000 },
  { icon: "🌈", text: "Adding rainbow colors...", dur: 2000 },
  { icon: "🦄", text: "The unicorn is checking it...", dur: 2000 },
  { icon: "🔮", text: "Crystal ball says: Almost ready!", dur: 1500 },
  { icon: "📖", text: "Your story is coming to life!", dur: 1500 },
];

const BG_FLOATS = [
  { e: "⭐", x: 5, y: 10, s: 50, d: 0 },
  { e: "🌙", x: 88, y: 8, s: 48, d: 0.3 },
  { e: "🌸", x: 3, y: 65, s: 44, d: 0.7 },
  { e: "🦋", x: 90, y: 60, s: 42, d: 0.2 },
  { e: "🍀", x: 12, y: 85, s: 40, d: 1 },
  { e: "🎈", x: 82, y: 82, s: 46, d: 0.5 },
];

function Confetti() {
  const colors = ["#FF6B6B", "#FFD93D", "#6BCB77", "#4D96FF", "#FF6BFF", "#FF9F43"];
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {Array.from({ length: 60 }, (_, i) => (
        <motion.div
          key={i}
          className="absolute w-3 h-3 rounded-sm"
          style={{
            left: `${(i * 1.6) % 100}%`,
            top: "-20px",
            background: colors[i % colors.length],
          }}
          animate={{
            y: ["0vh", "110vh"],
            x: [0, (i % 2 === 0 ? 100 : -100)],
            rotate: [0, 360],
            opacity: [1, 1, 0],
          }}
          transition={{
            duration: 2.5 + (i % 2),
            delay: (i % 10) * 0.1,
            ease: "easeIn",
          }}
        />
      ))}
    </div>
  );
}

function GeneratingScreen({ theme, onDone }: { theme: typeof THEMES[0]; onDone: (id: string) => void }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [done, setDone] = useState(false);
  const totalDur = LOADING_STEPS.reduce((a, s) => a + s.dur, 0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 98) { clearInterval(interval); return 98; }
        return p + 0.4;
      });
    }, totalDur / 250);

    let elapsed = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];
    LOADING_STEPS.forEach((step, i) => {
      const t = setTimeout(() => setStepIndex(i), elapsed);
      timers.push(t);
      elapsed += step.dur;
    });

    const finish = setTimeout(() => {
      setProgress(100);
      setShowConfetti(true);
      setDone(true);
      setTimeout(() => onDone("demo-id"), 2200);
    }, elapsed);
    timers.push(finish);

    return () => {
      clearInterval(interval);
      timers.forEach(clearTimeout);
    };
  }, []);

  const step = LOADING_STEPS[stepIndex];
  const themeChars = ["🌟", "💫", "✨", "⭐", "🌈", "🎀"];

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden"
      style={{ background: "radial-gradient(circle at center, #4f46e5, #1e1b4b)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {showConfetti && <Confetti />}

      <div className="relative mb-12 scale-110">
        <motion.div
          className="absolute inset-0 rounded-full border-4 border-dashed border-white/20"
          style={{ width: 240, height: 240, left: -60, top: -60 }}
          animate={{ rotate: 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="text-[100px] drop-shadow-[0_0_30px_rgba(255,255,255,0.4)]"
          animate={{ scale: [1, 1.1, 1], rotate: [-10, 10, -10] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          {done ? "📖" : theme.emoji}
        </motion.div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={stepIndex}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          className="flex flex-col items-center gap-4 mb-10 px-8"
        >
          <span className="text-6xl">{done ? "🎉" : step.icon}</span>
          <p className="text-white text-3xl font-black text-center tracking-tight drop-shadow-md">
            {done ? "Your Story is Ready! 🎊" : step.text}
          </p>
        </motion.div>
      </AnimatePresence>

      <div className="w-full max-w-sm px-10">
        <div className="flex justify-between text-white font-bold mb-3 tracking-widest text-sm uppercase opacity-70">
          <span>{Math.round(progress)}% Magic</span>
        </div>
        <div className="w-full h-5 rounded-full bg-black/40 p-1 border border-white/10 overflow-hidden shadow-inner flex items-center">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-yellow-400 via-pink-500 to-indigo-400"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>
    </motion.div>
  );
}

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [selectedTheme, setSelectedTheme] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState(0);
  const [heroName, setHeroName] = useState("");
  const [heroOutfit, setHeroOutfit] = useState("");
  const [heroPower, setHeroPower] = useState("");
  const [generating, setGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showFlash, setShowFlash] = useState(true);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleFileChange = (f: File | null) => {
    setFile(f);
    if (f) setPreviewUrl(URL.createObjectURL(f));
    else setPreviewUrl(null);
  };

  const handleGenerate = async () => {
    setGenerating(true);
    const formData = new FormData();
    if (title.trim()) formData.append("title", title);
    if (file) formData.append("file", file);
    formData.append("theme", THEMES[selectedTheme].label);
    formData.append("language", LANGUAGES[selectedLanguage].label);
    if (heroName.trim()) formData.append("hero_name", heroName);
    if (heroOutfit.trim()) formData.append("hero_outfit", heroOutfit);
    if (heroPower.trim()) formData.append("hero_power", heroPower);

    try {
      const res = await fetch(`${API_BASE}/upload-photo`, { method: "POST", body: formData });
      const data = await res.json();
      sessionStorage.setItem("pendingOrderId", data.order_id || "demo-id");
    } catch {
      sessionStorage.setItem("pendingOrderId", "demo-id");
    }
  };

  if (!mounted) return null; // Prevent hydration mismatch

  return (
    <div
      className="min-h-screen py-16 px-4 md:px-8 relative overflow-hidden flex flex-col items-center"
      style={{
        background: "linear-gradient(to bottom, #fde68a, #f9a8d4, #a5b4fc)",
        fontFamily: "'Fredoka One', cursive"
      }}
    >
      <AnimatePresence>
        {showFlash && (
          <FlashScreen
            key="flash-upload"
            emoji="✨"
            title="Magical Story Creator"
            tagline="Step into the World of Imagination! 🪄"
            onDone={() => setShowFlash(false)}
            bgColor="radial-gradient(circle at center, #4f46e5, #1e1b4b)"
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {generating && (
          <GeneratingScreen
            key="gen"
            theme={THEMES[selectedTheme]}
            onDone={(id) => router.push(`/generate/${sessionStorage.getItem("pendingOrderId") || id}`)}
          />
        )}
      </AnimatePresence>

      {/* Floating Elements */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        {BG_FLOATS.map((c, i) => (
          <motion.div
            key={i}
            className="absolute p-4 text-5xl md:text-7xl"
            style={{ left: `${c.x}%`, top: `${c.y}%` }}
            animate={{ y: [0, -20, 0], rotate: [-10, 10, -10] }}
            transition={{ duration: 4 + i, repeat: Infinity, ease: "easeInOut" }}
          >
            {c.e}
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center mb-12 relative z-10"
      >
        <h1 className="text-5xl md:text-7xl font-black text-indigo-900 mb-4 drop-shadow-md">
          Magic Story <span className="text-pink-600">Mirror</span> 🔮
        </h1>
        <p className="text-indigo-900/60 text-xl font-bold">Dream big, write your own legend!</p>
      </motion.div>

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-4xl bg-white border-[8px] border-white shadow-[0_30px_60px_rgba(0,0,0,0.2)] rounded-[4rem] overflow-hidden z-10 flex flex-col md:flex-row"
      >
        {/* Left Side: Choices */}
        <div className="flex-1 p-8 md:p-12 space-y-10">
          {/* Language Choice */}
          <div>
            <h3 className="text-indigo-900/40 uppercase text-xs font-black tracking-[0.2em] mb-4">Choose Language</h3>
            <div className="flex gap-3">
              {LANGUAGES.map((l, i) => (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  key={i}
                  onClick={() => setSelectedLanguage(i)}
                  className={`flex-1 p-4 rounded-3xl border-4 transition-all flex flex-col items-center gap-1
                                ${selectedLanguage === i ? 'bg-indigo-50 border-indigo-500' : 'bg-slate-50 border-transparent'}`}
                >
                  <span className="text-3xl">{l.emoji}</span>
                  <span className={`text-xs font-black ${selectedLanguage === i ? 'text-indigo-900' : 'text-slate-400'}`}>{l.label}</span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Theme Grid */}
          <div>
            <h3 className="text-indigo-900/40 uppercase text-xs font-black tracking-[0.2em] mb-4">Pick a World</h3>
            <div className="grid grid-cols-3 gap-3">
              {THEMES.map((t, i) => (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  key={i}
                  onClick={() => setSelectedTheme(i)}
                  className={`p-4 rounded-3xl border-4 transition-all flex flex-col items-center gap-1
                                ${selectedTheme === i ? 'bg-white border-yellow-400 shadow-xl' : 'bg-slate-50 border-transparent opacity-60'}`}
                >
                  <span className="text-4xl">{t.emoji}</span>
                  <span className="text-[10px] font-black text-indigo-900">{t.label}</span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Hero Creator */}
          <div className="bg-indigo-50 p-6 rounded-[2.5rem] border-4 border-indigo-100 space-y-4">
            <h3 className="text-indigo-900 font-black text-lg">Build Your Hero 🦸✨</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                placeholder="Hero Name"
                value={heroName} onChange={(e) => setHeroName(e.target.value)}
                className="w-full p-4 rounded-2xl bg-white border-2 border-indigo-200 outline-none font-bold text-indigo-900 placeholder-indigo-200"
              />
              <input
                placeholder="Outfit (e.g. Red Cape)"
                value={heroOutfit} onChange={(e) => setHeroOutfit(e.target.value)}
                className="w-full p-4 rounded-2xl bg-white border-2 border-indigo-200 outline-none font-bold text-indigo-900 placeholder-indigo-200"
              />
            </div>
          </div>
        </div>

        {/* Right Side: Title & Image Upload */}
        <div className="flex-1 bg-indigo-900 text-white p-8 md:p-12 flex flex-col justify-center gap-8">
          <div className="space-y-2">
            <h3 className="text-white/40 uppercase text-xs font-black tracking-[0.2em]">Story Title</h3>
            <input
              placeholder="My Amazing Adventure..."
              value={title} onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-transparent border-b-4 border-indigo-500 p-2 text-3xl font-black outline-none placeholder-indigo-700/50"
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-white/40 uppercase text-xs font-black tracking-[0.2em]">Hero's Face (Optional)</h3>
            <motion.div
              whileHover={{ scale: 0.98 }}
              onClick={() => document.getElementById('file-up')?.click()}
              className={`aspect-square rounded-[3rem] border-4 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all
                        ${previewUrl ? 'border-transparent bg-white' : 'border-indigo-700 hover:border-indigo-400 bg-indigo-800'}`}
            >
              {previewUrl ? (
                <img src={previewUrl} className="w-full h-full object-cover rounded-[2.5rem]" />
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <span className="text-6xl text-indigo-600">📸</span>
                  <span className="font-black text-indigo-400">Add Picture</span>
                </div>
              )}
              <input id="file-up" type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e.target.files?.[0] || null)} />
            </motion.div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleGenerate}
            disabled={!title.trim() && !file}
            className="w-full py-6 rounded-full bg-yellow-400 text-indigo-900 text-3xl font-black shadow-[0_15px_30px_rgba(250,204,21,0.3)] disabled:opacity-50"
          >
            START MAGIC ✨
          </motion.button>
        </div>
      </motion.div>

      {/* Footer Bottom Decorations */}
      <div className="mt-12 flex gap-8 text-5xl opacity-40 grayscale hover:grayscale-0 transition-all cursor-default relative z-10">
        <span>🪁</span><span>🍭</span><span>🛸</span><span>🐼</span>
      </div>

    </div>
  );
}