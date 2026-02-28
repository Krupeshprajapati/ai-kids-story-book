"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

const TREATS = ["🍏", "🍌", "🍓", "🍇", "🥕", "🥦", "🍎", "🍐"];
const OBSTACLES = ["💣", "👞", "🥫", "🧊", "🪨", "🚫"];

interface Item {
    id: number;
    icon: string;
    x: number;
    y: number;
    type: "treat" | "obstacle";
    speed: number;
}

export default function MonsterMunch() {
    const [monsterX, setMonsterX] = useState(50);
    const [items, setItems] = useState<Item[]>([]);
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(3);
    const [gameOver, setOver] = useState(false);
    const [gameStarted, setStarted] = useState(false);

    const gameRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!gameStarted || gameOver) return;

        const spawner = setInterval(() => {
            const type = Math.random() > 0.3 ? "treat" : "obstacle";
            const newItem: Item = {
                id: Date.now(),
                icon: type === "treat" ? TREATS[Math.floor(Math.random() * TREATS.length)] : OBSTACLES[Math.floor(Math.random() * OBSTACLES.length)],
                x: Math.random() * 90 + 5,
                y: -10,
                type,
                speed: Math.random() * 3 + 4,
            };
            setItems((prev) => [...prev, newItem]);
        }, 800);

        const mover = setInterval(() => {
            setItems((prev) => {
                const next = prev.map((item) => ({ ...item, y: item.y + item.speed }));

                // Collision Detection
                return next.filter((item) => {
                    const isAtMonsterHeight = item.y > 80 && item.y < 95;
                    const isAtMonsterX = Math.abs(item.x - monsterX) < 15;

                    if (isAtMonsterHeight && isAtMonsterX) {
                        if (item.type === "treat") {
                            setScore((s) => s + 10);
                        } else {
                            setLives((l) => {
                                if (l <= 1) setOver(true);
                                return l - 1;
                            });
                        }
                        return false;
                    }

                    return item.y < 110; // Remove if off-screen
                });
            });
        }, 50);

        return () => {
            clearInterval(spawner);
            clearInterval(mover);
        };
    }, [gameStarted, gameOver, monsterX]);

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!gameRef.current) return;
        const rect = gameRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        setMonsterX(Math.max(5, Math.min(95, x)));
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!gameRef.current) return;
        const rect = gameRef.current.getBoundingClientRect();
        const x = ((e.touches[0].clientX - rect.left) / rect.width) * 100;
        setMonsterX(Math.max(5, Math.min(95, x)));
    };

    return (
        <div
            ref={gameRef}
            onMouseMove={handleMouseMove}
            onTouchMove={handleTouchMove}
            className="h-screen w-full bg-gradient-to-b from-green-300 to-green-600 overflow-hidden relative font-sans touch-none"
        >
            {/* HUD */}
            <div className="absolute top-4 left-4 right-4 md:top-6 md:left-6 md:right-6 flex justify-between items-center z-50">
                <Link href="/games">
                    <button className="bg-white/20 backdrop-blur-md px-4 py-2 md:px-6 md:py-2 rounded-full text-white font-bold border border-white/30 hover:bg-white/30 transition-all text-sm md:text-base">
                        ⬅ Exit
                    </button>
                </Link>
                <div className="flex gap-2 md:gap-4">
                    <div className="bg-white/90 px-4 py-2 md:px-6 md:py-2 rounded-xl md:rounded-2xl shadow-xl text-green-700 font-black text-lg md:text-xl">
                        PTS: {score}
                    </div>
                    <div className="bg-white/90 px-4 py-2 md:px-6 md:py-2 rounded-xl md:rounded-2xl shadow-xl text-rose-600 font-black text-lg md:text-xl">
                        {"❤️".repeat(lives)}
                    </div>
                </div>
            </div>

            {!gameStarted ? (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-[60]">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white p-12 rounded-[3.5rem] shadow-2xl text-center max-w-md w-full border-[12px] border-green-500"
                    >
                        <div className="text-8xl mb-6">🥦</div>
                        <h2 className="text-4xl font-black text-green-900 mb-4 uppercase">Monster Munch</h2>
                        <p className="text-lg text-gray-500 font-bold mb-8">Move the monster to catch healthy food! Avoid the rocks and bombs!</p>
                        <button
                            onClick={() => setStarted(true)}
                            className="w-full py-5 bg-green-600 text-white text-2xl font-black rounded-3xl shadow-lg hover:scale-105 active:scale-95 transition-all"
                        >
                            START MUNCHING 😋
                        </button>
                    </motion.div>
                </div>
            ) : gameOver ? (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-md z-[60]">
                    <motion.div
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="bg-white p-12 rounded-[3.5rem] shadow-2xl text-center max-w-md w-full border-[12px] border-rose-500"
                    >
                        <span className="text-8xl">🤢</span>
                        <h2 className="text-4xl font-black text-rose-900 mt-4 mb-2">FULL TUMMY!</h2>
                        <div className="text-6xl font-black text-green-600 mb-6">{score}</div>
                        <p className="text-xl text-gray-500 font-bold mb-8 italic">Your monster is healthy and happy! 🍏</p>
                        <div className="flex gap-4">
                            <button
                                onClick={() => window.location.reload()}
                                className="flex-1 py-4 bg-gray-100 text-gray-700 text-xl font-black rounded-3xl"
                            >
                                TRY AGAIN
                            </button>
                            <Link href="/games" className="flex-1">
                                <button className="w-full py-4 bg-green-600 text-white text-xl font-black rounded-3xl">
                                    HOME
                                </button>
                            </Link>
                        </div>
                    </motion.div>
                </div>
            ) : (
                <>
                    {/* Falling Items */}
                    {items.map((item) => (
                        <div
                            key={item.id}
                            className="absolute text-4xl md:text-6xl select-none"
                            style={{
                                left: `${item.x}%`,
                                top: `${item.y}%`,
                                transform: "translate(-50%, -50%)"
                            }}
                        >
                            {item.icon}
                        </div>
                    ))}

                    {/* Monster */}
                    <motion.div
                        className="absolute bottom-10 flex flex-col items-center"
                        style={{
                            left: `${monsterX}%`,
                            transform: "translateX(-50%)"
                        }}
                    >
                        <div className="text-7xl md:text-9xl group relative">
                            😋
                            <div className="absolute -top-4 -left-4 text-3xl md:text-4xl animate-bounce">🍴</div>
                        </div>
                        <div className="h-4 w-16 md:h-6 md:w-24 bg-black/10 rounded-full blur-md"></div>
                    </motion.div>
                </>
            )}

            {/* Decorative Ground */}
            <div className="absolute bottom-0 w-full h-20 bg-[#5DAE47] shadow-[0_-10px_20px_rgba(0,0,0,0.1)]"></div>
        </div>
    );
}
