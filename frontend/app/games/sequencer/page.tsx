"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

const CRYSTALS = [
    { id: 0, color: "bg-red-500", shadow: "shadow-red-500/50", sound: "https://s3.amazonaws.com/freecodecamp/simonSound1.mp3" },
    { id: 1, color: "bg-blue-500", shadow: "shadow-blue-500/50", sound: "https://s3.amazonaws.com/freecodecamp/simonSound2.mp3" },
    { id: 2, color: "bg-green-500", shadow: "shadow-green-500/50", sound: "https://s3.amazonaws.com/freecodecamp/simonSound3.mp3" },
    { id: 3, color: "bg-yellow-500", shadow: "shadow-yellow-500/50", sound: "https://s3.amazonaws.com/freecodecamp/simonSound4.mp3" },
];

export default function MagicSequencer() {
    const [sequence, setSequence] = useState<number[]>([]);
    const [playerSequence, setPlayerSequence] = useState<number[]>([]);
    const [activeCrystal, setActiveCrystal] = useState<number | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [score, setScore] = useState(0);
    const [status, setStatus] = useState("Tap Start to Play!");
    const [gameOver, setOver] = useState(false);

    const playSound = (id: number) => {
        try {
            const audio = new Audio(CRYSTALS[id].sound);
            audio.volume = 0.3;
            audio.play().catch(() => { });
        } catch { }
    };

    const startNextRound = (currentSeq: number[]) => {
        const nextSeq = [...currentSeq, Math.floor(Math.random() * 4)];
        setSequence(nextSeq);
        setPlayerSequence([]);
        playSequence(nextSeq);
    };

    const playSequence = async (seq: number[]) => {
        setIsPlaying(true);
        setStatus("Watch closely...");
        for (let i = 0; i < seq.length; i++) {
            await new Promise((r) => setTimeout(r, 600));
            setActiveCrystal(seq[i]);
            playSound(seq[i]);
            await new Promise((r) => setTimeout(r, 400));
            setActiveCrystal(null);
        }
        setIsPlaying(false);
        setStatus("Your turn! Repeat the pattern.");
    };

    const handleCrystalClick = (id: number) => {
        if (isPlaying || gameOver) return;

        playSound(id);
        setActiveCrystal(id);
        setTimeout(() => setActiveCrystal(null), 200);

        const newPlayerSeq = [...playerSequence, id];
        setPlayerSequence(newPlayerSeq);

        // Check correctness
        if (id !== sequence[newPlayerSeq.length - 1]) {
            setOver(true);
            setStatus("Game Over! Try again.");
            return;
        }

        if (newPlayerSeq.length === sequence.length) {
            setScore(s => s + 1);
            setStatus("Correct! Magic Level Up! ✨");
            setTimeout(() => startNextRound(sequence), 1000);
        }
    };

    return (
        <div className="h-screen w-full bg-[#1a1a2e] flex flex-col items-center justify-center relative font-sans overflow-hidden">
            {/* Background Glow */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(79,70,229,0.2),transparent)] pointer-events-none" />

            <div className="absolute top-4 left-4 right-4 md:top-6 md:left-6 md:right-6 flex justify-between items-center z-50">
                <Link href="/games">
                    <button className="bg-white/10 backdrop-blur-md px-4 py-2 md:px-6 md:py-2 rounded-full text-white font-bold border border-white/20 hover:bg-white/20 transition-all text-sm md:text-base">
                        ⬅ Exit
                    </button>
                </Link>
                <div className="bg-white/10 px-4 py-2 md:px-8 md:py-2 rounded-xl md:rounded-2xl border border-white/20 text-yellow-400 font-black text-lg md:text-2xl uppercase tracking-widest shadow-lg">
                    SCORE: {score}
                </div>
            </div>

            <div className="text-center mb-6 md:mb-12 relative z-10 px-4 pt-16 md:pt-0">
                <h1 className="text-3xl md:text-5xl font-black text-white mb-2 md:mb-4 uppercase italic tracking-tighter leading-tight" style={{ textShadow: "0 0 20px rgba(255,255,255,0.3)" }}>
                    Magic Sequencer
                </h1>
                <p className={`text-base md:text-xl font-bold transition-all duration-300 ${status.includes('Turn') ? 'text-green-400' : 'text-blue-300'}`}>
                    {status}
                </p>
            </div>

            <div className="grid grid-cols-2 gap-6 md:gap-12 relative z-10">
                {CRYSTALS.map((crystal) => (
                    <motion.div
                        key={crystal.id}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleCrystalClick(crystal.id)}
                        className={`w-36 h-36 md:w-56 md:h-56 rounded-[2rem] md:rounded-[3rem] cursor-pointer relative shadow-2xl transition-all duration-200 border-4 md:border-8 border-white/10 ${crystal.color
                            } ${activeCrystal === crystal.id ? `brightness-150 scale-105 ${crystal.shadow} ring-4 md:ring-8 ring-white/50` : "brightness-50 opacity-40 hover:opacity-100"}`}
                    >
                        {/* Crystal Shimmer */}
                        <div className="absolute inset-2 md:inset-4 rounded-xl md:rounded-[2rem] bg-gradient-to-br from-white/30 to-transparent pointer-events-none"></div>
                        {activeCrystal === crystal.id && (
                            <motion.div
                                layoutId="glow"
                                className="absolute inset-0 rounded-[2rem] md:rounded-[2.5rem] bg-current blur-2xl opacity-50"
                            />
                        )}
                    </motion.div>
                ))}
            </div>

            {!sequence.length && !gameOver && (
                <button
                    onClick={() => startNextRound([])}
                    className="mt-16 px-12 py-5 bg-indigo-600 hover:bg-indigo-700 text-white text-3xl font-black rounded-[2rem] shadow-2xl hover:scale-110 active:scale-95 transition-all"
                >
                    START MAGIC ✨
                </button>
            )}

            {gameOver && (
                <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-md z-[100]"
                >
                    <div className="bg-white p-12 rounded-[4rem] text-center max-w-md w-full border-[15px] border-indigo-600">
                        <div className="text-8xl mb-6">🔮</div>
                        <h2 className="text-4xl font-black text-indigo-900 mb-2 uppercase">Vision Faded!</h2>
                        <p className="text-xl text-gray-500 font-bold mb-8 italic">Your magic score: {score}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="w-full py-5 bg-indigo-600 text-white text-2xl font-black rounded-3xl shadow-lg hover:scale-105 active:scale-95 transition-all"
                        >
                            TRY AGAIN ✨
                        </button>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
