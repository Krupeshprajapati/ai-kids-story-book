"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import FlashScreen from "../components/FlashScreen";

const GAMES = [
    {
        id: "orb-pop",
        title: "Magic Orb Pop",
        icon: "🫧",
        color: "from-blue-400 to-indigo-500",
        description: "Pop the magical orbs before they float away!",
        badge: "Fast Fun"
    },
    {
        id: "pairs",
        title: "Magic Pairs",
        icon: "🃏",
        color: "from-purple-400 to-pink-500",
        description: "Find all the matching magic cards!",
        badge: "Memory"
    },
    {
        id: "sequencer",
        title: "Magic Sequencer",
        icon: "✨",
        color: "from-yellow-400 to-orange-500",
        description: "Follow the magical pattern of lights!",
        badge: "Brainy"
    },
    {
        id: "stickers",
        title: "Sticker Canvas",
        icon: "🎨",
        color: "from-green-400 to-teal-500",
        description: "Create your own magical story scene!",
        badge: "Creative"
    },
    {
        id: "munch",
        title: "Monster Munch",
        icon: "🥦",
        color: "from-rose-400 to-red-500",
        description: "Feed the hungry monster healthy treats!",
        badge: "Action"
    },
    {
        id: "catcher",
        title: "Star Catcher",
        icon: "⭐",
        color: "from-blue-600 to-teal-400",
        description: "Catch the falling stars in your magic basket!",
        badge: "Skill"
    }
];

export default function GamesHub() {
    const [showFlash, setShowFlash] = useState(true);

    return (
        <div className="min-h-screen bg-[#FDF6E3] p-8 pt-24 relative overflow-hidden">
            <AnimatePresence>
                {showFlash && (
                    <FlashScreen
                        key="flash-games"
                        emoji="🕹️"
                        title="GAME ZONE"
                        tagline="LEVEL 1: START ADVENTURE"
                        variant="gaming"
                        onDone={() => setShowFlash(false)}
                    />
                )}
            </AnimatePresence>

            {/* Background Decor */}
            <div className="fixed inset-0 pointer-events-none opacity-20 overflow-hidden">
                <div className="absolute top-10 left-10 text-9xl animate-pulse">🎮</div>
                <div className="absolute top-1/2 right-0 text-9xl animate-bounce">🪄</div>
                <div className="absolute bottom-10 left-1/2 text-9xl animate-spin-slow">⭐</div>
            </div>

            <div className="max-w-6xl mx-auto relative z-10 px-4 md:px-0">
                <header className="text-center mb-10 md:mb-16">
                    <motion.h1
                        initial={{ y: -50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="text-4xl md:text-6xl font-black text-amber-900 mb-4 tracking-tighter leading-tight"
                        style={{ textShadow: "4px 4px 0px rgba(217, 119, 6, 0.2)" }}
                    >
                        MAGIC GAME ZONE 🎮
                    </motion.h1>
                    <motion.p
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="text-lg md:text-2xl text-amber-800 font-bold italic"
                    >
                        Collect magic points and become a Story Wizard! ✨
                    </motion.p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {GAMES.map((game, i) => (
                        <motion.div
                            key={game.id}
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: i * 0.1 }}
                        >
                            <Link href={`/games/${game.id}`}>
                                <motion.div
                                    whileHover={{ scale: 1.05, y: -10 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="bg-white rounded-[2.5rem] shadow-[0_20px_0px_rgba(0,0,0,0.05)] hover:shadow-2xl transition-all duration-300 overflow-hidden border-8 border-white group"
                                >
                                    <div className={`h-48 bg-gradient-to-br ${game.color} flex items-center justify-center text-8xl group-hover:animate-bounce`}>
                                        {game.icon}
                                    </div>
                                    <div className="p-8">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="text-2xl font-black text-gray-800 tracking-tight">{game.title}</h3>
                                            <span className="px-3 py-1 bg-amber-100 text-amber-700 text-[10px] font-black rounded-full uppercase">
                                                {game.badge}
                                            </span>
                                        </div>
                                        <p className="text-gray-500 font-medium leading-tight">
                                            {game.description}
                                        </p>
                                    </div>
                                </motion.div>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </div>

            <style jsx global>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 15s linear infinite;
        }
      `}</style>
        </div>
    );
}
