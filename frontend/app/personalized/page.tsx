"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { API_BASE } from "@/lib/api";

interface Template {
  id: string;
  title: string;
  description: string;
  age_group: string;
  emoji: string;
  color: string;
}

export default function PersonalizedGallery() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetch(`${API_BASE}/personalized/templates`)
      .then((res) => res.json())
      .then((data) => {
        setTemplates(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch templates:", err);
        setLoading(false);
      });
  }, []);

  return (
    <div
      className="min-h-screen py-16 px-4 md:px-8 relative overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #5f55d5 0%, #d76d77 50%, #ffaf7b 100%)",
        fontFamily: "'Fredoka One', cursive",
      }}
    >
      {/* Floating Decorative Bubbles */}
      <div className="absolute inset-0 pointer-events-none">
        {mounted &&
          [...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              animate={{
                y: [0, -100, 0],
                x: [0, i % 2 === 0 ? 25 : -25, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{ duration: 5 + (i % 5), repeat: Infinity }}
              className="absolute rounded-full bg-white/10 blur-xl"
              style={{
                width: 100 + i * 5,
                height: 100 + i * 5,
                top: `${(i * 7) % 100}%`,
                left: `${(i * 13) % 100}%`,
              }}
            />
          ))}
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-16"
        >
          <motion.h1
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="text-5xl md:text-7xl font-black text-white mb-6 drop-shadow-[0_10px_10px_rgba(0,0,0,0.3)]"
          >
            Pick Your <span className="text-yellow-300">Magic</span> Story! ✨
          </motion.h1>
          <p className="text-white/90 text-xl font-medium max-w-2xl mx-auto bg-black/20 backdrop-blur-md py-3 px-8 rounded-full border border-white/20 inline-block">
            Choose a theme and become the hero of your own book! 🦸‍♀️🦸‍♂️
          </p>
        </motion.div>

        {loading ? (
          <div className="flex flex-col justify-center items-center h-96 gap-6">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="text-8xl"
            >
              🌈
            </motion.div>
            <p className="text-white font-bold text-2xl animate-pulse">
              Loading Magic World...
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            <AnimatePresence>
              {templates.map((template, idx) => (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, scale: 0.5, y: 100 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  whileHover={{ scale: 1.05, rotate: -1, zIndex: 50 }}
                  transition={{
                    type: "spring",
                    stiffness: 200,
                    damping: 15,
                    delay: idx * 0.1,
                  }}
                  onClick={() =>
                    router.push(`/personalized/upload/${template.id}`)
                  }
                  className="group cursor-pointer relative"
                >
                  <div className="bg-white rounded-[3rem] p-6 h-full shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-8 border-white group-hover:border-yellow-400 transition-all duration-300 flex flex-col items-center">
                    {/* Age Badge */}
                    <div className="absolute -top-4 -right-4 bg-yellow-400 text-indigo-900 px-6 py-2 rounded-2xl font-black text-lg shadow-xl border-4 border-white transform rotate-6 z-20">
                      AGES {template.age_group}
                    </div>

                    {/* Fun Emoji Icon */}
                    <motion.div
                      animate={{ y: [0, -10, 0] }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: idx * 0.2,
                      }}
                      className="text-9xl mb-6 drop-shadow-lg"
                    >
                      {template.emoji}
                    </motion.div>

                    <h3 className="text-2xl font-black text-indigo-900 mb-2 text-center leading-tight">
                      {template.title}
                    </h3>

                    <p className="text-indigo-900/60 text-center text-sm mb-6 flex-grow font-medium leading-tight">
                      {template.description}
                    </p>

                    <div className="w-full mt-auto flex gap-2 pt-4">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/personalized/preview/${template.id}`);
                        }}
                        className="flex-1 py-2 px-1 rounded-full bg-white text-indigo-900 border-2 border-indigo-100 font-bold text-sm shadow-sm hover:border-purple-400 hover:text-purple-600 transition-colors flex items-center justify-center gap-1"
                      >
                        Preview 👀
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/personalized/upload/${template.id}`);
                        }}
                        className="flex-[1.5] py-2 px-2 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-black text-sm sm:text-base shadow-lg hover:shadow-pink-500/40 transition-shadow flex items-center justify-center"
                      >
                        LET'S GO! 🚀
                      </motion.button>
                    </div>
                  </div>

                  {/* Behind-card Glow */}
                  <div
                    className="absolute inset-0 -z-10 blur-3xl opacity-0 group-hover:opacity-60 transition-opacity"
                    style={{ backgroundColor: template.color }}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Fixed Footer Decor */}
      <div className="fixed bottom-0 left-0 w-full h-24 bg-gradient-to-t from-white/20 to-transparent pointer-events-none" />
    </div>
  );
}
