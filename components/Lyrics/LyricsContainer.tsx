import React, { useEffect, useRef, useState } from "react";
import { usePlayer } from "@/lib/contexts/PlayerContext";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { translateText, getWordMeaning } from "@/lib/lingoClient";
import { Heart } from "lucide-react";
import { WordPopup } from "./WordPopup";

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
            const milliseconds = parseInt(match[3].padEnd(3, '0'));
            const time = minutes * 60 + seconds + milliseconds / 1000;
            const text = match[4].trim();
            if (text) {
                result.push({ time, text });
            }
        }
    }
    return result;
};

export function LyricsContainer({ syncedLyrics, title, artist = "Unknown Artist", songId }: LyricsContainerProps) {
    const { progress, seek } = usePlayer();
    const [lines, setLines] = useState<LrcLine[]>([]);
    const [activeindex, setActiveIndex] = useState(-1);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [showTranslation, setShowTranslation] = useState(false);
    const [translatedLines, setTranslatedLines] = useState<Record<number, string>>({});
    const [favorites, setFavorites] = useState<string[]>([]);


    // Popup State
    const [popupWord, setPopupWord] = useState<string | null>(null);
    const [popupData, setPopupData] = useState<{ meaning: string; translation: string } | null>(null);
    const [popupPos, setPopupPos] = useState({ x: 0, y: 0 });
    const [popupLoading, setPopupLoading] = useState(false);

    useEffect(() => {
        if (syncedLyrics) {
            setLines(parseLrc(syncedLyrics));
        }
    }, [syncedLyrics]);


    interface FavoriteLine {
        id: string; // Unique ID: songId|time
        songId: string;
        time: number;
        text: string;
        title: string;
        artist: string;
        image?: string;
    }

    useEffect(() => {
        // Load IDs only for local UI state
        const savedDB = localStorage.getItem("lyric_favorites_db");
        if (savedDB) {
            try {
                const parsed: FavoriteLine[] = JSON.parse(savedDB);
                setFavorites(parsed.map(f => `${f.songId}|${f.time}|${f.text}`));
            } catch (e) {
                console.error(e);
            }
        }
    }, []);

    const toggleFavorite = (line: LrcLine) => {
        const key = `${songId}|${line.time}|${line.text}`;
        let newFavsKeys = [...favorites];

        // Update DB
        const savedDB = localStorage.getItem("lyric_favorites_db");
        let db: FavoriteLine[] = savedDB ? JSON.parse(savedDB) : [];

        if (favorites.includes(key)) {
            // Remove
            newFavsKeys = newFavsKeys.filter(k => k !== key);
            db = db.filter(f => `${f.songId}|${f.time}|${f.text}` !== key);
        } else {
            // Add
            newFavsKeys.push(key);
            db.push({
                id: key,
                songId,
                time: line.time,
                text: line.text,
                title,
                artist,
                // We don't have image passed here explicitly, but maybe we can? 
                // For now, let's omit image or pass it in props if needed. 
                // Wait, LyricsContainerProps doesn't have image.
            });
        }

        setFavorites(newFavsKeys);
        localStorage.setItem("lyric_favorites_db", JSON.stringify(db));
    };

    useEffect(() => {
        const index = lines.findLastIndex((line) => line.time <= progress);
        setActiveIndex(index);
    }, [progress, lines]);

    useEffect(() => {
        if (activeindex !== -1 && scrollRef.current) {
            const activeEl = scrollRef.current.children[activeindex] as HTMLElement;
            if (activeEl) {
                activeEl.scrollIntoView({ behavior: "smooth", block: "center" });
            }
        }
    }, [activeindex]);

    const handleWordClick = async (e: React.MouseEvent, word: string) => {
        e.stopPropagation(); // prevent seek
        const rect = (e.target as HTMLElement).getBoundingClientRect();

        setPopupWord(word);
        setPopupPos({ x: rect.left, y: rect.bottom });
        setPopupLoading(true);
        setPopupData(null);

        const data = await getWordMeaning(word, `Song: ${title} by ${artist}`);
        setPopupData(data);
        setPopupLoading(false);
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
        <div className="flex flex-col h-full max-h-[70vh] w-full max-w-2xl mx-auto items-center relative">

            {popupWord && (
                <WordPopup
                    word={popupWord}
                    meaning={popupData?.meaning}
                    translation={popupData?.translation}
                    position={popupPos}
                    onClose={() => setPopupWord(null)}
                    loading={popupLoading}
                />
            )}

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
                        const words = line.text.split(" ");

                        return (
                            <div key={i} className="relative group flex items-center justify-center">
                                <motion.div
                                    initial={{ opacity: 0.5, scale: 0.95 }}
                                    animate={{
                                        opacity: i === activeindex ? 1 : 0.4,
                                        scale: i === activeindex ? 1.05 : 1,
                                        color: i === activeindex ? "white" : "#a1a1aa"
                                    }}
                                    className={cn(
                                        "py-4 text-center cursor-pointer transition-all duration-300 w-full",
                                        i === activeindex ? "font-bold text-2xl md:text-3xl" : "text-lg md:text-xl"
                                    )}
                                    onClick={() => seek(line.time)}
                                >
                                    <p>
                                        {words.map((word, wIndex) => (
                                            <span
                                                key={wIndex}
                                                className="hover:underline decoration-purple-500/50 hover:text-purple-300 transition-colors cursor-pointer mr-1.5"
                                                onClick={(e) => handleWordClick(e, word)}
                                            >
                                                {word}
                                            </span>
                                        ))}
                                    </p>
                                    {showTranslation && translatedLines[i] && (
                                        <p className="text-sm md:text-base text-purple-400 mt-1">{translatedLines[i]}</p>
                                    )}
                                </motion.div>

                                {/* Favorite Button */}
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
