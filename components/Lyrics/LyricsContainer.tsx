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
    isLoading?: boolean;
    className?: string;
    variant?: "default" | "player";
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

export function LyricsContainer({ syncedLyrics, plainLyrics, title, artist = "Unknown Artist", songId, language = "en", isLoading = false, className, variant = "default" }: LyricsContainerProps) {
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

    // Language Menu State
    const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);

    // Track in-flight requests to prevent duplicate fetches
    const fetchingRef = useRef(new Set<string>());

    // Language State
    const [targetLang, setTargetLang] = useState("en"); // Default default
    const isPlayerVariant = variant === "player";
    const pressableButtonClass = "transform-gpu transition duration-150 ease-out active:scale-95";

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
            const scrollContainer = scrollRef.current;
            const activeEl = scrollRef.current.firstElementChild?.children[activeindex] as HTMLElement;
            if (activeEl) {
                const targetTop = activeEl.offsetTop - scrollContainer.clientHeight / 2 + activeEl.clientHeight / 2;
                scrollContainer.scrollTo({
                    top: Math.max(targetTop, 0),
                    behavior: "smooth",
                });
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

    const handleMouseUp = async () => {
        const selection = window.getSelection();
        if (!selection || selection.toString().trim().length === 0) return;

        const selectedText = selection.toString().trim();

        // If it's a very short selection (like a accidental drag or single char), ignore?
        // Let's assume user intent if length > 0.

        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        setPopupWord(selectedText);
        setPopupPos({ x: rect.left + rect.width / 2, y: rect.bottom }); // Center popup
        setPopupLoading(true);
        setPopupData(null);

        try {
            // "Auto detect the lang and translate"
            // We pass undefined for source, handled by API/SDK auto-detection
            const translation = await translateText(selectedText, targetLang);

            setPopupData({
                meaning: "",
                translation: translation
            });
        } catch (e) {
            console.error(e);
        } finally {
            setPopupLoading(false);
        }
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
    }, [activeindex, showTranslation, lines, targetLang, translatedLines, detectedSourceLang, isSynced]);


    return (
        <div
            className={cn(
                "relative flex h-full min-h-0 w-full flex-col overflow-hidden",
                isPlayerVariant ? "max-h-full max-w-none px-4 lg:px-8 items-start" : "mx-auto max-w-2xl max-h-[70vh] items-center",
                className
            )}
            onMouseUp={handleMouseUp}
        >

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

            <div className={cn("relative z-50 flex gap-4", isPlayerVariant ? "mb-2 shrink-0" : "mb-4")}>
                <button
                    onClick={() => setShowTranslation(!showTranslation)}
                    className={cn(
                        "flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-all",
                        pressableButtonClass,
                        isPlayerVariant && "px-3 py-1",
                        showTranslation
                            ? "border-white bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.25)]"
                            : isPlayerVariant
                                ? "border-white/10 bg-white/5 text-zinc-300 backdrop-blur-md hover:bg-white/15 hover:text-white"
                                : "border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
                    )}
                    title={showTranslation ? "Translation On" : "Translate"}
                >
                    <BookPlus size={14} />
                    {!isPlayerVariant && (showTranslation ? "Translation ON" : "Translate")}
                </button>

                {showTranslation && (
                    <div className="relative">
                        <button
                            onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                            className={cn(
                                "flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-all backdrop-blur-md",
                                pressableButtonClass,
                                isPlayerVariant
                                    ? "border-white/10 bg-white/5 text-zinc-300 hover:bg-white/15 hover:text-white"
                                    : "border-zinc-700 bg-black/40 text-zinc-300 hover:border-zinc-500 hover:text-white"
                            )}
                        >
                            {languages.find(l => l.code === targetLang)?.name}
                            <ChevronDown size={12} className={cn("transition-transform", isLangMenuOpen ? "rotate-180" : "rotate-0")} />
                        </button>

                        {(isLangMenuOpen) && (
                            <div className={cn(
                                "absolute top-full left-0 z-50 mt-2 flex w-32 flex-col overflow-hidden rounded-xl border shadow-2xl animate-in fade-in zoom-in-95 duration-200",
                                isPlayerVariant
                                    ? "border-white/10 bg-black/20 backdrop-blur-xl"
                                    : "border-white/10 bg-[#212121]"
                            )}>
                                {languages.map(lang => (
                                    <button
                                        key={lang.code}
                                        onClick={() => {
                                            setTargetLang(lang.code);
                                            localStorage.setItem("targetLang_pref", lang.code); // Save Preference
                                            // Clear cache to re-translate
                                            setTranslatedLines({});
                                            fetchingRef.current.clear(); // Explicitly clear any pending
                                            setIsLangMenuOpen(false); // Close menu
                                        }}
                                        className={cn("px-4 py-2 text-left text-xs font-medium transition-colors hover:bg-white/10 active:scale-[0.98]", targetLang === lang.code ? "text-white" : "text-zinc-400")}
                                    >
                                        {lang.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>


            {/* Source Language Override (Visible when Translation ON) */}


            <div
                className={cn(
                    "mask-gradient no-scrollbar min-h-0 flex-1 overscroll-contain overflow-y-auto w-full px-4",
                    isPlayerVariant && "bg-transparent px-2"
                )}
                ref={scrollRef}
                style={{ maskImage: "linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)" }}
            >
                {lines.length > 0 ? (
                    <div className={cn(isPlayerVariant ? "py-14" : "py-[35vh]")}>
                        {lines.map((line, i) => {
                            const key = `${songId}|${line.time}|${line.text}`;
                            const isFav = favorites.includes(key);
                            const words = line.text.split(" ");
                            const isLong = words.length > 10;
                            const isVeryLong = words.length > 18;

                            return (
                                <div key={i} className={cn("relative group flex items-center w-full min-w-0", isPlayerVariant ? "justify-start" : "justify-center")}>
                                    <motion.div
                                        initial={{ opacity: 0.5, scale: 0.95, filter: "blur(2px)" }}
                                        animate={{
                                            opacity: isSynced ? (i === activeindex ? 1 : 0.6) : 1, // Full opacity for plain lyrics
                                            scale: isSynced && i === activeindex ? 1.05 : 1,
                                            color: isSynced && i === activeindex ? "#ffffff" : (isSynced ? "#a1a1aa" : "#e4e4e7"), // Lighter gray for plain lyrics
                                            filter: "blur(0px)" // Removed blur completely
                                        }}
                                         className={cn(
                                            "transition-all duration-300 flex-1 min-w-0 origin-left select-none text-left tracking-tight text-balance break-words",
                                            isPlayerVariant ? "py-3 md:py-4 font-black" : "py-3 text-center font-bold",
                                            isSynced && i === activeindex
                                                ? isPlayerVariant
                                                    ? cn("leading-[1.3] opacity-100 scale-[1.02]", isVeryLong ? "text-xl md:text-2xl" : isLong ? "text-2xl md:text-3xl" : "text-3xl md:text-4xl")
                                                    : "text-xl md:text-3xl leading-tight opacity-100 scale-105"
                                                : isPlayerVariant
                                                    ? cn("leading-[1.3] opacity-30 hover:opacity-100", isVeryLong ? "text-xl md:text-2xl" : isLong ? "text-2xl md:text-3xl" : "text-3xl md:text-4xl")
                                                    : "text-lg md:text-2xl opacity-60"
                                        )}
                                        onClick={() => isSynced && seek(line.time)}
                                    >
                                        <p className="px-1 w-full flex flex-wrap">
                                            {words.map((word, wIndex) => (
                                                <span
                                                    key={wIndex}
                                                    className={cn(
                                                        "mr-2 cursor-pointer transition-colors hover:underline underline-offset-8 break-all",
                                                        isPlayerVariant ? "decoration-white/20 hover:text-white" : "decoration-purple-500/50 hover:text-purple-300"
                                                    )}
                                                    onClick={(e) => handleWordClick(e, word)}
                                                >
                                                    {word}
                                                </span>
                                            ))}
                                        </p>
                                        {showTranslation && translatedLines[i] && (
                                            <p className={cn("mt-2", isPlayerVariant ? "text-sm text-zinc-300 md:text-lg font-medium" : "text-sm text-purple-400 md:text-base")}>{translatedLines[i]}</p>
                                        )}
                                    </motion.div>
                                    {/* Favorite Button */}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); toggleFavorite(line); }}
                                        className={cn(
                                            "absolute right-0 p-2 opacity-0 group-hover:opacity-100 transition transform-gpu duration-150 ease-out active:scale-95",
                                            isFav && "opacity-100 text-red-500"
                                        )}
                                    >
                                        <Heart size={20} fill={isFav ? "currentColor" : "none"} className={isFav ? "text-red-500" : isPlayerVariant ? "text-zinc-300" : "text-zinc-500"} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                ) : isLoading ? (
                    <div className="flex h-full flex-col items-center justify-center gap-4 text-zinc-400">
                        <div className={cn("h-8 w-8 animate-spin rounded-full border-4", isPlayerVariant ? "border-white/20 border-t-white" : "border-purple-500/30 border-t-purple-500")} />
                        <span className="text-sm font-medium animate-pulse">Fetching lyrics...</span>
                    </div>
                ) : (
                    <div className="flex h-full items-center justify-center text-zinc-400">
                        No lyrics available
                    </div>
                )}
            </div>
        </div >
    );
}
