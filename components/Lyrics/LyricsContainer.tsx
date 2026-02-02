"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePlayer } from "@/lib/contexts/PlayerContext";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { translateText } from "@/lib/lingoClient";
import { Heart } from "lucide-react";

interface LrcLine {
    time: number;
    text: string;
    translation?: string;
}

interface LyricsContainerProps {
    syncedLyrics: string;
    plainLyrics?: string;
    artist: string;
    title: string;
    songId: string;
}

const parseLrc = (lrc: string): LrcLine[] => {
    const lines = lrc.split("\n");
    const regex = /^\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/;
    const result: LrcLine[] = [];

    for (const line of lines) {
        const match = line.match(regex);
        if (match) {
            const minutes = parseInt(match[1]);
            const seconds = parseInt(match[2]);
            const milliseconds = parseInt(match[3].padEnd(3, '0')); // Handle 2 or 3 digits
            const time = minutes * 60 + seconds + milliseconds / 1000;
            const text = match[4].trim();
            if (text) {
                result.push({ time, text });
            }
        }
    }
    return result;
};

export function LyricsContainer({ syncedLyrics, title, artist, songId }: LyricsContainerProps) {
    const { progress, seek } = usePlayer();
    const [lines, setLines] = useState<LrcLine[]>([]);
    const [activeindex, setActiveIndex] = useState(-1);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [showTranslation, setShowTranslation] = useState(false);
    const [translatedLines, setTranslatedLines] = useState<Record<number, string>>({});
    const [favorites, setFavorites] = useState<string[]>([]);

    useEffect(() => {
        if (syncedLyrics) {
            setLines(parseLrc(syncedLyrics));
        }
    }, [syncedLyrics]);

    useEffect(() => {
        const saved = localStorage.getItem("lyric_favorites");
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Assuming simple array of strings (line text) for now, or objects
                // Let's store unique keys: `${songId}-${lineText}`
                setFavorites(parsed);
            } catch (e) {
                console.error(e);
            }
        }
    }, []);

    const toggleFavorite = (line: LrcLine) => {
        const key = `${songId}|${line.time}|${line.text}`; // unique key
        let newFavs;
        if (favorites.includes(key)) {
            newFavs = favorites.filter(k => k !== key);
        } else {
            newFavs = [...favorites, key];
        }
        setFavorites(newFavs);
        localStorage.setItem("lyric_favorites", JSON.stringify(newFavs));
    };

    useEffect(() => {
        // Find active line
        // We want the last line where line.time <= progress
        const index = lines.findLastIndex((line) => line.time <= progress);
        setActiveIndex(index);
    }, [progress, lines]);

    useEffect(() => {
        // Auto-scroll
        if (activeindex !== -1 && scrollRef.current) {
            const activeEl = scrollRef.current.children[activeindex] as HTMLElement;
            if (activeEl) {
                activeEl.scrollIntoView({ behavior: "smooth", block: "center" });
            }
        }
    }, [activeindex]);

    const handleTranslateToggle = async () => {
        setShowTranslation(!showTranslation);
        if (!showTranslation && Object.keys(translatedLines).length === 0) {
            // Mock bulk translation or translate active lines on demand
            // calling translateText for each line is expensive/slow for demo. 
            // We will do it for the current window or just mock it.
            // For prototype, let's translate visible lines?
        }
    };

    // Fetch translation for active line if needed
    useEffect(() => {
        if (showTranslation && activeindex !== -1 && !translatedLines[activeindex]) {
            const line = lines[activeindex];
            if (line) {
                translateText(line.text).then(trans => {
                    setTranslatedLines(prev => ({ ...prev, [activeindex]: trans }));
                });
            }
        }
    }, [activeindex, showTranslation, lines]);


    return (
        <div className="flex flex-col h-full max-h-[70vh] w-full max-w-2xl mx-auto items-center">
            <div className="mb-4 flex gap-4">
                <button
                    onClick={() => setShowTranslation(!showTranslation)}
                    className={cn("px-4 py-1 rounded-full text-sm border transition", showTranslation ? "bg-white text-black border-white" : "text-zinc-400 border-zinc-600")}
                >
                    ABC / अ
                </button>
            </div>

            <div className="flex-1 overflow-y-auto w-full px-4 no-scrollbar mask-gradient" ref={scrollRef} style={{ maskImage: "linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)" }}>
                <div className="py-[50vh]">
                    {lines.map((line, i) => {
                        const key = `${songId}|${line.time}|${line.text}`;
                        const isFav = favorites.includes(key);
                        return (
                            <div key={i} className="relative group flex items-center justify-center">
                                <motion.div
                                    initial={{ opacity: 0.5, scale: 0.95 }}
                                    animate={{
                                        opacity: i === activeindex ? 1 : 0.4,
                                        scale: i === activeindex ? 1.05 : 1,
                                        color: i === activeindex ? "white" : "#a1a1aa" // zinc-400
                                    }}
                                    className={cn(
                                        "py-4 text-center cursor-pointer transition-all duration-300 w-full",
                                        i === activeindex ? "font-bold text-2xl md:text-3xl" : "text-lg md:text-xl"
                                    )}
                                    onClick={() => seek(line.time)}
                                >
                                    <p>{line.text}</p>
                                    {showTranslation && translatedLines[i] && (
                                        <p className="text-sm md:text-base text-purple-400 mt-1">{translatedLines[i]}</p>
                                    )}
                                </motion.div>

                                {/* Favorite Button (Visible on hover or if favored) */}
                                <button
                                    onClick={(e) => { e.stopPropagation(); toggleFavorite(line); }}
                                    className={cn(
                                        "absolute right-0 p-2 opacity-0 group-hover:opacity-100 transition",
                                        isFav && "opacity-100 text-red-500"
                                    )}
                                >
                                    <Heart size={20} fill={isFav ? "currentColor" : "none"} className={isFav ? "text-red-500" : "text-zinc-500"} />
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            {lines.length === 0 && (
                <div className="flex items-center justify-center h-full text-zinc-500">
                    No lyrics available
                </div>
            )}
        </div>
    );
}
