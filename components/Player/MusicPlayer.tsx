"use client";

import React, { useEffect } from "react";
import { usePlayer } from "@/lib/contexts/PlayerContext";
import { Play, Pause, SkipBack, SkipForward, Volume2, GripHorizontal, ChevronDown, Shuffle, Repeat, Maximize2, Heart, Captions, X, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "@/i18n/routing";
import { QueueList } from "./QueueList";
import { useState } from "react";
import { getSyncedLyrics, LrcLibSong } from "@/lib/api/lyrics";
import { LyricsContainer } from "@/components/Lyrics/LyricsContainer";
import { MusicImage } from "@/components/Shared/MusicImage";
import { applyCoverThemePalette, clearCoverThemePalette, extractCoverThemePalette, isUnavailableMusicImage } from "@/lib/musicArt";


export function MusicPlayer() {
    const router = useRouter();
    const {
        currentSong, isPlaying, togglePlay, progress, duration, seek, volume, setVolume,
        playNext, playPrevious, shuffle, toggleShuffle, repeat, toggleRepeat
    } = usePlayer();

    const [showQueue, setShowQueue] = useState(false);
    const [isMaximized, setIsMaximized] = useState(false);
    const [likedSongs, setLikedSongs] = useState<string[]>([]); // Keep IDs for UI state
    const [lyricsData, setLyricsData] = useState<LrcLibSong | null>(null);
    const [showLyrics, setShowLyrics] = useState(false);
    const [lyricsLoading, setLyricsLoading] = useState(false);
    const [showAllArtists, setShowAllArtists] = useState(false);

    useEffect(() => {
        // Load initial state
        const savedDB = localStorage.getItem("likedSongs_db");
        if (savedDB) {
            try {
                const songs = JSON.parse(savedDB) as Array<{ id: string }>;
                setLikedSongs(songs.map((song) => song.id));
            } catch (e) { console.error(e); }
        }
    }, []);

    useEffect(() => {
        if (!currentSong) return;

        // Reset lyrics when song changes
        setLyricsData(null);
        setShowAllArtists(false);

        const fetchLyrics = async () => {
            // Only fetch if lyrics view is active
            if (!showLyrics) return;

            setLyricsLoading(true);

            console.log("MusicPlayer: Fetching lyrics for:", currentSong);

            // Artist name is now normalized in PlayerContext, so we can trust currentSong.artist
            let artistName = currentSong.artist;

            // Safety fallback just in case (e.g. if currentSong structure was bypassed)
            if (!artistName) {
                const rawSong = currentSong as { artists?: { primary?: Array<{ name?: string }> } };
                if (rawSong.artists?.primary?.[0]?.name) artistName = rawSong.artists.primary[0].name;
            }

            artistName = String(artistName || "");

            // Cleanup: Take first artist if comma separated or has '&'
            if (artistName) {
                artistName = artistName.split(',')[0].split('&')[0].trim();
            }

            if (!artistName || !currentSong.title) {
                console.warn("MusicPlayer: Missing artist or title for lyrics fetch. Details:", {
                    title: currentSong.title,
                    extractedArtist: artistName,
                    fullSongObject: currentSong
                });
                return;
            }

            try {
                const data = await getSyncedLyrics(
                    currentSong.title,
                    artistName,
                    currentSong.album,
                    currentSong.duration
                );
                setLyricsData(data);
            } catch (error) {
                console.error("Failed to fetch lyrics", error);
            } finally {
                setLyricsLoading(false);
            }
        };

        fetchLyrics();
    }, [currentSong, showLyrics]);

    useEffect(() => {
        if (!currentSong?.image || isUnavailableMusicImage(currentSong.image)) {
            clearCoverThemePalette();
            return;
        }

        let cancelled = false;

        const syncCoverPalette = async () => {
            try {
                const palette = await extractCoverThemePalette(currentSong.image);
                if (!cancelled) {
                    applyCoverThemePalette(palette);
                }
            } catch (error) {
                console.warn("MusicPlayer: Failed to derive cover theme palette.", error);
                if (!cancelled) {
                    clearCoverThemePalette();
                }
            }
        };

        void syncCoverPalette();

        return () => {
            cancelled = true;
        };
    }, [currentSong?.image]);

    useEffect(() => () => clearCoverThemePalette(), []);

    const toggleLike = () => {
        if (!currentSong) return;

        const savedDB = localStorage.getItem("likedSongs_db");
        let db: typeof currentSong[] = savedDB ? JSON.parse(savedDB) as typeof currentSong[] : [];
        let newLikedIds;

        if (likedSongs.includes(currentSong.id)) {
            // Remove
            newLikedIds = likedSongs.filter(id => id !== currentSong.id);
            db = db.filter((song) => song.id !== currentSong.id);
        } else {
            // Add
            newLikedIds = [...likedSongs, currentSong.id];
            // Ensure we save the full object with necessary fields
            db.push(currentSong);
        }

        setLikedSongs(newLikedIds);
        localStorage.setItem("likedSongs_db", JSON.stringify(db));
    };

    if (!currentSong) return null;

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    const formatArtistLabel = (artistValue: string) => {
        const artists = artistValue
            .split(",")
            .map((artist) => artist.trim())
            .filter(Boolean);

        if (artists.length <= 2) {
            return artists.join(", ");
        }

        return `${artists.slice(0, 2).join(", ")} +${artists.length - 2}`;
    };

    const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;
    const clampedProgressPercent = Math.max(0, Math.min(progressPercent, 100));
    const artistList = currentSong.artist
        .split(",")
        .map((artist) => artist.trim())
        .filter(Boolean);
    const artistLabel = formatArtistLabel(currentSong.artist);
    const activeArtistId = currentSong.artistId;
    const hasRealCover = !!currentSong.image && !isUnavailableMusicImage(currentSong.image);
    const handleArtistClick = (event?: React.MouseEvent) => {
        event?.stopPropagation();
        if (!activeArtistId) return;
        setIsMaximized(false);
        setShowLyrics(false);
        router.push(`/artist/${activeArtistId}`);
    };
    const handleSeek = (event: React.MouseEvent<HTMLDivElement>) => {
        if (!duration) return;
        const rect = event.currentTarget.getBoundingClientRect();
        const pos = (event.clientX - rect.left) / rect.width;
        seek(pos * duration);
    };
    const utilityButtonClass = "flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-white/[0.06] text-zinc-200 backdrop-blur-xl transition hover:bg-white/[0.12] hover:text-white md:h-14 md:w-14";
    const utilityButtonActiveClass = "bg-white text-black hover:bg-white";
    const pressableButtonClass = "transform-gpu transition duration-150 ease-out active:scale-95";
    const pressableSoftClass = "transform-gpu transition duration-150 ease-out active:scale-[0.97]";

    return (
        <>
            {/* Maximized Player Overlay */}
            <div className={cn(
                "fixed inset-0 z-[60] flex flex-col overflow-hidden bg-black transition-all duration-500 ease-in-out transform",
                isMaximized ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"
            )}>
                {hasRealCover && (
                    <>
                        <div className="absolute inset-[-12%] pointer-events-none">
                            <MusicImage
                                src={currentSong.image}
                                alt={currentSong.title}
                                fill
                                className="object-cover scale-110 blur-3xl saturate-125 opacity-45"
                                sizes="100vw"
                            />
                        </div>
                        <div className="absolute inset-0 bg-black/40 pointer-events-none" />
                    </>
                )}
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_38%)]" />

                {/* Header */}
                <div className="z-10 flex items-center justify-between px-5 pb-1 pt-5 md:px-8 md:pb-2 md:pt-7">
                    <button
                        onClick={() => setIsMaximized(false)}
                        className={cn("flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-foreground backdrop-blur-xl transition hover:bg-white/[0.12]", pressableButtonClass)}
                    >
                        <ChevronDown size={24} />
                    </button>
                    <div className="flex flex-col items-center text-center">
                        <span className="mb-1 text-[10px] font-semibold uppercase tracking-[0.32em] text-zinc-400 md:text-[11px]">Now Playing</span>
                        <span className="max-w-[16rem] truncate text-sm font-semibold text-zinc-200 md:max-w-[24rem] md:text-base">{currentSong.title}</span>
                    </div>
                    <div className="h-11 w-11" />
                </div>

                <div className="z-10 mx-auto flex h-full w-full max-w-7xl flex-1 flex-col overflow-hidden px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 md:px-8 md:pb-10">
                    <div className="mx-auto grid h-full w-full max-w-[25rem] grid-rows-[auto_1fr] gap-5 md:max-w-[30rem] lg:max-w-7xl lg:grid-cols-[minmax(20rem,30rem)_minmax(26rem,1fr)] lg:grid-rows-1 lg:items-center lg:gap-10">
                        <div className="mx-auto w-full lg:mx-0">
                            <div className="relative aspect-square overflow-hidden rounded-[2rem] border border-white/10 bg-black/30 shadow-[0_24px_100px_rgba(0,0,0,0.42)]">
                                {showLyrics ? (
                                    <div className="h-full bg-black/10 px-3 py-4 backdrop-blur-2xl">
                                        <LyricsContainer
                                            key={currentSong.id}
                                            syncedLyrics={lyricsData?.syncedLyrics || ""}
                                            plainLyrics={lyricsData?.plainLyrics}
                                            artist={currentSong.artist}
                                            title={currentSong.title}
                                            songId={currentSong.id}
                                            language={currentSong.language}
                                            isLoading={lyricsLoading}
                                            className="max-h-full max-w-none"
                                            variant="player"
                                        />
                                    </div>
                                ) : (
                                    <>
                                        {hasRealCover && (
                                            <MusicImage
                                                src={currentSong.image}
                                                alt={currentSong.title}
                                                fill
                                                className="object-cover scale-105 opacity-20 blur-3xl"
                                                sizes="(max-width: 1024px) 92vw, 29rem"
                                            />
                                        )}
                                        <MusicImage
                                            src={currentSong.image}
                                            alt={currentSong.title}
                                            fill
                                            className="object-cover"
                                            sizes="(max-width: 1024px) 92vw, 29rem"
                                            fallbackIconSize={42}
                                        />
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="flex min-h-0 flex-1 flex-col gap-5 rounded-[2rem] border border-white/10 bg-black/20 p-5 backdrop-blur-2xl shadow-[0_24px_80px_rgba(0,0,0,0.28)] md:gap-6 md:p-7 lg:h-[min(40rem,100%)] lg:justify-between">
                            <div className="min-w-0">
                                <h2 className="mb-3 text-[2.35rem] font-bold leading-[0.98] text-zinc-100 md:text-[3.4rem]">{currentSong.title}</h2>
                                <div className="space-y-3 text-base text-zinc-300 md:text-lg">
                                    <div className="flex flex-wrap items-start gap-3">
                                        <div className="min-w-0 flex-1">
                                            <button
                                                type="button"
                                                onClick={handleArtistClick}
                                                disabled={!activeArtistId}
                                                className={cn(
                                                    "inline-flex max-w-full items-center rounded-full border border-white/12 bg-white/[0.08] px-4 py-2 text-left text-sm font-semibold text-zinc-100 transition hover:bg-white/[0.14] hover:text-white disabled:cursor-default disabled:opacity-80 md:text-base",
                                                    pressableSoftClass,
                                                    showAllArtists ? "whitespace-normal" : "truncate"
                                                )}
                                                title={currentSong.artist}
                                            >
                                                <span className={cn("max-w-full", showAllArtists ? "whitespace-normal" : "truncate")}>
                                                    {showAllArtists ? currentSong.artist : artistLabel}
                                                </span>
                                            </button>
                                        </div>
                                        {artistList.length > 2 && (
                                            <button onClick={() => setShowAllArtists((value) => !value)} className={cn("inline-flex flex-shrink-0 items-center gap-1 rounded-full border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-semibold text-zinc-200 transition hover:bg-white/[0.12]", pressableSoftClass)}>
                                                {showAllArtists ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                                {showAllArtists ? "Less" : "More"}
                                            </button>
                                        )}
                                    </div>
                                    {showAllArtists && artistList.length > 2 && (
                                        <div className="flex flex-wrap gap-2">
                                            {artistList.map((artistName, index) => (
                                                <span key={`${artistName}-${index}`} className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-sm text-zinc-200">
                                                    {artistName}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="group/prog flex flex-col gap-3">
                                <div
                                    className="relative cursor-pointer py-2"
                                    onClick={handleSeek}
                                >
                                    <div className="h-2.5 rounded-full bg-white/12">
                                        <div
                                            className="relative h-full rounded-full bg-white"
                                            style={{ width: `${clampedProgressPercent}%` }}
                                        >
                                            <div className="absolute right-0 top-1/2 h-3.5 w-3.5 -translate-y-1/2 translate-x-1/2 rounded-full bg-white shadow-[0_0_0_4px_rgba(255,255,255,0.14)]" />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-between text-xs font-medium text-zinc-500 md:text-sm">
                                    <span>{formatTime(progress)}</span>
                                    <span>{formatTime(duration)}</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between gap-4 md:gap-6">
                                <button onClick={playPrevious} className={cn("flex h-[4.4rem] w-[4.4rem] items-center justify-center rounded-full border border-white/10 bg-white/[0.08] text-zinc-100 backdrop-blur-xl transition hover:bg-white/[0.14] md:h-[5.25rem] md:w-[5.25rem]", pressableButtonClass)}>
                                    <SkipBack size={30} fill="currentColor" />
                                </button>
                                <button onClick={togglePlay} className={cn("flex min-w-0 flex-1 items-center justify-center gap-3 rounded-full bg-white px-6 py-5 text-black shadow-[0_16px_50px_rgba(255,255,255,0.16)] transition hover:scale-[1.01] md:min-w-[15rem] md:px-9 md:py-6", pressableSoftClass)}>
                                    {isPlaying ? <Pause size={30} fill="currentColor" /> : <Play size={30} fill="currentColor" className="ml-1" />}
                                    <span className="text-lg font-semibold md:text-2xl">{isPlaying ? "Pause" : "Play"}</span>
                                </button>
                                <button onClick={playNext} className={cn("flex h-[4.4rem] w-[4.4rem] items-center justify-center rounded-full border border-white/10 bg-white/[0.08] text-zinc-100 backdrop-blur-xl transition hover:bg-white/[0.14] md:h-[5.25rem] md:w-[5.25rem]", pressableButtonClass)}>
                                    <SkipForward size={30} fill="currentColor" />
                                </button>
                            </div>

                            <div className="mt-auto flex justify-center pt-2 pb-[calc(0.2rem+env(safe-area-inset-bottom))] lg:pb-0">
                                <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4">
                                    <button
                                        onClick={() => setShowLyrics((value) => !value)}
                                        className={cn(
                                            utilityButtonClass,
                                            pressableButtonClass,
                                            showLyrics && utilityButtonActiveClass
                                        )}
                                        title={showLyrics ? "Close Lyrics" : "Show Lyrics"}
                                    >
                                        {showLyrics ? <X size={20} /> : <Captions size={20} />}
                                    </button>
                                    <button
                                        onClick={toggleLike}
                                        className={cn(
                                            utilityButtonClass,
                                            pressableButtonClass,
                                            likedSongs.includes(currentSong.id) && "bg-white text-red-500 hover:bg-white"
                                        )}
                                        title={likedSongs.includes(currentSong.id) ? "Unlike Song" : "Like Song"}
                                    >
                                        <Heart size={20} fill={likedSongs.includes(currentSong.id) ? "currentColor" : "none"} />
                                    </button>
                                    <button onClick={toggleShuffle} className={cn(utilityButtonClass, pressableButtonClass, shuffle && "bg-white/[0.16] text-white")}>
                                        <Shuffle size={20} />
                                    </button>
                                    <button className={cn(utilityButtonClass, pressableButtonClass, showQueue && "bg-white/[0.16] text-white")} onClick={() => setShowQueue(!showQueue)}>
                                        <GripHorizontal size={20} />
                                    </button>
                                    <button onClick={toggleRepeat} className={cn(utilityButtonClass, pressableButtonClass, repeat !== "none" && "bg-white/[0.16] text-white")}>
                                        <Repeat size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Mini Player */}
            <div className={cn(
                "fixed left-0 right-0 z-50 px-2 transition-transform duration-300 md:px-4",
                isMaximized ? "translate-y-full opacity-0" : "translate-y-0 opacity-100",
                "bottom-[calc(4.5rem+env(safe-area-inset-bottom))] md:bottom-4"
            )}>
                <div className="relative mx-auto max-w-7xl rounded-[1.5rem] border border-white/10 bg-background/88 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
                    <QueueList isOpen={showQueue} onClose={() => setShowQueue(false)} />

                    <div
                        className="absolute left-3 right-3 top-0 z-10 h-1.5 -translate-y-1/2 cursor-pointer rounded-full bg-white/10"
                        onClick={handleSeek}
                    >
                        <div
                            className="relative h-full rounded-full bg-primary transition-all duration-100"
                            style={{ width: `${clampedProgressPercent}%` }}
                        >
                            <div className="absolute right-0 top-1/2 h-3 w-3 -translate-y-1/2 translate-x-1/2 rounded-full bg-primary shadow-[0_0_0_3px_rgba(255,255,255,0.16)]" />
                        </div>
                    </div>

                    <div className="flex h-[78px] items-center justify-between gap-3 px-3 md:h-[86px] md:px-5">
                        <button className={cn("flex min-w-0 flex-1 items-center gap-3 text-left md:gap-4", pressableSoftClass)} onClick={() => setIsMaximized(true)}>
                            <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] md:h-14 md:w-14">
                                <MusicImage
                                    src={currentSong.image}
                                    alt={currentSong.title}
                                    fill
                                    className="object-cover"
                                    sizes="56px"
                                    fallbackIconSize={18}
                                />
                            </div>
                            <div className="min-w-0">
                                <h3 className="truncate text-sm font-semibold leading-tight text-foreground md:text-base">{currentSong.title}</h3>
                                <div className="truncate text-xs text-zinc-400 md:text-sm">
                                    <button
                                        type="button"
                                        className="truncate text-left hover:text-foreground hover:underline disabled:no-underline"
                                        onClick={handleArtistClick}
                                        disabled={!activeArtistId}
                                        title={currentSong.artist}
                                    >
                                        {artistLabel}
                                    </button>
                                </div>
                            </div>
                        </button>

                        <div className="hidden md:flex items-center gap-3">
                            <button onClick={toggleShuffle} className={cn("flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-zinc-400 transition hover:bg-white/[0.1] hover:text-white", pressableButtonClass, shuffle && "bg-white/[0.14] text-white")}>
                                <Shuffle size={18} />
                            </button>
                            <button className={cn("flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-zinc-100 transition hover:bg-white/[0.1]", pressableButtonClass)} onClick={playPrevious}>
                                <SkipBack size={20} fill="currentColor" />
                            </button>
                            <button onClick={togglePlay} className={cn("flex h-12 min-w-[8.5rem] items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-black shadow-[0_10px_30px_rgba(255,255,255,0.12)] transition hover:scale-[1.01]", pressableSoftClass)}>
                                {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
                                <span>{isPlaying ? "Pause" : "Play"}</span>
                            </button>
                            <button className={cn("flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-zinc-100 transition hover:bg-white/[0.1]", pressableButtonClass)} onClick={playNext}>
                                <SkipForward size={20} fill="currentColor" />
                            </button>
                            <button onClick={toggleRepeat} className={cn("flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-zinc-400 transition hover:bg-white/[0.1] hover:text-white", pressableButtonClass, repeat !== "none" && "bg-white/[0.14] text-white")}>
                                <Repeat size={18} />
                            </button>
                        </div>

                        <div className="flex items-center gap-2 md:gap-3">
                            <button className={cn("flex h-11 w-11 items-center justify-center rounded-full bg-white text-black shadow-[0_10px_30px_rgba(255,255,255,0.12)] transition hover:scale-[1.01] md:hidden", pressableSoftClass)} onClick={togglePlay}>
                                {isPlaying ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" className="ml-0.5" />}
                            </button>

                            <button
                                className={cn("hidden md:flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-zinc-400 transition hover:bg-white/[0.1] hover:text-white", pressableButtonClass, showQueue && "bg-white/[0.14] text-white")}
                                title="Up Next"
                                onClick={() => setShowQueue(!showQueue)}
                            >
                                <GripHorizontal size={18} />
                            </button>

                            <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 md:flex">
                                <Volume2 size={18} className="text-zinc-400" />
                                <input
                                    type="range"
                                    min={0}
                                    max={1}
                                    step={0.01}
                                    value={volume}
                                    onChange={(e) => setVolume(Number(e.target.value))}
                                    className="w-24 h-1 bg-zinc-600 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-foreground [&::-webkit-slider-thumb]:rounded-full"
                                />
                            </div>

                            <button onClick={() => setIsMaximized(true)} className={cn("hidden md:flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-zinc-400 transition hover:bg-white/[0.1] hover:text-white", pressableButtonClass)}>
                                <Maximize2 size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
