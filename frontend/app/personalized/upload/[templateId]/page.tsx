"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { API_BASE } from "@/lib/api";

interface Template {
    id: string;
    title: string;
    emoji: string;
    color: string;
}

export default function PersonalizeUpload() {
    const { templateId } = useParams();
    const router = useRouter();
    const [template, setTemplate] = useState<Template | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [heroName, setHeroName] = useState("");
    const [uploading, setUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    useEffect(() => {
        fetch(`${API_BASE}/personalized/templates`)
            .then(res => res.json())
            .then(data => {
                const current = data.find((t: any) => t.id === templateId);
                setTemplate(current);
            });
    }, [templateId]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setPreviewUrl(URL.createObjectURL(selectedFile));
        }
    };

    const handleStartMagic = async () => {
        if (!file || !heroName) return;

        setUploading(true);
        const formData = new FormData();
        formData.append("template_id", templateId as string);
        formData.append("hero_name", heroName);
        formData.append("file", file);

        try {
            const res = await fetch(`${API_BASE}/personalized/create-order`, {
                method: "POST",
                body: formData,
            });
            const data = await res.json();
            if (data.order_id) {
                await fetch(`${API_BASE}/personalized/generate/${data.order_id}`, { method: "POST" });
                router.push(`/personalized/processing/${data.order_id}`);
            }
        } catch (err) {
            console.error("Upload failed:", err);
            setUploading(false);
        }
    };

    return (
        <div
            className="min-h-screen flex flex-col items-center justify-center py-20 px-4 relative overflow-hidden"
            style={{
                background: "linear-gradient(135deg, #fbcfe8 0%, #ddd6fe 50%, #bae6fd 100%)",
                fontFamily: "'Fredoka One', cursive"
            }}
        >
            {/* 🎨 Background Art Elements */}
            <div className="absolute inset-0 pointer-events-none opacity-30">
                <div className="absolute top-20 left-20 text-9xl">⭐</div>
                <div className="absolute bottom-20 right-20 text-9xl">✨</div>
                <div className="absolute top-1/2 right-10 text-8xl">🎈</div>
                <div className="absolute bottom-1/4 left-10 text-8xl">🎨</div>
            </div>

            <motion.div
                initial={{ scale: 0.8, opacity: 0, rotate: -2 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                className="bg-white border-[6px] border-indigo-500 rounded-[3rem] p-6 sm:p-10 max-w-2xl w-full shadow-[0_30px_60px_-12px_rgba(0,0,0,0.2)] z-10"
            >
                <div className="text-center mb-10">
                    <motion.div
                        animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 3, repeat: Infinity }}
                        className="text-7xl sm:text-9xl mb-3 sm:mb-4 inline-block"
                    >
                        {template?.emoji || "✨"}
                    </motion.div>
                    <h2 className="text-2xl sm:text-4xl font-black text-indigo-900 mb-2 leading-tight">
                        Who is the <span className="text-pink-500 underline decoration-indigo-200">Hero</span>?
                    </h2>
                    <p className="text-indigo-900/40 text-lg font-medium tracking-wide">Enter your name and pick your best photo! 📸</p>
                </div>

                <div className="space-y-8">
                    <div className="relative">
                        <label className="block text-sm font-black text-indigo-900/60 uppercase tracking-widest mb-3 ml-2">What's your name?</label>
                        <input
                            type="text"
                            placeholder="Type your name here..."
                            value={heroName}
                            onChange={(e) => setHeroName(e.target.value)}
                            className="w-full bg-indigo-50 border-4 border-indigo-100 rounded-[2rem] p-6 text-indigo-900 placeholder-indigo-200 focus:border-indigo-500 focus:bg-white outline-none transition-all text-2xl font-black shadow-inner"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-black text-indigo-900/60 uppercase tracking-widest mb-3 ml-2">Pick your best picture!</label>
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`group relative w-full aspect-video rounded-[3rem] border-4 border-dashed flex flex-col items-center justify-center overflow-hidden transition-all cursor-pointer bg-indigo-50/30
                                ${previewUrl ? 'border-transparent' : 'border-indigo-100 hover:border-pink-400 hover:bg-pink-50'}`}
                            onClick={() => document.getElementById('face-upload')?.click()}
                        >
                            {previewUrl ? (
                                <>
                                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-pink-500/20 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                        <span className="text-white text-2xl font-black bg-pink-500 px-8 py-3 rounded-full shadow-xl">Change Photo 📸</span>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center p-8">
                                    <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center mx-auto mb-4 shadow-xl group-hover:bg-yellow-100 transition-colors">
                                        <span className="text-5xl">📷</span>
                                    </div>
                                    <span className="text-indigo-900 font-black text-xl block mb-1">Click to Pick!</span>
                                    <span className="text-indigo-900/40 text-sm font-bold">Show us your happy face! 😊</span>
                                </div>
                            )}
                            <input
                                id="face-upload"
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileChange}
                            />
                        </motion.div>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.05, y: -5 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleStartMagic}
                        disabled={!file || !heroName || uploading}
                        className="w-full py-5 sm:py-6 relative overflow-hidden text-white font-black text-xl sm:text-3xl rounded-[2rem] sm:rounded-[2.5rem] shadow-[0_20px_40px_-5px_rgba(236,72,153,0.4)] disabled:opacity-50 disabled:grayscale transition-all"
                        style={{
                            background: "linear-gradient(135deg, #f472b6 0%, #db2777 100%)"
                        }}
                    >
                        {uploading ? (
                            <div className="flex items-center justify-center gap-4">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                    className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full"
                                />
                                <span>Doing Magic...</span>
                            </div>
                        ) : (
                            <span>START THE MAGIC! ✨</span>
                        )}

                        {/* 🌟 Tiny floating stars inside button */}
                        <div className="absolute top-2 right-4 text-xl">⭐</div>
                        <div className="absolute bottom-2 left-4 text-xl">⭐</div>
                    </motion.button>
                </div>
            </motion.div>

            {/* 🌈 Fixed Header Hint */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-10 flex gap-4 text-4xl"
            >
                <span>🌈</span><span>🚀</span><span>🛸</span><span>🐯</span>
            </motion.div>
        </div>
    );
}
