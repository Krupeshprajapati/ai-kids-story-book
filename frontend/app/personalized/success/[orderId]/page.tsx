"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { API_BASE } from "@/lib/api";
import BookReader from "@/app/components/BookReader";

function Confetti() {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    if (!mounted) return null;

    return (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
            {Array.from({ length: 40 }).map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute w-3 h-3 rounded-sm"
                    style={{
                        left: `${(i * 2.5) % 100}%`,
                        top: "-20px",
                        background: ["#FFD700", "#FF69B4", "#7FFFD4", "#FF4500", "#DA70D6"][i % 5],
                    }}
                    animate={{
                        y: ["0vh", "110vh"],
                        x: [0, (i % 2 === 0 ? 50 : -50)],
                        rotate: [0, 360]
                    }}
                    transition={{
                        duration: 3 + (i % 3),
                        repeat: Infinity,
                        delay: (i % 5) * 0.5
                    }}
                />
            ))}
        </div>
    );
}

export default function SuccessPage() {
    const { orderId } = useParams();
    const [pdfUrl, setPdfUrl] = useState("");
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);
    const [showReader, setShowReader] = useState(false);
    const [bookData, setBookData] = useState<any>(null);

    useEffect(() => {
        setMounted(true);
        fetch(`${API_BASE}/book/${orderId}`)
            .then(res => res.json())
            .then(data => {
                setBookData(data);
                setPdfUrl(data.pdf_url);
                setLoading(false);
            })
            .catch(err => console.error("Failed to fetch order:", err));
    }, [orderId]);

    const handleDownload = () => {
        if (!pdfUrl) return;
        const link = document.createElement('a');
        link.href = `${API_BASE}${pdfUrl}`;
        link.download = `MagicBook_${orderId}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (!mounted) return null;

    return (
        <div
            className="min-h-screen flex flex-col items-center justify-center p-6 text-center relative overflow-hidden"
            style={{
                background: "radial-gradient(circle at center, #7c3aed, #4c1d95)",
                fontFamily: "'Fredoka One', cursive"
            }}
        >
            <Confetti />

            {/* Radiant Glow Background */}
            <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 5, repeat: Infinity }}
                className="absolute w-[600px] h-[600px] bg-yellow-400 rounded-full blur-[120px] pointer-events-none opacity-30"
            />

            <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                className="text-[80px] sm:text-[120px] md:text-[160px] mb-6 md:mb-8 relative z-10 drop-shadow-2xl"
            >
                �
            </motion.div>

            <div className="relative z-10 space-y-6 mb-12">
                <motion.h1
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-3xl sm:text-5xl md:text-8xl font-black text-white leading-tight"
                    style={{ textShadow: "0 8px 0 rgba(0,0,0,0.15)" }}
                >
                    MAAAAGIC! ✨
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-yellow-200 text-lg sm:text-2xl md:text-3xl font-bold max-w-2xl mx-auto px-4"
                >
                    Your epic story is now a real book! Time to read your masterpiece. 📖
                </motion.p>
            </div>

            <div className="flex flex-col gap-6 w-full max-w-md relative z-10">
                <motion.button
                    whileHover={{ scale: 1.05, y: -5 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowReader(true)}
                    className="w-full py-5 sm:py-8 bg-gradient-to-r from-pink-500 to-rose-600 text-white font-black text-xl sm:text-3xl rounded-[2rem] sm:rounded-[2.5rem] shadow-[0_15px_0_#be123c,0_20px_40px_rgba(0,0,0,0.3)] flex items-center justify-center gap-3 border-4 border-white mb-4"
                >
                    <span>📖 VIEW STORY</span>
                </motion.button>

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleDownload}
                    disabled={loading || !pdfUrl}
                    className="w-full py-5 bg-yellow-400 text-purple-900 font-black text-xl rounded-[2rem] shadow-lg flex items-center justify-center gap-3 border-4 border-white"
                >
                    <span>📥 DOWNLOAD</span>
                </motion.button>

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                        const saved = localStorage.getItem('saved_books') || '[]';
                        const books = JSON.parse(saved);
                        if (!books.includes(orderId)) {
                            books.push(orderId);
                            localStorage.setItem('saved_books', JSON.stringify(books));
                            alert('Your magic story has been saved to the library! 📚✨');
                        } else {
                            alert('This story is already in your library! 📖');
                        }
                    }}
                    className="w-full py-5 bg-gradient-to-r from-green-400 to-emerald-500 text-white font-black text-xl rounded-[2rem] border-4 border-white/20 hover:scale-105 transition-all shadow-lg"
                >
                    💾 Save to Library
                </motion.button>

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => window.location.href = '/'}
                    className="w-full py-5 bg-white/10 text-white font-black text-xl rounded-[2rem] border-4 border-white/20 hover:bg-white/20 transition-all"
                >
                    Make Another Magic ✨
                </motion.button>
            </div>

            {/* Book Reader Modal */}
            <AnimatePresence>
                {showReader && bookData && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 md:p-10"
                    >
                        <button
                            onClick={() => setShowReader(false)}
                            className="absolute top-4 right-4 sm:top-8 sm:right-8 text-white text-4xl sm:text-6xl font-bold hover:scale-125 transition-transform z-[110]"
                        >
                            ✕
                        </button>
                        <BookReader
                            title={bookData.title}
                            pages={bookData.pages}
                            coverImage={bookData.cover_image}
                            onSave={() => alert("Story saved! ✨")}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Emojis — hidden on small screens */}
            <div className="hidden sm:block absolute top-10 left-10 text-6xl opacity-30">🎈</div>
            <div className="hidden sm:block absolute top-20 right-20 text-6xl opacity-30">🍭</div>
            <div className="hidden sm:block absolute bottom-10 left-20 text-6xl opacity-30">🌈</div>
            <div className="hidden sm:block absolute bottom-20 right-10 text-6xl opacity-30">⭐</div>
        </div>
    );
}
