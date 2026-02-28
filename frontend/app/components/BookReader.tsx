import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { API_BASE } from "@/lib/api";

interface BookReaderProps {
    title: string;
    pages: any[];
    coverImage?: string;
    onSave?: () => void;
}

// Small decorative SVG doodles for the right page background
const Doodles = () => (
    <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-10" xmlns="http://www.w3.org/2000/svg">
        <text x="5%" y="12%" fontSize="18" fill="#f59e0b">★</text>
        <text x="88%" y="15%" fontSize="14" fill="#a78bfa">✦</text>
        <text x="78%" y="88%" fontSize="18" fill="#f59e0b">★</text>
        <text x="8%" y="82%" fontSize="12" fill="#34d399">✦</text>
        <circle cx="92%" cy="50%" r="4" fill="#f472b6" />
        <circle cx="4%" cy="42%" r="3" fill="#60a5fa" />
        <circle cx="85%" cy="35%" r="5" fill="#fbbf24" opacity="0.6" />
        <path d="M 20 60 Q 40 40 60 60 Q 80 80 100 60" stroke="#a78bfa" strokeWidth="1.5" fill="none" opacity="0.5" />
        <text x="50%" y="6%" fontSize="12" fill="#f87171" textAnchor="middle">♥</text>
        <text x="15%" y="95%" fontSize="10" fill="#f87171">♥</text>
        <text x="92%" y="95%" fontSize="14" fill="#fbbf24">☽</text>
    </svg>
);

