import { X, Volume2, BookPlus, Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface WordPopupProps {
    word: string;
    meaning?: string;
    translation?: string;
    position: { x: number; y: number };
    onClose: () => void;
    loading?: boolean;
}

export function WordPopup({ word, meaning, translation, position, onClose, loading }: WordPopupProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [onClose]);

    // Check if word is already saved
    useEffect(() => {
        const vocab = JSON.parse(localStorage.getItem("vocabulary_db") || "[]");
        const exists = vocab.some((v: any) => v.word.toLowerCase() === word.toLowerCase());
        setSaved(exists);
    }, [word]);

    const handleSave = () => {
        const vocab = JSON.parse(localStorage.getItem("vocabulary_db") || "[]");
        if (saved) {
            // Remove
            const newVocab = vocab.filter((v: any) => v.word.toLowerCase() !== word.toLowerCase());
            localStorage.setItem("vocabulary_db", JSON.stringify(newVocab));
            setSaved(false);
        } else {
            // Add
            const newEntry = {
                id: Date.now().toString(),
                word,
                meaning,
                translation,
                date: new Date().toISOString()
            };
            vocab.push(newEntry);
            localStorage.setItem("vocabulary_db", JSON.stringify(vocab));
            setSaved(true);
        }
    };

    // Adjust position to keep within viewport
    const style = {
        top: position.y + 20, // slightly below cursor
        left: Math.min(Math.max(position.x - 100, 10), window.innerWidth - 220),
    };

    return (
        <AnimatePresence>
            <motion.div
                ref={ref}
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                className="fixed z-50 bg-[#212121] border border-white/10 rounded-xl shadow-2xl p-4 w-64 text-left"
                style={style}
            >
                <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-white capitalize">{word.replace(/[^a-zA-Z]/g, "")}</h3>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={handleSave}
                            className={`p-1 rounded hover:bg-white/10 transition ${saved ? "text-green-500" : "text-zinc-400 hover:text-white"}`}
                            title={saved ? "Saved" : "Save to Vocabulary"}
                        >
                            {saved ? <Check size={16} /> : <BookPlus size={16} />}
                        </button>
                        <button onClick={onClose} className="text-zinc-400 hover:text-white ml-1">
                            <X size={16} />
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex gap-2 items-center text-zinc-500 text-sm">
                        <div className="w-4 h-4 rounded-full border-2 border-zinc-500 border-t-transparent animate-spin" />
                        <span>Fetching meaning...</span>
                    </div>
                ) : (
                    <div className="flex flex-col gap-2">
                        {translation && (
                            <div className="text-purple-400 font-medium text-sm">
                                {translation}
                            </div>
                        )}
                        {meaning && (
                            <p className="text-zinc-300 text-sm leading-relaxed">
                                {meaning}
                            </p>
                        )}
                        {!meaning && !translation && (
                            <p className="text-zinc-500 text-sm italic">No definition found.</p>
                        )}
                    </div>
                )}

                {/* Mock Audio Pronunciation */}
                <button className="mt-3 flex items-center gap-2 text-xs text-zinc-500 hover:text-white transition">
                    <Volume2 size={14} />
                    Pronounce
                </button>

            </motion.div>
        </AnimatePresence>
    );
}
