"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

const STICKERS = ["🦄", "🐉", "🏰", "🪄", "✨", "⭐", "🌈", "🦋", "🍄", "🌳", "🧙‍♂️", "🧚‍♀️", "💎", "🦁", "🐢", "🐧"];
const BACKGROUNDS = [
    "bg-gradient-to-b from-blue-300 to-green-200", // Meadow
    "bg-gradient-to-b from-indigo-900 to-purple-800", // Night Sky
    "bg-gradient-to-b from-pink-200 to-rose-300", // Candy Land
    "bg-gradient-to-b from-blue-400 to-blue-600", // Undersea
];

interface PlacedSticker {
    id: number;
    emoji: string;
    x: number;
    y: number;
    scale: number;
    rotation: number;
}

export default function StickerCanvas() {
    const [placed, setPlaced] = useState<PlacedSticker[]>([]);
    const [bgIndex, setBgIndex] = useState(0);
    const canvasRef = useRef<HTMLDivElement>(null);

    const addSticker = (emoji: string) => {
        const newSticker: PlacedSticker = {
            id: Date.now(),
            emoji,
            x: 50,
            y: 50,
            scale: 1,
            rotation: Math.random() * 20 - 10,
        };
        setPlaced([...placed, newSticker]);
    };

    const updateSticker = (id: number, delta: Partial<PlacedSticker>) => {
        setPlaced(placed.map(s => s.id === id ? { ...s, ...delta } : s));
    };

    const removeSticker = (id: number) => {
        setPlaced(placed.filter(s => s.id !== id));
    };

    const clearCanvas = () => {
        if (confirm("Clear your masterpiece?")) setPlaced([]);
    };

    return (
        <div className="h-screen w-full flex flex-col font-sans overflow-hidden bg-[#FDF6E3]">
            {/* HUD */}
            <div className="p-3 md:p-4 flex justify-between items-center bg-white shadow-xl relative z-50">
                <Link href="/games">
                    <button className="bg-gray-100 px-4 py-2 md:px-6 md:py-2 rounded-full text-gray-700 font-bold hover:bg-gray-200 transition-all text-sm md:text-base">
                        ⬅ Exit
                    </button>
                </Link>
                <div className="flex gap-2 md:gap-4">
                    <button
                        onClick={() => setBgIndex((bgIndex + 1) % BACKGROUNDS.length)}
                        className="bg-amber-100 px-4 py-2 md:px-6 md:py-2 rounded-full text-amber-700 font-bold border-2 border-amber-200 hover:bg-amber-200 text-sm md:text-base"
                    >
                        🏔️ <span className="hidden md:inline">Change Scene</span><span className="md:hidden">Scene</span>
                    </button>
                    <button
                        onClick={clearCanvas}
                        className="bg-rose-100 px-4 py-2 md:px-6 md:py-2 rounded-full text-rose-700 font-bold border-2 border-rose-200 hover:bg-rose-200 text-sm md:text-base"
                    >
                        🗑️ <span className="hidden md:inline">Clear</span>
                    </button>
                </div>
            </div>

            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                {/* SIDEBAR/BOTTOM BAR: STICKERS */}
                <div className="w-full md:w-32 order-2 md:order-1 bg-white border-t md:border-t-0 md:border-r border-gray-100 p-3 md:p-4 overflow-x-auto md:overflow-y-auto flex flex-row md:flex-col gap-3 md:gap-4 shadow-inner custom-scrollbar">
                    <div className="hidden md:block text-[10px] font-black text-gray-400 uppercase text-center mb-2">Stickers</div>
                    {STICKERS.map((emoji) => (
                        <motion.button
                            key={emoji}
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => addSticker(emoji)}
                            className="flex-shrink-0 w-14 h-14 md:w-20 md:h-20 bg-gray-50 hover:bg-white rounded-xl md:rounded-2xl shadow-sm hover:shadow-md flex items-center justify-center text-3xl md:text-4xl border border-gray-100 transition-all"
                        >
                            {emoji}
                        </motion.button>
                    ))}
                </div>

                {/* CANVAS */}
                <div
                    ref={canvasRef}
                    className={`flex-1 order-1 md:order-2 relative overflow-hidden transition-all duration-1000 ${BACKGROUNDS[bgIndex]}`}
                >
                    {/* Instructions */}
                    {placed.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-4">
                            <div className="bg-white/80 backdrop-blur-md p-6 md:p-8 rounded-3xl md:rounded-[3rem] text-center border-4 border-dashed border-white/50 max-w-xs md:max-w-none">
                                <div className="text-4xl md:text-6xl mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">🎨</div>
                                <p className="text-lg md:text-xl font-black text-purple-900 uppercase tracking-tighter">
                                    Pick a sticker to start your magic scene!
                                </p>
                            </div>
                        </div>
                    )}

                    <AnimatePresence>
                        {placed.map((s) => (
                            <motion.div
                                key={s.id}
                                drag
                                dragConstraints={canvasRef}
                                dragElastic={0.1}
                                initial={{ scale: 0, rotate: s.rotation }}
                                animate={{ scale: s.scale, rotate: s.rotation }}
                                exit={{ scale: 0, opacity: 0 }}
                                className="absolute cursor-grab active:cursor-grabbing p-4 group select-none"
                                style={{
                                    left: `${s.x}%`,
                                    top: `${s.y}%`,
                                    zIndex: s.id
                                }}
                            >
                                <div className="text-6xl md:text-8xl relative drop-shadow-[0_5px_15px_rgba(0,0,0,0.2)]">
                                    {s.emoji}
                                    {/* Controls */}
                                    <div className="absolute -top-4 -right-4 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-0 translate-x-4 pointer-events-auto">
                                        <button
                                            onPointerDown={(e) => { e.stopPropagation(); removeSticker(s.id); }}
                                            className="w-8 h-8 bg-rose-500 text-white rounded-full text-xs font-bold shadow-lg"
                                        >
                                            ✕
                                        </button>
                                        <button
                                            onPointerDown={(e) => { e.stopPropagation(); updateSticker(s.id, { scale: s.scale + 0.2 }); }}
                                            className="w-8 h-8 bg-blue-500 text-white rounded-full text-sm font-bold shadow-lg"
                                        >
                                            +
                                        </button>
                                        <button
                                            onPointerDown={(e) => { e.stopPropagation(); updateSticker(s.id, { scale: Math.max(0.5, s.scale - 0.2) }); }}
                                            className="w-8 h-8 bg-blue-500 text-white rounded-full text-sm font-bold shadow-lg"
                                        >
                                            −
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>

            <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
      `}</style>
        </div>
    );
}
