"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { API_BASE } from "@/lib/api";
import StarCatcher from "@/app/games/catcher/page";

const LOADING_MESSAGES = [
    "Mixing magical colors...",
    "Finding the perfect stars...",
    "Drawing your brave hero...",
    "Sprinkling fairy dust...",
    "Whispering to the forest...",
    "Painting the magic sky...",
    "Adding your magical face...",
    "Almost ready to read!"
];

interface PagePreview {
    page_number: number;
    image_url: string;
}

export default function ProcessingPage() {
    const { orderId } = useParams();
    const router = useRouter();
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState("generating");
    const [messageIdx, setMessageIdx] = useState(0);
    const [previewPages, setPreviewPages] = useState<PagePreview[]>([]);

    useEffect(() => {
        const messageInterval = setInterval(() => {
            setMessageIdx(prev => (prev + 1) % LOADING_MESSAGES.length);
        }, 3500);

        const pollStatus = setInterval(async () => {
            try {
                const res = await fetch(`${API_BASE}/personalized/status/${orderId}`);
                const data = await res.json();

                setProgress(data.progress || 0);
                setStatus(data.status);

                // Update live page previews as they arrive
                if (data.generated_pages && data.generated_pages.length > 0) {
                    setPreviewPages(data.generated_pages);
                }

                if (data.status === "completed") {
                    clearInterval(pollStatus);
                    clearInterval(messageInterval);
                    setTimeout(() => {
                        router.push(`/personalized/success/${orderId}`);
                    }, 500);
                }
            } catch (err) {
                console.error("Polling failed:", err);
            }
        }, 2000);

        return () => {
            clearInterval(pollStatus);
            clearInterval(messageInterval);
        };
    }, [orderId, router]);

    return (
        <div
            className="min-h-screen flex flex-col items-center justify-center p-6 text-center relative overflow-hidden"
            style={{
                background: "radial-gradient(circle at center, #1e1b4b, #030712)",
                fontFamily: "'Fredoka One', cursive"
            }}
        >
            {/* Ambient Background Glow */}
            <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
                transition={{ duration: 8, repeat: Infinity }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500 rounded-full blur-[150px] pointer-events-none"
            />

            {/* Central Magic Orb */}
            <div className="relative mb-10 z-10">
                {Array.from({ length: 12 }).map((_, i) => (
                    <motion.div
                        key={i}
                        animate={{ y: [0, -100, 0], x: [0, (i % 2 === 0 ? 30 : -30), 0], opacity: [0, 1, 0], scale: [0, 1, 0] }}
                        transition={{ duration: 2 + (i % 3), repeat: Infinity, delay: i * 0.2 }}
                        className="absolute top-1/2 left-1/2 w-2 h-2 bg-yellow-400 rounded-full blur-[2px]"
                    />
                ))}
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    className="w-40 h-40 md:w-52 md:h-52 border-2 border-dashed border-indigo-400/20 rounded-full"
                />
                <motion.div
                    animate={{ boxShadow: ["0 0 40px rgba(99,102,241,0.2)", "0 0 80px rgba(99,102,241,0.4)", "0 0 40px rgba(99,102,241,0.2)"] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="absolute inset-4 rounded-full bg-indigo-500/5 flex items-center justify-center backdrop-blur-sm border border-white/5"
                >
                    <motion.div
                        animate={{ scale: [1, 1.15, 1], rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="text-6xl md:text-8xl filter drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                    >
                        🔮
                    </motion.div>
                </motion.div>
            </div>

            <div className="z-10 w-full max-w-2xl px-4 space-y-6">
                {/* Status Message */}
                <AnimatePresence mode="wait">
                    <motion.p
                        key={messageIdx}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        className="text-white text-2xl md:text-3xl font-black h-10 tracking-wide drop-shadow-md"
                    >
                        {LOADING_MESSAGES[messageIdx]}
                    </motion.p>
                </AnimatePresence>

                {/* Progress Bar */}
                <div className="w-full bg-white/10 backdrop-blur-md rounded-2xl p-5 shadow-xl border border-white/20">
                    <div className="flex justify-between items-end mb-3">
                        <span className="text-white/60 text-xs font-bold uppercase tracking-widest">Weaving Magic</span>
                        <span className="text-yellow-400 text-2xl font-black tabular-nums">{progress}%</span>
                    </div>
                    <div className="h-4 w-full bg-black/40 rounded-full p-1 border border-white/10 overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.5 }}
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                        />
                    </div>
                </div>

                {/* Live Page Thumbnails */}
                <AnimatePresence>
                    {previewPages.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="w-full bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10 shadow-xl"
                        >
                            <h2 className="text-yellow-300 font-black text-lg mb-4 uppercase tracking-widest text-center">
                                ✨ Your Pages Are Ready!
                            </h2>
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                                <AnimatePresence>
                                    {previewPages.map((page, idx) => (
                                        <motion.div
                                            key={page.page_number}
                                            initial={{ opacity: 0, scale: 0.5 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ type: "spring", stiffness: 300, delay: idx * 0.05 }}
                                            className="relative aspect-square rounded-xl overflow-hidden border-2 border-purple-500/40 shadow-lg group"
                                        >
                                            <img
                                                src={page.image_url}
                                                alt={`Page ${page.page_number}`}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                            />
                                            {/* Page number badge */}
                                            <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] font-black px-1.5 py-0.5 rounded-md">
                                                {page.page_number}
                                            </div>
                                            {/* Sparkle overlay on hover */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-purple-900/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </motion.div>
                                    ))}
                                </AnimatePresence>

                                {/* "Generating" placeholder slots */}
                                {previewPages.length < 11 &&
                                    Array.from({ length: Math.max(0, 11 - previewPages.length) }).map((_, i) => (
                                        <motion.div
                                            key={`placeholder-${i}`}
                                            animate={{ opacity: [0.3, 0.7, 0.3] }}
                                            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
                                            className="aspect-square rounded-xl bg-white/5 border-2 border-dashed border-white/10 flex items-center justify-center"
                                        >
                                            <span className="text-2xl">🖼️</span>
                                        </motion.div>
                                    ))
                                }
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Game Zone — shown only while no pages are ready yet */}
                {previewPages.length === 0 && (
                    <div className="w-full bg-black/40 rounded-[2rem] p-4 border-4 border-purple-500/30 overflow-hidden shadow-2xl">
                        <div className="text-center mb-4">
                            <h2 className="text-lg font-black text-yellow-300 uppercase tracking-tighter">🎮 Play Star Catcher!</h2>
                        </div>
                        <div className="h-[280px] md:h-[360px] rounded-xl overflow-hidden relative">
                            <StarCatcher />
                        </div>
                    </div>
                )}

                <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em] animate-pulse">
                    Please don't close this window ✨
                </p>
            </div>
        </div>
    );
}
