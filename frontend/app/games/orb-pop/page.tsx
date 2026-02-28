"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface Orb {
    id: number;
    x: number;
    y: number;
    size: number;
    emoji: string;
    speed: number;
}

const EMOJIS = ["🪄", "✨", "⭐", "🔮", "🦄", "🐉", "🦋", "🌈"];

export default function OrbPop() {
    const [orbs, setOrbs] = useState<Orb[]>([]);
    const [score, setScore] = useState(0);
    const [timeLeft, setLeft] = useState(30);
    const [gameStarted, setStarted] = useState(false);
    const [gameOver, setOver] = useState(false);

    useEffect(() => {
        if (gameStarted && !gameOver && timeLeft > 0) {
            const timer = setInterval(() => setLeft((prev) => prev - 1), 1000);
            const spawner = setInterval(spawnOrb, 600);
            return () => {
                clearInterval(timer);
                clearInterval(spawner);
            };
        } else if (timeLeft === 0) {
            setOver(true);
        }
    }, [gameStarted, gameOver, timeLeft]);

    const spawnOrb = () => {
        const newOrb: Orb = {
            id: Math.random(),
            x: Math.random() * 90 + 5, // Cover 5% to 95% of width
            y: 110, // Start below screen
            size: Math.random() * 40 + 70, // 70px to 110px
            emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
            speed: Math.random() * 4 + 4,
        };
        setOrbs((prev) => [...prev.slice(-20), newOrb]);
    };

    const [poppedId, setPoppedId] = useState<number | null>(null);

    const handlePop = (id: number) => {
        setScore((s) => s + 1);
        setPoppedId(id);
        setOrbs((prev) => prev.filter((o) => o.id !== id));

        try {
            const audio = new Audio("https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3");
            audio.volume = 0.2;
            audio.play().catch(() => { });
        } catch { }

        // Reset popped state after animation
        setTimeout(() => setPoppedId(null), 300);
    };

    return (
        <div className="h-screen w-full bg-gradient-to-b from-blue-400 to-indigo-600 overflow-hidden relative font-sans select-none">
            {/* HUD */}
            <div className="absolute top-4 left-4 right-4 md:top-6 md:left-6 md:right-6 flex justify-between items-center z-50">
                <Link href="/games">
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="bg-white/20 backdrop-blur-md px-4 py-2 md:px-8 md:py-3 rounded-full text-white font-black border-2 border-white/50 hover:bg-white/40 transition-all shadow-lg text-sm md:text-base"
                    >
                        ⬅ BACK
                    </motion.button>
                </Link>
                <div className="flex gap-2 md:gap-4">
                    <motion.div
                        key={score}
                        initial={{ scale: 1.2, rotate: -5 }}
                        animate={{ scale: 1, rotate: 0 }}
                        className="bg-white px-4 py-2 md:px-8 md:py-3 rounded-xl md:rounded-2xl shadow-lg text-indigo-700 font-black text-xl md:text-2xl border-b-4 border-indigo-200"
                    >
                        ⭐ {score}
                    </motion.div>
                    <div className="bg-white px-4 py-2 md:px-8 md:py-3 rounded-xl md:rounded-2xl shadow-lg text-rose-600 font-black text-xl md:text-2xl border-b-4 border-rose-200 min-w-[80px] md:min-w-[120px] text-center">
                        ⏱️ {timeLeft}s
                    </div>
                </div>
            </div>

            {!gameStarted ? (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-[60]">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white p-12 rounded-[3.5rem] shadow-2xl text-center max-w-md w-full border-[12px] border-blue-400"
                    >
                        <div className="text-8xl mb-6">🫧</div>
                        <h2 className="text-4xl font-black text-indigo-900 mb-4 uppercase">Magic Orb Pop</h2>
                        <p className="text-lg text-gray-500 font-bold mb-8">Tap all the magical bubbles to collect magic points!</p>
                        <button
                            onClick={() => setStarted(true)}
                            className="w-full py-5 bg-indigo-600 text-white text-2xl font-black rounded-3xl shadow-lg hover:scale-105 active:scale-95 transition-all"
                        >
                            START MAGIC ✨
                        </button>
                    </motion.div>
                </div>
            ) : gameOver ? (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-md z-[60]">
                    <motion.div
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="bg-white p-12 rounded-[3.5rem] shadow-2xl text-center max-w-md w-full border-[12px] border-yellow-400"
                    >
                        <span className="text-8xl">🎉</span>
                        <h2 className="text-4xl font-black text-indigo-900 mt-4 mb-2">TIME'S UP!</h2>
                        <div className="text-6xl font-black text-indigo-600 mb-6">{score}</div>
                        <p className="text-xl text-gray-500 font-bold mb-8 italic">You are a Bubble Wizard! 🫧</p>
                        <div className="flex gap-4">
                            <button
                                onClick={() => window.location.reload()}
                                className="flex-1 py-4 bg-gray-100 text-gray-700 text-xl font-black rounded-3xl"
                            >
                                REPLAY
                            </button>
                            <Link href="/games" className="flex-1">
                                <button className="w-full py-4 bg-indigo-600 text-white text-xl font-black rounded-3xl">
                                    HOME
                                </button>
                            </Link>
                        </div>
                    </motion.div>
                </div>
            ) : (
                <AnimatePresence>
                    {orbs.map((orb) => (
                        <motion.div
                            key={orb.id}
                            initial={{ y: "110vh", x: `${orb.x}%`, scale: 0 }}
                            animate={{
                                y: "-20vh", // Float all the way up
                                scale: 1,
                                rotate: [0, 10, -10, 0]
                            }}
                            exit={{
                                scale: 2.5,
                                opacity: 0,
                                transition: { duration: 0.2 }
                            }}
                            transition={{ duration: orb.speed, ease: "linear" }}
                            onPointerDown={() => handlePop(orb.id)}
                            className="absolute cursor-pointer flex items-center justify-center select-none group"
                            style={{
                                width: orb.size,
                                height: orb.size,
                                borderRadius: "50%",
                                background: "rgba(255,255,255,0.2)",
                                border: "3px solid rgba(255,255,255,0.6)",
                                boxShadow: "0 0 30px rgba(255,255,255,0.3)",
                                backdropFilter: "blur(2px)"
                            }}
                        >
                            <span style={{ fontSize: orb.size * 0.6 }}>{orb.emoji}</span>

                            {/* Shine effect inside bubble */}
                            <div className="absolute top-2 left-4 w-1/3 h-1/4 bg-white/40 rounded-full blur-[2px] -rotate-45"></div>

                            {/* Magic Glow */}
                            <div className="absolute inset-0 bg-white/10 rounded-full group-hover:bg-white/20 transition-colors"></div>

                            {/* Pop Visual (Invisible unless exit is triggered) */}
                            <AnimatePresence>
                                {poppedId === orb.id && (
                                    <motion.div
                                        initial={{ scale: 0.5, opacity: 1 }}
                                        animate={{ scale: 2, opacity: 0 }}
                                        className="absolute inset-0 bg-white rounded-full flex items-center justify-center"
                                    >
                                        ✨
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </AnimatePresence>
            )}

            {/* Underwater/Sky Particles */}
            <div className="absolute inset-0 pointer-events-none opacity-20">
                {[...Array(20)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute bg-white rounded-full animate-float"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            width: Math.random() * 10 + 5,
                            height: Math.random() * 10 + 5,
                            animationDelay: `${Math.random() * 5}s`,
                            animationDuration: `${Math.random() * 10 + 10}s`
                        }}
                    />
                ))}
            </div>

            <style jsx>{`
        @keyframes float {
          0% { transform: translateY(0) rotate(0); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateY(-100vh) rotate(360deg); opacity: 0; }
        }
        .animate-float {
          animation: float linear infinite;
        }
      `}</style>
        </div>
    );
}
