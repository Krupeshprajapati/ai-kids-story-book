"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface Star {
    id: number;
    x: number;
    y: number;
    size: number;
    emoji: string;
    speed: number;
}

const EMOJIS = ["⭐", "🌟", "✨", "💫", "🌠"];

export default function StarCatcher() {
    const [stars, setStars] = useState<Star[]>([]);
    const [score, setScore] = useState(0);
    const [timeLeft, setLeft] = useState(30);
    const [gameStarted, setStarted] = useState(false);
    const [gameOver, setOver] = useState(false);
    const [basketX, setBasketX] = useState(50); // percentage

    const gameContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (gameStarted && !gameOver && timeLeft > 0) {
            const timer = setInterval(() => setLeft((prev) => prev - 1), 1000);
            const spawner = setInterval(spawnStar, 800);
            const gameLoop = setInterval(updateStars, 20);

            return () => {
                clearInterval(timer);
                clearInterval(spawner);
                clearInterval(gameLoop);
            };
        } else if (timeLeft === 0) {
            setOver(true);
        }
    }, [gameStarted, gameOver, timeLeft]);

    const spawnStar = () => {
        const newStar: Star = {
            id: Math.random(),
            x: Math.random() * 90 + 5,
            y: -10, // Start above screen
            size: Math.random() * 20 + 40, // 40px to 60px
            emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
            speed: Math.random() * 1.5 + 1.5, // Reduced speed for kids
        };
        setStars((prev) => [...prev, newStar]);
    };

    const updateStars = () => {
        setStars((prev) => {
            const newStars = prev.map(s => ({ ...s, y: s.y + s.speed })).filter(s => s.y < 110);

            // Checking collision with basket
            const caught = newStars.filter(s => {
                const inRangeY = s.y > 80 && s.y < 95;
                const inRangeX = Math.abs(s.x - basketX) < 10;
                return inRangeY && inRangeX;
            });

            if (caught.length > 0) {
                setScore(prevScore => prevScore + caught.length);
                playCatchSound();
                return newStars.filter(s => !caught.includes(s));
            }

            return newStars;
        });
    };

    const playCatchSound = () => {
        try {
            const audio = new Audio("https://www.soundjay.com/nature/sounds/fire-crackle-02.mp3");
            audio.volume = 0.1;
            audio.play().catch(() => { });
        } catch { }
    };

    const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (gameContainerRef.current) {
            const rect = gameContainerRef.current.getBoundingClientRect();
            const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
            const x = ((clientX - rect.left) / rect.width) * 100;
            setBasketX(Math.max(5, Math.min(95, x)));
        }
    };

    return (
        <div
            ref={gameContainerRef}
            onMouseMove={handleMouseMove}
            onTouchMove={handleMouseMove}
            className="h-screen w-full bg-gradient-to-b from-indigo-950 via-purple-900 to-indigo-900 overflow-hidden relative font-sans select-none"
        >
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
                        className="bg-white px-4 py-2 md:px-8 md:py-3 rounded-xl md:rounded-2xl shadow-lg text-amber-500 font-black text-xl md:text-2xl border-b-4 border-amber-100"
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
                        className="bg-white p-12 rounded-[3.5rem] shadow-2xl text-center max-w-md w-full border-[12px] border-amber-400"
                    >
                        <div className="text-8xl mb-6">🧺⭐</div>
                        <h2 className="text-4xl font-black text-indigo-900 mb-4 uppercase">Star Catcher</h2>
                        <p className="text-lg text-gray-500 font-bold mb-8">Move the magic basket to catch falling stars!</p>
                        <button
                            onClick={() => setStarted(true)}
                            className="w-full py-5 bg-amber-500 text-white text-2xl font-black rounded-3xl shadow-lg hover:scale-105 active:scale-95 transition-all"
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
                        className="bg-white p-12 rounded-[3.5rem] shadow-2xl text-center max-w-md w-full border-[12px] border-amber-400"
                    >
                        <span className="text-8xl">🏆</span>
                        <h2 className="text-4xl font-black text-indigo-900 mt-4 mb-2">GREAT JOB!</h2>
                        <div className="text-6xl font-black text-amber-500 mb-6">{score}</div>
                        <p className="text-xl text-gray-500 font-bold mb-8 italic">You are a Star Master! ⭐</p>
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
                <>
                    {/* Stars */}
                    {stars.map((star) => (
                        <div
                            key={star.id}
                            className="absolute pointer-events-none"
                            style={{
                                left: `${star.x}%`,
                                top: `${star.y}%`,
                                fontSize: star.size,
                                transform: 'translate(-50%, -50%)',
                            }}
                        >
                            {star.emoji}
                        </div>
                    ))}

                    {/* Magic Basket */}
                    <div
                        className="absolute bottom-10 transition-all duration-75 pointer-events-none"
                        style={{
                            left: `${basketX}%`,
                            transform: 'translateX(-50%)',
                        }}
                    >
                        <div className="relative">
                            <span className="text-8xl md:text-9xl grayscale-0">🧺</span>
                            <motion.div
                                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="absolute inset-0 bg-amber-400/40 blur-3xl rounded-full"
                            />
                        </div>
                    </div>
                </>
            )}

            {/* Background Decor */}
            <div className="absolute inset-0 pointer-events-none opacity-20">
                {[...Array(30)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute bg-white rounded-full"
                        style={{
                            left: `${(i * 13) % 100}%`,
                            top: `${(i * 17) % 100}%`,
                            width: 2,
                            height: 2,
                        }}
                        animate={{ opacity: [0.1, 1, 0.1] }}
                        transition={{ duration: 2 + i % 3, repeat: Infinity, delay: i * 0.1 }}
                    />
                ))}
            </div>
        </div>
    );
}