export default function BookReader({ title, pages, coverImage, onSave }: BookReaderProps) {
    const [currentPage, setCurrentPage] = useState(-1);
    const [isFlipping, setIsFlipping] = useState(false);
    const [direction, setDirection] = useState(1);

    if (!pages || pages.length === 0) return null;

    const totalSpreads = pages.length;

    const handleNext = () => {
        if (isFlipping) return;
        if (currentPage < totalSpreads - 1) {
            setDirection(1);
            setIsFlipping(true);
            setTimeout(() => { setCurrentPage(curr => curr + 1); setIsFlipping(false); }, 500);
        }
    };

    const handlePrev = () => {
        if (isFlipping) return;
        if (currentPage >= 0) {
            setDirection(-1);
            setIsFlipping(true);
            setTimeout(() => { setCurrentPage(curr => curr - 1); setIsFlipping(false); }, 500);
        }
    };

    const resolveUrl = (url: string) => {
        if (!url) return '';
        return url.startsWith('http') ? url : `${API_BASE}${url}`;
    };

    const isFirstStoryPage = currentPage === 0;

    return (
        <div className="flex flex-col items-center justify-center w-full h-full">

            {/* ═══ COVER PAGE ═══ */}
            {currentPage === -1 && (
                <div className="relative w-full max-w-[340px] sm:max-w-[420px] md:max-w-[540px]"
                    style={{ aspectRatio: "9/14" }}>
                    <div className="absolute inset-0 rounded-3xl overflow-hidden shadow-2xl"
                        style={{ border: "10px solid rgba(255,255,255,0.2)", borderLeft: "14px solid rgba(255,255,255,0.3)" }}>
                        {coverImage
                            ? <img src={resolveUrl(coverImage)} alt="Cover" className="absolute inset-0 w-full h-full object-cover object-top" />
                            : <div className="absolute inset-0 bg-gradient-to-br from-purple-700 to-indigo-900" />
                        }
                        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.88) 40%, rgba(0,0,0,0.1) 70%, transparent)" }} />

                        {/* Corner brackets */}
                        {[["top-3 left-3", "border-t-2 border-l-2 rounded-tl-lg"], ["top-3 right-3", "border-t-2 border-r-2 rounded-tr-lg"], ["bottom-20 left-3", "border-b-2 border-l-2 rounded-bl-lg"], ["bottom-20 right-3", "border-b-2 border-r-2 rounded-br-lg"]].map(([pos, brd], i) => (
                            <div key={i} className={`absolute ${pos} w-6 h-6 sm:w-8 sm:h-8 ${brd} border-yellow-400/70`} />
                        ))}

                        {/* Title + CTA */}
                        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 flex flex-col items-center gap-3">
                            <h2 className="text-white text-center font-black drop-shadow-xl"
                                style={{ fontFamily: "var(--font-caveat), cursive", fontSize: "clamp(1.6rem, 5vw, 2.4rem)", textShadow: "0 2px 12px rgba(0,0,0,0.9)" }}>
                                {title}
                            </h2>
                            <motion.button
                                whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
                                className="px-6 py-2.5 sm:px-8 sm:py-3 rounded-full font-black cursor-pointer text-white"
                                style={{
                                    background: "linear-gradient(135deg, #f59e0b, #f97316)",
                                    fontFamily: "var(--font-caveat), cursive",
                                    fontSize: "clamp(1.1rem, 3vw, 1.4rem)",
                                    boxShadow: "0 4px 20px rgba(245,158,11,0.6)"
                                }}
                                onClick={handleNext}
                            >
                                🌟 Open the Book!
                            </motion.button>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ OPEN PAGES ═══ */}
            {currentPage >= 0 && (
                <div className="w-full max-w-[360px] sm:max-w-[500px] md:max-w-[820px] rounded-2xl overflow-hidden shadow-2xl"
                    style={{ border: "6px solid white", boxShadow: "0 20px 50px rgba(0,0,0,0.4)" }}>

                    {/* ── MOBILE & TABLET: Vertical Stack ──
                        ── DESKTOP (md+): Side-by-side ── */}
                    <div className="flex flex-col md:flex-row md:h-[490px]">

                        {/* LEFT: Image */}
                        <div
                            className="relative w-full md:w-[45%] overflow-hidden flex-shrink-0"
                            style={{
                                // Mobile: keep 9:14 aspect (portrait), Desktop: full height
                                aspectRatio: "9 / 12",
                                background: isFirstStoryPage
                                    ? "linear-gradient(145deg, #1a0533, #2d0b69, #1a0533)"
                                    : "linear-gradient(145deg, #0f0c22, #1a1535, #0d0a1e)",
                            }}
                        >
                            {/* Override aspect ratio on desktop */}
                            <style>{`@media(min-width:768px){.book-image-panel{aspect-ratio:unset!important;height:100%}}`}</style>

                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={currentPage}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.35 }}
                                    className="absolute inset-0"
                                >
                                    {pages[currentPage]?.image_url ? (
                                        <>
                                            <img
                                                src={resolveUrl(pages[currentPage].image_url)}
                                                alt="Story"
                                                className="w-full h-full"
                                                style={{ objectFit: "cover", objectPosition: "center top" }}
                                            />
                                            <div className="absolute inset-0 pointer-events-none"
                                                style={{ boxShadow: "inset 0 0 40px rgba(0,0,0,0.4)" }} />
                                            {isFirstStoryPage && (
                                                <div className="absolute inset-0 pointer-events-none animate-pulse"
                                                    style={{ background: "radial-gradient(ellipse at center, rgba(167,90,250,0.2) 0%, transparent 70%)" }} />
                                            )}
                                        </>
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-white/30">
                                            <span className="text-4xl">🖼️</span>
                                        </div>
                                    )}
                                </motion.div>
                            </AnimatePresence>

                            {/* Corner brackets */}
                            <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-yellow-400/40 rounded-tl z-20" />
                            <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-yellow-400/40 rounded-tr z-20" />
                            <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-yellow-400/40 rounded-bl z-20" />
                            <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-yellow-400/40 rounded-br z-20" />
                        </div>

                        {/* Spine — only on desktop */}
                        <div className="hidden md:block w-[5px] flex-shrink-0 h-full"
                            style={{ background: "linear-gradient(to right, rgba(0,0,0,0.18), rgba(0,0,0,0.04), rgba(0,0,0,0.18))" }} />

                        {/* RIGHT: Text */}
                        <div
                            className="flex-1 flex flex-col relative overflow-hidden min-h-[180px] sm:min-h-[220px]"
                            style={{
                                background: isFirstStoryPage
                                    ? "linear-gradient(135deg, #fef3ff, #f5e6ff, #ede9ff)"
                                    : "linear-gradient(135deg, #fffbf0, #fff8f5, #fffef9)",
                            }}
                        >
                            <Doodles />

                            {/* PAGE 1: Special Title */}
                            {isFirstStoryPage ? (
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key="titlepage"
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="relative z-10 flex-1 flex flex-col items-center justify-center gap-3 sm:gap-5 px-5 py-6"
                                    >
                                        <div className="text-3xl sm:text-5xl animate-spin" style={{ animationDuration: "8s" }}>✨</div>
                                        <div className="text-center space-y-1">
                                            <p className="text-purple-400 text-[10px] sm:text-xs font-bold uppercase tracking-widest">✦ A Magical Story ✦</p>
                                            <h2 className="font-bold text-purple-800 leading-tight text-center"
                                                style={{ fontFamily: "var(--font-caveat), cursive", fontSize: "clamp(1.5rem, 5vw, 2.6rem)" }}>
                                                {title}
                                            </h2>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="h-0.5 w-10 bg-gradient-to-r from-transparent to-purple-400 rounded" />
                                            <span className="text-purple-400">♦</span>
                                            <div className="h-0.5 w-10 bg-gradient-to-l from-transparent to-purple-400 rounded" />
                                        </div>
                                    </motion.div>
                                </AnimatePresence>
                            ) : (
                                /* REGULAR STORY PAGES */
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={currentPage}
                                        initial={{ x: 20, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        exit={{ x: -20, opacity: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="relative z-10 flex-1 flex flex-col items-center justify-center px-5 sm:px-7 py-5"
                                    >
                                        <div className="absolute top-2 left-4 text-4xl sm:text-5xl font-bold leading-none select-none"
                                            style={{ color: "rgba(167,139,250,0.22)", fontFamily: "Georgia", lineHeight: 1 }}>
                                            "
                                        </div>
                                        <p className="text-center relative z-10"
                                            style={{
                                                fontFamily: "var(--font-caveat), cursive",
                                                fontSize: "clamp(1.2rem, 3.5vw, 1.75rem)",
                                                fontWeight: 700,
                                                lineHeight: "1.65",
                                                color: "#1e1b4b",
                                                letterSpacing: "0.01em",
                                            }}>
                                            {pages[currentPage]?.text || "The adventure continues... ✨"}
                                        </p>
                                        <div className="absolute bottom-8 right-4 text-4xl font-bold leading-none select-none rotate-180"
                                            style={{ color: "rgba(167,139,250,0.18)", fontFamily: "Georgia", lineHeight: 1 }}>
                                            "
                                        </div>
                                    </motion.div>
                                </AnimatePresence>
                            )}

                            {/* Footer */}
                            <div className="relative z-10 flex items-center justify-between px-4 py-2 border-t"
                                style={{ borderColor: "rgba(167,139,250,0.2)", background: "rgba(255,255,255,0.6)", backdropFilter: "blur(4px)" }}>
                                <div className="flex gap-1">
                                    {pages.map((_, i) => (
                                        <div key={i} className="rounded-full transition-all duration-300"
                                            style={{
                                                width: i === currentPage ? "14px" : "5px",
                                                height: "5px",
                                                background: i === currentPage ? "#7c3aed" : "#ddd6fe",
                                            }} />
                                    ))}
                                </div>
                                <span style={{ fontFamily: "var(--font-caveat), cursive", fontSize: "1rem", color: "#9ca3af", fontWeight: 600 }}>
                                    ✦ {currentPage + 1}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ CONTROLS ═══ */}
            {currentPage >= 0 && (
                <div className="mt-5 sm:mt-8 flex items-center gap-3 sm:gap-4 px-4 py-2.5 rounded-full border border-white/50"
                    style={{ background: "rgba(255,255,255,0.35)", backdropFilter: "blur(12px)", boxShadow: "0 6px 24px rgba(0,0,0,0.12)" }}>

                    <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.9 }}
                        onClick={handlePrev}
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-base sm:text-lg shadow-md"
                        style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)", boxShadow: "0 4px 12px rgba(245,158,11,0.5)" }}>
                        ⬅️
                    </motion.button>

                    <div className="font-bold text-purple-900 px-3 sm:px-5 py-1 bg-white rounded-full shadow-inner"
                        style={{ fontFamily: "var(--font-caveat), cursive", fontSize: "clamp(0.9rem, 2.5vw, 1.2rem)" }}>
                        {currentPage + 1} / {totalSpreads}
                    </div>

                    <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.9 }}
                        onClick={handleNext}
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-base sm:text-lg shadow-md"
                        style={{ background: "linear-gradient(135deg, #ec4899, #be185d)", boxShadow: "0 4px 12px rgba(236,72,153,0.5)" }}>
                        ➡️
                    </motion.button>

                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        onClick={onSave}
                        className="px-4 sm:px-6 py-2 text-white font-bold rounded-full shadow-md"
                        style={{
                            background: "linear-gradient(135deg, #7c3aed, #5b21b6)",
                            fontFamily: "var(--font-caveat), cursive",
                            fontSize: "clamp(0.9rem, 2.5vw, 1.1rem)",
                            boxShadow: "0 4px 12px rgba(124,58,237,0.5)"
                        }}>
                        💾 Save
                    </motion.button>
                </div>
            )}
        </div>
    );
}
