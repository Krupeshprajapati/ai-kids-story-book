"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { API_BASE } from "@/lib/api";

interface Template {
    id: string;
    title: string;
    description: string;
    color: string;
    pages: { page_number: number; text: string; image_prompt: string }[];
}

export default function TemplatePreview() {
    const { templateId } = useParams();
    const router = useRouter();
    const [template, setTemplate] = useState<Template | null>(null);
    const [currentPage, setCurrentPage] = useState(0);
    const [imgError, setImgError] = useState(false);
    const [direction, setDirection] = useState(1);

    useEffect(() => {
        fetch(`${API_BASE}/personalized/templates`)
            .then((res) => res.json())
            .then((data: Template[]) => {
                const found = data.find((t) => t.id === templateId);
                if (found) setTemplate(found);
            })
            .catch(console.error);
    }, [templateId]);

    if (!template) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#0d0a1e]">
                <div className="relative">
                    <div className="w-20 h-20 border-4 border-purple-500/30 rounded-full animate-spin border-t-purple-500" />
                    <div className="absolute inset-0 flex items-center justify-center text-3xl">📖</div>
                </div>
                <p className="mt-6 text-white/70 text-lg font-medium tracking-wide">Loading your story...</p>
            </div>
        );
    }

    const pages = template.pages;
    const isFirstPage = currentPage === 0;
    const isLastPage = currentPage === pages.length - 1;

    const handleNext = () => {
        if (!isLastPage) {
            setDirection(1);
            setCurrentPage((p) => p + 1);
            setImgError(false);
        }
    };

    const handlePrev = () => {
        if (!isFirstPage) {
            setDirection(-1);
            setCurrentPage((p) => p - 1);
            setImgError(false);
        }
    };

    const bgGradient = template.color
        ? `linear-gradient(135deg, #0d0a1e 0%, ${template.color}33 50%, #0d0a1e 100%)`
        : "linear-gradient(135deg, #0d0a1e 0%, #1e1b4b 100%)";

    const pageVariants = {
        enter: (dir: number) => ({
            x: dir > 0 ? 80 : -80,
            opacity: 0,
        }),
        center: {
            x: 0,
            opacity: 1,
        },
        exit: (dir: number) => ({
            x: dir > 0 ? -80 : 80,
            opacity: 0,
        }),
    };

    return (
        <div
            className="min-h-screen flex flex-col"
            style={{ background: bgGradient }}
        >
            {/* Floating stars background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                {[...Array(30)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute rounded-full bg-white"
                        style={{
                            width: `${Math.random() * 3 + 1}px`,
                            height: `${Math.random() * 3 + 1}px`,
                            top: `${Math.random() * 100}%`,
                            left: `${Math.random() * 100}%`,
                            opacity: Math.random() * 0.6 + 0.1,
                            animation: `pulse ${Math.random() * 3 + 2}s ease-in-out infinite`,
                            animationDelay: `${Math.random() * 3}s`,
                        }}
                    />
                ))}
            </div>

            {/* ── TOP NAV ── */}
            <nav className="relative z-10 flex items-center justify-between px-6 py-4 sm:px-10">
                <motion.button
                    whileHover={{ scale: 1.05, x: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => router.push("/personalized")}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white font-semibold text-sm transition-all shadow-lg"
                >
                    <span className="text-base">←</span> Back to Gallery
                </motion.button>

                <div className="hidden sm:flex flex-col items-center">
                    <p className="text-white/50 text-xs uppercase tracking-widest font-semibold">Preview</p>
                    <h1 className="text-white font-black text-xl bg-gradient-to-r from-yellow-300 to-pink-400 bg-clip-text text-transparent">
                        {template.title}
                    </h1>
                </div>

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => router.push(`/personalized/upload/${template.id}`)}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-full font-black text-sm shadow-lg transition-all"
                    style={{
                        background: "linear-gradient(135deg, #f59e0b, #f97316)",
                        color: "#1e1b4b",
                        boxShadow: "0 4px 20px rgba(245,158,11,0.4)",
                    }}
                >
                    ✨ Use Template
                </motion.button>
            </nav>

            {/* Mobile Title */}
            <div className="sm:hidden text-center mb-2 relative z-10">
                <h1 className="text-white font-black text-lg bg-gradient-to-r from-yellow-300 to-pink-400 bg-clip-text text-transparent">
                    {template.title}
                </h1>
            </div>

            {/* ── MAIN BOOK ── */}
            <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-4">
                <div className="w-full max-w-5xl">
                    <AnimatePresence mode="wait" custom={direction}>
                        <motion.div
                            key={currentPage}
                            custom={direction}
                            variants={pageVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ duration: 0.35, ease: [0.32, 0, 0.67, 0] }}
                            className="flex flex-col md:flex-row rounded-3xl overflow-hidden"
                            style={{
                                boxShadow: "0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)",
                                minHeight: "520px",
                            }}
                        >
                            {/* ── LEFT: IMAGE PAGE (portrait) ── */}
                            <div
                                className="w-full md:w-[42%] relative flex-shrink-0"
                                style={{
                                    background: "linear-gradient(145deg, #1a1535, #0f0c22)",
                                    minHeight: "260px",
                                }}
                            >
                                {/* Corner decorations */}
                                <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-yellow-400/40 rounded-tl-lg z-10" />
                                <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-yellow-400/40 rounded-tr-lg z-10" />
                                <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-yellow-400/40 rounded-bl-lg z-10" />
                                <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-yellow-400/40 rounded-br-lg z-10" />

                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={`img-${currentPage}`}
                                        initial={{ opacity: 0, scale: 1.04 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.4 }}
                                        className="w-full h-full flex items-center justify-center p-4 md:p-5"
                                        style={{ minHeight: "260px" }}
                                    >
                                        {!imgError ? (
                                            <img
                                                src={`/defaults/${template.id}/page-${pages[currentPage].page_number}.png`}
                                                alt={`Page ${pages[currentPage].page_number}`}
                                                className="w-full rounded-2xl object-cover"
                                                style={{
                                                    aspectRatio: "9/16",
                                                    maxHeight: "500px",
                                                    objectFit: "cover",
                                                    boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                                                }}
                                                onError={() => setImgError(true)}
                                            />
                                        ) : (
                                            <div
                                                className="w-full rounded-2xl flex flex-col items-center justify-center gap-3 text-white/40 border border-white/10"
                                                style={{
                                                    aspectRatio: "9/16",
                                                    maxHeight: "500px",
                                                    background: "rgba(255,255,255,0.03)",
                                                }}
                                            >
                                                <span className="text-5xl">🖼️</span>
                                                <p className="text-sm font-medium">Generating image...</p>
                                            </div>
                                        )}
                                    </motion.div>
                                </AnimatePresence>

                                {/* Page number badge on image side */}
                                <div className="absolute bottom-5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white/60 text-xs font-bold tracking-widest border border-white/10">
                                    {currentPage + 1} / {pages.length}
                                </div>
                            </div>

                            {/* ── SPINE ── */}
                            <div
                                className="hidden md:block w-[6px] flex-shrink-0"
                                style={{
                                    background: "linear-gradient(to bottom, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 40%, rgba(255,255,255,0.15) 100%)",
                                    boxShadow: "inset -2px 0 6px rgba(0,0,0,0.4), inset 2px 0 6px rgba(0,0,0,0.4)",
                                }}
                            />

                            {/* ── RIGHT: TEXT PAGE ── */}
                            <div
                                className="flex-1 flex flex-col justify-between relative"
                                style={{
                                    background: "linear-gradient(160deg, #fffef9 0%, #fffbef 60%, #fff8f0 100%)",
                                }}
                            >
                                {/* Paper texture overlay */}
                                <div
                                    className="absolute inset-0 opacity-30 pointer-events-none"
                                    style={{
                                        backgroundImage:
                                            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4'%3E%3Crect width='4' height='4' fill='%23f5f0e8'/%3E%3Ccircle cx='1' cy='1' r='0.5' fill='%23e8e0d0' opacity='0.5'/%3E%3C/svg%3E\")",
                                    }}
                                />

                                {/* Story text */}
                                <div className="relative flex-1 flex flex-col justify-center px-8 md:px-12 py-10 md:py-14">
                                    {/* Decorative quote mark */}
                                    <div
                                        className="absolute top-6 left-8 text-6xl leading-none font-serif select-none"
                                        style={{ color: template.color ? `${template.color}33` : "#a78bfa33", fontFamily: "Georgia" }}
                                    >
                                        "
                                    </div>

                                    <AnimatePresence mode="wait">
                                        <motion.p
                                            key={`text-${currentPage}`}
                                            initial={{ opacity: 0, y: 12 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -12 }}
                                            transition={{ duration: 0.35, delay: 0.05 }}
                                            className="relative z-10 text-xl md:text-2xl leading-loose text-gray-700 text-center"
                                            style={{ fontFamily: "'Georgia', 'Times New Roman', serif", lineHeight: "1.9" }}
                                        >
                                            {pages[currentPage].text.replace(/\[HERO\]/gi, "Alex")}
                                        </motion.p>
                                    </AnimatePresence>
                                </div>

                                {/* Bottom bar */}
                                <div className="relative px-8 py-4 flex items-center justify-between border-t border-gray-100">
                                    {/* Dot progress */}
                                    <div className="flex gap-1.5">
                                        {pages.map((_, i) => (
                                            <button
                                                key={i}
                                                onClick={() => {
                                                    setDirection(i > currentPage ? 1 : -1);
                                                    setCurrentPage(i);
                                                    setImgError(false);
                                                }}
                                                className="rounded-full transition-all duration-300"
                                                style={{
                                                    width: i === currentPage ? "20px" : "8px",
                                                    height: "8px",
                                                    background: i === currentPage
                                                        ? (template.color || "#7c3aed")
                                                        : "#d1d5db",
                                                }}
                                            />
                                        ))}
                                    </div>

                                    <span className="text-gray-300 text-sm font-bold tracking-widest">
                                        ✦ {currentPage + 1}
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>

                    {/* ── NAVIGATION ARROWS ── */}
                    <div className="flex items-center justify-center gap-5 mt-8">
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={handlePrev}
                            disabled={isFirstPage}
                            className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-black shadow-lg backdrop-blur-md border border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            style={{
                                background: isFirstPage
                                    ? "rgba(255,255,255,0.05)"
                                    : "linear-gradient(135deg, rgba(124,58,237,0.6), rgba(139,92,246,0.4))",
                                boxShadow: isFirstPage ? "none" : "0 4px 20px rgba(124,58,237,0.4)",
                            }}
                        >
                            ←
                        </motion.button>

                        <div className="flex flex-col items-center">
                            <span className="text-white/40 text-xs uppercase tracking-widest font-semibold">Page</span>
                            <span className="text-white font-black text-2xl leading-tight">
                                {currentPage + 1}
                                <span className="text-white/30 text-base font-medium"> / {pages.length}</span>
                            </span>
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={handleNext}
                            disabled={isLastPage}
                            className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-black shadow-lg backdrop-blur-md border border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            style={{
                                background: isLastPage
                                    ? "rgba(255,255,255,0.05)"
                                    : "linear-gradient(135deg, rgba(236,72,153,0.6), rgba(249,115,22,0.4))",
                                boxShadow: isLastPage ? "none" : "0 4px 20px rgba(236,72,153,0.4)",
                            }}
                        >
                            →
                        </motion.button>
                    </div>

                    {/* ── BOTTOM CTA ── */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="mt-8 text-center"
                    >
                        <p className="text-white/40 text-xs font-medium mb-3 uppercase tracking-widest">
                            💡 Your hero&apos;s face will appear in every illustration
                        </p>
                        <motion.button
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => router.push(`/personalized/upload/${template.id}`)}
                            className="inline-flex items-center gap-3 px-10 py-4 rounded-full font-black text-base shadow-xl transition-all"
                            style={{
                                background: "linear-gradient(135deg, #f59e0b, #f97316, #ef4444)",
                                color: "white",
                                boxShadow: "0 6px 30px rgba(245,158,11,0.5)",
                                textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                            }}
                        >
                            🌟 Create My Personalized Book
                        </motion.button>
                    </motion.div>
                </div>
            </main>
        </div>
    );
}
