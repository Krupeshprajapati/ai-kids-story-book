"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function BackgroundMusic() {
  const [isMuted, setIsMuted] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Check local storage for mute preference
    const savedMute = localStorage.getItem("music_muted") === "true";
    setIsMuted(savedMute);

    // Initialize audio
    const audio = new Audio("https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3");
    audio.loop = true;
    audio.volume = 0.1;
    audioRef.current = audio;

    const startAudio = () => {
      if (!savedMute) {
        audio.play().catch(() => { });
      }
      setIsInitialized(true);
      window.removeEventListener("click", startAudio);
      window.removeEventListener("touchstart", startAudio);
    };

    window.addEventListener("click", startAudio);
    window.addEventListener("touchstart", startAudio);

    return () => {
      audio.pause();
      window.removeEventListener("click", startAudio);
      window.removeEventListener("touchstart", startAudio);
    };
  }, []);

  const toggleMusic = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering other global clicks
    if (!audioRef.current) return;

    if (isMuted) {
      audioRef.current.play().catch(() => { });
      setIsMuted(false);
      localStorage.setItem("music_muted", "false");
    } else {
      audioRef.current.pause();
      setIsMuted(true);
      localStorage.setItem("music_muted", "true");
    }
  };

  return (
    <div className="fixed bottom-6 left-6 z-[200]">
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={toggleMusic}
        className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center border shadow-2xl transition-colors duration-500 overflow-hidden
          ${isMuted
            ? "bg-slate-800/40 border-white/10 text-slate-400"
            : "bg-white/20 backdrop-blur-md border-white/30 text-white"
          }`}
      >
        <AnimatePresence mode="wait">
          {isMuted ? (
            <motion.span
              key="muted"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="text-2xl"
            >
              🔇
            </motion.span>
          ) : (
            <motion.div
              key="playing"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="flex items-center gap-0.5"
            >
              <span className="text-2xl">🔊</span>
              {/* Animated Sound Waves */}
              <div className="flex gap-0.5 h-3 items-end mb-1">
                {[0.4, 0.7, 0.5].map((delay, i) => (
                  <motion.div
                    key={i}
                    animate={{ height: ["20%", "100%", "20%"] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: delay }}
                    className="w-0.5 bg-white/60 rounded-full"
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Shine effect */}
        {!isMuted && (
          <motion.div
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 bg-white/20 -skew-x-12 pointer-events-none"
          />
        )}
      </motion.button>

      {/* Tooltip hint on first load */}
      {!isInitialized && !isMuted && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute left-16 top-1/2 -translate-y-1/2 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-full whitespace-nowrap text-[10px] text-white font-bold uppercase tracking-widest pointer-events-none"
        >
          Click anywhere for music ✨
        </motion.div>
      )}
    </div>
  );
}