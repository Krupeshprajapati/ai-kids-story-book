"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

const navLinks = [
    { icon: "🏠", label: "Home", href: "/" },
    { icon: "🎭", label: "Magic", href: "/personalized" },
    { icon: "🤖", label: "AI Engine", href: "/ai-engine" },
    { icon: "✨", label: "Create", href: "/upload" },
    { icon: "🎮", label: "Games", href: "/games" },
    { icon: "📚", label: "Library", href: "/library" },
];

export default function Navbar() {
    const pathname = usePathname();

    // Hide navbar inside games to avoid HUD overlap
    if (pathname.startsWith("/games/")) return null;

    return (
        <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 md:bottom-auto md:top-4 md:right-6 md:left-auto md:translate-x-0 z-[100] pointer-events-none w-full md:w-auto px-4 md:px-0">
            <div className="flex flex-row md:flex-col justify-center items-center gap-3 pointer-events-auto bg-white/20 md:bg-transparent backdrop-blur-lg md:backdrop-blur-none p-4 md:p-0 rounded-[2rem] md:rounded-none border border-white/30 md:border-none shadow-2xl md:shadow-none">
                {navLinks.map((link) => {
                    const isActive = pathname === link.href;
                    return (
                        <Link key={link.href} href={link.href} className="relative group">
                            <motion.div
                                whileHover={{ scale: 1.15, y: -5 }}
                                whileTap={{ scale: 0.95 }}
                                className={`w-12 h-12 md:w-14 md:h-14 flex items-center justify-center rounded-2xl backdrop-blur-md border border-white/50 shadow-xl transition-all duration-300 ${isActive
                                    ? "bg-white/90 scale-105 shadow-purple-500/40 border-purple-400/50"
                                    : "bg-white/30 hover:bg-white/50"
                                    }`}
                            >
                                <span className="text-xl md:text-2xl">{link.icon}</span>

                                {/* TOOLTIP (Visible only on Desktop) */}
                                <span className="hidden md:block absolute right-16 top-1/2 -translate-y-1/2 bg-purple-700 text-white text-[10px] px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap font-bold pointer-events-none uppercase tracking-tighter shadow-lg translate-x-4 group-hover:translate-x-0">
                                    {link.label}
                                </span>

                            </motion.div>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
