"use client";

import { useEffect, useState } from "react";
import { Book, Trash2, Volume2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface VocabWord {
    id: string;
    word: string;
    meaning?: string;
    translation?: string;
    date: string;
}

export default function VocabularyPage() {
    const [vocab, setVocab] = useState<VocabWord[]>([]);

    useEffect(() => {
        const loadVocab = () => {
            const savedDB = localStorage.getItem("vocabulary_db");
            if (savedDB) {
                try {
                    setVocab(JSON.parse(savedDB).reverse()); // Newest first
                } catch (e) { console.error(e); }
            }
        };
        loadVocab();
        window.addEventListener('storage', loadVocab);
        return () => window.removeEventListener('storage', loadVocab);
    }, []);

    const removeWord = (id: string) => {
        const newVocab = vocab.filter(v => v.id !== id);
        setVocab(newVocab);
        localStorage.setItem("vocabulary_db", JSON.stringify(newVocab));
    };

    return (
        <div className="flex flex-col w-full min-h-screen bg-black text-white p-4 md:p-8 pb-32">
            <div className="flex items-center gap-4 mb-8">
                <Book className="text-blue-500" size={32} />
                <h1 className="text-3xl md:text-4xl font-bold">Your Vocabulary</h1>
            </div>

            {vocab.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
                    <Book size={48} className="mb-4 opacity-20" />
                    <p>No words saved yet.</p>
                    <p className="text-sm">Click words in lyrics to add them here.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full">
                    <AnimatePresence>
                        {vocab.map((item) => (
                            <motion.div
                                key={item.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="bg-[#212121] border border-white/5 rounded-xl p-5 relative group hover:border-white/10 transition"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="text-xl font-bold capitalize text-white">{item.word}</h3>
                                    <button
                                        onClick={() => removeWord(item.id)}
                                        className="text-zinc-500 hover:text-red-500 transition opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                                <div className="flex flex-col gap-1 mb-4">
                                    {item.translation && (
                                        <span className="text-purple-400 font-medium">{item.translation}</span>
                                    )}
                                    {item.meaning && (
                                        <p className="text-zinc-400 text-sm line-clamp-3">{item.meaning}</p>
                                    )}
                                    {!item.translation && !item.meaning && (
                                        <span className="text-zinc-600 italic text-sm">No definition available</span>
                                    )}
                                </div>
                                <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/5">
                                    <span className="text-xs text-zinc-600">{new Date(item.date).toLocaleDateString()}</span>
                                    <button className="text-zinc-500 hover:text-white transition">
                                        <Volume2 size={16} />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
