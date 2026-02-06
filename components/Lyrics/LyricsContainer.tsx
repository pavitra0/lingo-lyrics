import React, { useEffect, useRef, useState } from "react";
import { usePlayer } from "@/lib/contexts/PlayerContext";
import { cn, detectLanguage } from "@/lib/utils";
import { motion } from "framer-motion";
import { translateText, getWordMeaning } from "@/lib/lingoClient";
import { Heart, ChevronDown, BookPlus } from "lucide-react";
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
    language?: string;
}

const parseLrc = (lrc: string): LrcLine[] => {
    const lines = lrc.split("\n");
    const regex = /^\[(\d{2}):(\d{2})(\.\d{2,3})?\](.*)/;
    const result: LrcLine[] = [];

    for (const line of lines) {
        const match = line.match(regex);
        if (match) {
            const minutes = parseInt(match[1]);
            const seconds = parseInt(match[2]);
            const milliseconds = match[3] ? parseInt(match[3].replace('.', '').padEnd(3, '0')) : 0;
            const time = minutes * 60 + seconds + milliseconds / 1000;
            const text = match[4].trim();
            if (text) {
                result.push({ time, text });
            }
        }
    }
    return result;
};

export function LyricsContainer({ syncedLyrics, plainLyrics, title, artist = "Unknown Artist", songId, language = "en" }: LyricsContainerProps) {
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

    // Track in-flight requests to prevent duplicate fetches
    const fetchingRef = useRef(new Set<string>());

    // Language State
    const [targetLang, setTargetLang] = useState("en"); // Default default

    // Load preference on mount
    useEffect(() => {
        const savedLang = localStorage.getItem("targetLang_pref");
        if (savedLang) setTargetLang(savedLang);
    }, []);

    const languages = [
        { code: "en", name: "English" },
        { code: "hi", name: "Hindi" },
        { code: "es", name: "Spanish" },
        { code: "fr", name: "French" },
        { code: "de", name: "German" },
        { code: "ja", name: "Japanese" },
        { code: "ko", name: "Korean" }
    ];

    const [isSynced, setIsSynced] = useState(false);

    useEffect(() => {
        if (syncedLyrics) {
            setLines(parseLrc(syncedLyrics));
            setIsSynced(true);
        } else if (plainLyrics) {
            // Parse plain lyrics into lines with dummy time
            setLines(plainLyrics.split('\n').map(text => ({ time: 0, text: text.trim() })).filter(l => l.text));
            setIsSynced(false);
        } else {
            setLines([]);
            setIsSynced(false);
        }
    }, [syncedLyrics, plainLyrics]);

    // Detect Source Language from Lyrics Content (Overrides metadata if script prevents ambiguity)
    const [detectedSourceLang, setDetectedSourceLang] = useState<string>(language);

    useEffect(() => {
        if (lines.length > 0) {
            // Check the first few lines that have text
            const sampleText = lines.slice(0, 5).map(l => l.text).join(" ");
            const detected = detectLanguage(sampleText);

            // Should we trust detection? Yes, if it finds a specific script.
            if (detected !== "en") {
                console.log(`Auto-detected language from lyrics: ${detected}`);
                setDetectedSourceLang(detected);
            } else {
                setDetectedSourceLang(language);
            }
        }
    }, [lines, language]);




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
        if (lines.length > 0 && isSynced) {
            const index = lines.findLastIndex((line) => line.time <= progress);
            setActiveIndex(index);
        }
    }, [progress, lines, isSynced]);

    useEffect(() => {
        if (activeindex !== -1 && scrollRef.current && lines.length > 0 && isSynced) {
            // Target the inner wrapper's children (the lines)
            // scrollRef.current is the scrolling container
            // scrollRef.current.firstElementChild is the py-[50vh] wrapper
            const activeEl = scrollRef.current.firstElementChild?.children[activeindex] as HTMLElement;
            if (activeEl) {
                activeEl.scrollIntoView({ behavior: "smooth", block: "center" });
            }
        }
    }, [activeindex, lines.length, isSynced]);

    const handleWordClick = async (e: React.MouseEvent, word: string) => {
        e.stopPropagation(); // prevent seek
        const rect = (e.target as HTMLElement).getBoundingClientRect();

        setPopupWord(word);
        setPopupPos({ x: rect.left, y: rect.bottom });
        setPopupLoading(true);
        setPopupData(null);

        const data = await getWordMeaning(word, `Song: ${title} by ${artist}`, detectedSourceLang);
        setPopupData(data);
        setPopupLoading(false);
    };

    // Clear fetching ref when language changes
    useEffect(() => {
        fetchingRef.current.clear();
    }, [targetLang]);

    // Fetch translation for active line AND next line (prefetch)
    useEffect(() => {
        if (showTranslation && lines.length > 0) {
            let indicesToFetch: number[] = [];

            if (isSynced && activeindex !== -1) {
                indicesToFetch = [activeindex, activeindex + 1];
            } else if (!isSynced) {
                // For plain lyrics, maybe fetch visible? 
                // Alternatively, just fetch all incrementally or rely on user scroll?
                // For now, let's just fetch the first 10 lines to start, or maybe all?
                // Fetching ALL might be expensive. Let's fetch as they come into view?
                // Implementing observer is complex. Let's just fetch keys 0-20 for now as a "good enough" start for plain lyrics
                indicesToFetch = Array.from({ length: 20 }, (_, i) => i);
            }

            indicesToFetch.forEach(index => {
                if (index < lines.length) {
                    const line = lines[index];
                    // Create a unique key for the request: index + language
                    const requestKey = `${index}-${targetLang}`;

                    if (line && line.text && !translatedLines[index] && !fetchingRef.current.has(requestKey)) {
                        fetchingRef.current.add(requestKey);
                        // Use detectedSourceLang instead of metadata language
                        translateText(line.text, targetLang, detectedSourceLang)
                            .then(trans => {
                                setTranslatedLines(prev => ({ ...prev, [index]: trans }));
                            })
                            .catch(err => {
                                console.error("Translation failed for line", index, err);
                                fetchingRef.current.delete(requestKey); // Allow retry
                            });
                    }
                }
            });
        }
    }, [activeindex, showTranslation, lines, targetLang, translatedLines]);


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

            <div className="mb-4 flex gap-4 relative z-50">
                <button
                    onClick={() => setShowTranslation(!showTranslation)}
                    className={cn("px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border transition-all flex items-center gap-2", showTranslation ? "bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.3)]" : "text-zinc-400 border-zinc-700 hover:border-zinc-500 hover:text-zinc-200")}
                >
                    <BookPlus size={14} />
                    {showTranslation ? "Translation ON" : "Translate"}
                </button>

                {showTranslation && (
                    <div className="relative group/lang">
                        <button className="px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-white transition-all flex items-center gap-2 bg-black/40 backdrop-blur-md">
                            {languages.find(l => l.code === targetLang)?.name}
                            <ChevronDown size={12} />
                        </button>

                        <div className="absolute top-full left-0 mt-2 w-32 bg-[#212121] border border-white/10 rounded-xl overflow-hidden shadow-2xl opacity-0 invisible group-hover/lang:opacity-100 group-hover/lang:visible transition-all transform origin-top scale-95 group-hover/lang:scale-100 flex flex-col z-50">
                            {languages.map(lang => (
                                <button
                                    key={lang.code}
                                    onClick={() => {
                                        setTargetLang(lang.code);
                                        localStorage.setItem("targetLang_pref", lang.code); // Save Preference
                                        // Clear cache to re-translate
                                        setTranslatedLines({});
                                        fetchingRef.current.clear(); // Explicitly clear any pending
                                    }}
                                    className={cn("px-4 py-2 text-left text-xs font-medium hover:bg-white/10 transition-colors", targetLang === lang.code ? "text-purple-400" : "text-zinc-400")}
                                >
                                    {lang.name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>


            {/* Source Language Override (Visible when Translation ON) */}


            <div className="flex-1 overflow-y-auto w-full px-4 no-scrollbar mask-gradient" ref={scrollRef} style={{ maskImage: "linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)" }}>
                {lines.length > 0 ? (
                    <div className="py-[50vh]">
                        {lines.map((line, i) => {
                            const key = `${songId}|${line.time}|${line.text}`;
                            const isFav = favorites.includes(key);
                            const words = line.text.split(" ");

                            return (
                                <div key={i} className="relative group flex items-center justify-center">
                                    <motion.div
                                        initial={{ opacity: 0.5, scale: 0.95, filter: "blur(2px)" }}
                                        animate={{
                                            opacity: isSynced ? (i === activeindex ? 1 : 0.6) : 1, // Full opacity for plain lyrics
                                            scale: isSynced && i === activeindex ? 1.05 : 1,
                                            color: isSynced && i === activeindex ? "#ffffff" : (isSynced ? "#a1a1aa" : "#e4e4e7"), // Lighter gray for plain lyrics
                                            filter: "blur(0px)" // Removed blur completely
                                        }}
                                        className={cn(
                                            "py-4 text-center cursor-pointer transition-all duration-300 w-full origin-center select-none",
                                            isSynced && i === activeindex ? "font-bold text-2xl md:text-4xl leading-tight" : "text-lg md:text-xl font-medium"
                                        )}
                                        onClick={() => isSynced && seek(line.time)}
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
                ) : (
                    <div className="flex items-center justify-center h-full text-zinc-500">
                        No lyrics available
                    </div>
                )}
            </div>
        </div >
    );
}
