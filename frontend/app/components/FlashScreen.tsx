"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

interface FlashScreenProps {
    emoji: string;
    title: string;
    tagline: string;
    onDone: () => void;
    bgColor?: string;
    variant?: "magic" | "gaming";
}

export default function FlashScreen({ emoji, title, tagline, onDone, bgColor, variant = "magic" }: FlashScreenProps) {
    const [step, setStep] = useState<"burst" | "logo" | "tagline" | "done">("burst");

    useEffect(() => {
        const t1 = setTimeout(() => setStep("logo"), 600);
        const t2 = setTimeout(() => setStep("tagline"), 1600);
        const t3 = setTimeout(() => {
            setStep("done");
            onDone();
        }, 3500);
        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
            clearTimeout(t3);
        };
    }, [onDone]);

    const magicBg = "radial-gradient(ellipse at 50% 40%, #7C3AED 0%, #4F46E5 40%, #1E1B4B 100%)";
    const gamingBg = "radial-gradient(circle at center, #111827, #000000)";

    return (
        <motion.div
            className="fixed inset-0 z-[1000] flex flex-col items-center justify-center overflow-hidden"
            style={{ background: bgColor || (variant === "gaming" ? gamingBg : magicBg) }}
            exit={{ scale: 1.5, opacity: 0, filter: "blur(20px)" }}
            transition={{ duration: 0.8, ease: "circIn" }}
        >
            {/* Background elements for Gaming */}
            {variant === "gaming" && (
                <div className="absolute inset-0 opacity-20 pointer-events-none">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-30" />
                    {Array.from({ length: 20 }).map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute text-4xl"
                            initial={{ y: "110vh", x: `${(i * 7) % 100}%` }}
                            animate={{ y: "-10vh" }}
                            transition={{ duration: 3 + (i % 5), repeat: Infinity, ease: "linear", delay: i * 0.2 }}
                        >
                            {["👾", "💰", "🕹️", "⚡", "🔋"][i % 5]}
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Stars burst */}
            {Array.from({ length: 18 }, (_, i) => {
                const randomOffset = (i * 137) % 120;
                return (
                    <motion.div
                        key={i}
                        className="absolute text-3xl"
                        style={{
                            left: "50%",
                            top: "50%",
                            rotate: `${i * 20}deg`,
                        }}
                        initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
                        animate={
                            step !== "burst"
                                ? {
                                    x: Math.cos((i / 18) * Math.PI * 2) * (120 + randomOffset),
                                    y: Math.sin((i / 18) * Math.PI * 2) * (120 + randomOffset),
                                    opacity: [0, 1, 0],
                                    scale: [0, 1.4, 0],
                                }
                                : {}
                        }
                        transition={{ duration: 1.2, delay: i * 0.04, ease: "easeOut" }}
                    >
                        {variant === "gaming" ? ["⚡", "👾", "✨", "🔴"][i % 4] : ["✨", "⭐", "🌟", "💫"][i % 4]}
                    </motion.div>
                );
            })}

            {/* Main emoji big pop */}
            <AnimatePresence>
                {step !== "burst" && (
                    <motion.div
                        key="emoji"
                        initial={{ scale: 0, rotate: -30 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 260, damping: 18 }}
                        className="text-[140px] mb-4 drop-shadow-[0_0_30px_rgba(255,255,255,0.4)] relative z-20"
                    >
                        {emoji}
                        {variant === "gaming" && (
                            <motion.div
                                className="absolute -top-4 -right-4 bg-yellow-400 text-black text-xs font-black px-2 py-1 rounded-md rotate-12"
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ repeat: Infinity, duration: 0.5 }}
                            >
                                NEW!
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Title text */}
            <AnimatePresence>
                {(step === "logo" || step === "tagline" || step === "done") && (
                    <motion.h1
                        key="logo"
                        initial={{ y: 40, opacity: 0, scale: 0.8 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className={`font-black drop-shadow-lg tracking-tighter text-center px-4 relative z-20
                           ${variant === 'gaming' ? 'text-green-400' : 'text-white'}`}
                        style={{
                            fontFamily: variant === 'gaming' ? "'Press Start 2P', cursive, sans-serif" : "'Fredoka One', cursive, sans-serif",
                            textShadow: variant === 'gaming' ? "4px 4px 0 #000, 8px 8px 0 rgba(74, 222, 128, 0.3)" : "0 4px 20px rgba(255,200,50,0.5)",
                            fontSize: variant === 'gaming' ? '2.5rem' : '5rem'
                        }}
                    >
                        {title}
                    </motion.h1>
                )}
            </AnimatePresence>

            {/* Tagline */}
            <AnimatePresence>
                {(step === "tagline" || step === "done") && (
                    <motion.div
                        key="tag"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        className="flex flex-col items-center gap-4 mt-6"
                    >
                        <p
                            className={`${variant === 'gaming' ? 'text-yellow-400 font-mono text-sm' : 'text-yellow-300 text-xl font-semibold'} tracking-[0.2em] uppercase text-center px-4`}
                        >
                            {tagline}
                        </p>

                        {variant === "gaming" && (
                            <motion.div
                                animate={{ opacity: [0, 1, 0] }}
                                transition={{ duration: 0.8, repeat: Infinity }}
                                className="text-white font-black text-xl tracking-[0.4em]"
                                style={{ fontFamily: "monospace" }}
                            >
                                PRESS START
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Animated loading bar */}
            <div className="mt-12 w-64 h-3 bg-black/40 rounded-full overflow-hidden border border-white/10">
                <motion.div
                    className={`h-full ${variant === 'gaming' ? 'bg-green-500' : 'bg-yellow-300'}`}
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 3.2, ease: "linear" }}
                />
            </div>

            <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredoka+One&family=Press+Start+2P&family=Nunito:wght@700;800;900&display=swap');
      `}</style>
        </motion.div>
    );
}
