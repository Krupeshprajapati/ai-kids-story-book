"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import confetti from "canvas-confetti";

const CARDS = ["🐉", "🏰", "🪄", "🦄", "🌈", "🧙‍♂️", "💎", "⭐"];
const ALL_CARDS = [...CARDS, ...CARDS].sort(() => Math.random() - 0.5);

export default function MagicPairs() {
    const [cards, setCards] = useState<string[]>([]);
    const [flipped, setFlipped] = useState<number[]>([]);
    const [matched, setMatched] = useState<number[]>([]);
    const [moves, setMoves] = useState(0);

    useEffect(() => {
        setCards([...CARDS, ...CARDS].sort(() => Math.random() - 0.5));
    }, []);

    const handleFlip = (index: number) => {
        if (flipped.length === 2 || flipped.includes(index) || matched.includes(index)) return;

        const newFlipped = [...flipped, index];
        setFlipped(newFlipped);

        if (newFlipped.length === 2) {
            setMoves(m => m + 1);
            if (cards[newFlipped[0]] === cards[newFlipped[1]]) {
                setMatched([...matched, ...newFlipped]);
                setFlipped([]);
                if (matched.length + 2 === cards.length) {
                    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
                }
            } else {
                setTimeout(() => setFlipped([]), 1000);
            }
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-500 to-pink-600 p-8 pt-24 font-sans">
            <div className="absolute top-4 left-4 right-4 md:top-6 md:left-6 md:right-6 flex justify-between items-center z-50">
                <Link href="/games">
                    <button className="bg-white/20 backdrop-blur-md px-4 py-2 md:px-6 md:py-2 rounded-full text-white font-bold border border-white/30 hover:bg-white/30 transition-all text-sm md:text-base">
                        ⬅ Exit
                    </button>
                </Link>
                <div className="bg-white/90 px-4 py-2 md:px-6 md:py-2 rounded-xl md:rounded-2xl shadow-xl text-purple-700 font-black text-lg md:text-xl uppercase tracking-tighter">
                    MOVES: {moves}
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-2">
                <header className="text-center mb-8 md:mb-12">
                    <h1 className="text-4xl md:text-5xl font-black text-white mb-2 drop-shadow-lg uppercase italic leading-tight">Magic Pairs</h1>
                    <p className="text-purple-100 font-bold text-sm md:text-base">Match the magical twins to win! ✨</p>
                </header>

                <div className="grid grid-cols-4 gap-4 md:gap-6">
                    {cards.map((card, i) => (
                        <motion.div
                            key={i}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleFlip(i)}
                            className="aspect-square relative cursor-pointer perspective-1000"
                        >
                            <motion.div
                                initial={false}
                                animate={{ rotateY: flipped.includes(i) || matched.includes(i) ? 0 : 180 }}
                                transition={{ duration: 0.5, type: "spring", stiffness: 200, damping: 20 }}
                                style={{ transformStyle: "preserve-3d" }}
                                className="w-full h-full relative"
                            >
                                {/* Front (Icon) */}
                                <div
                                    className={`absolute inset-0 rounded-2xl md:rounded-[2rem] border-4 md:border-8 shadow-2xl flex items-center justify-center text-4xl md:text-7xl bg-white backface-hidden ${matched.includes(i) ? "border-green-400 bg-green-50" : "border-white"
                                        }`}
                                    style={{ backfaceVisibility: "hidden" }}
                                >
                                    {card}
                                    {matched.includes(i) && <div className="absolute top-1 right-1 md:top-2 md:right-2 text-xl">✨</div>}
                                </div>

                                {/* Back (Pattern) */}
                                <div
                                    className="absolute inset-0 rounded-2xl md:rounded-[2rem] bg-indigo-900 border-4 md:border-8 border-white shadow-2xl flex items-center justify-center text-4xl md:text-7xl select-none"
                                    style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                                >
                                    🔮
                                </div>
                            </motion.div>
                        </motion.div>
                    ))}
                </div>

                {matched.length === cards.length && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-md z-[100]"
                    >
                        <div className="bg-white p-12 rounded-[4rem] text-center max-w-md w-full border-[15px] border-yellow-400">
                            <div className="text-8xl mb-6">👑</div>
                            <h2 className="text-4xl font-black text-purple-900 mb-2 uppercase">Story Master!</h2>
                            <p className="text-xl text-gray-500 font-bold mb-8">You found all {cards.length / 2} magic pairs in {moves} moves!</p>
                            <button
                                onClick={() => window.location.reload()}
                                className="w-full py-5 bg-purple-600 text-white text-2xl font-black rounded-3xl shadow-lg hover:scale-105 active:scale-95 transition-all"
                            >
                                PLAY AGAIN ✨
                            </button>
                        </div>
                    </motion.div>
                )}
            </div>

            <style jsx>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
      `}</style>
        </div>
    );
}
