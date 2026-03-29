"use client";

import React, { useEffect } from "react";
import { usePlayer } from "@/lib/contexts/PlayerContext";
import { Play, Pause, SkipBack, SkipForward, Volume2, GripHorizontal, ChevronDown, MoreHorizontal, Shuffle, Repeat, Maximize2, Heart, Captions, X, ChevronUp } from "lucide-react";
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

                {/* Header */}
                <div className="z-10 flex items-center justify-between px-6 pb-2 pt-6 md:px-8">
                    <button onClick={() => setIsMaximized(false)} className="rounded-full p-2 text-foreground hover:bg-white/10">
                        <ChevronDown size={28} />
                    </button>
                    <div className="flex flex-col items-center text-center">
                        <span className="mb-1 text-[11px] uppercase tracking-[0.28em] text-zinc-400 md:text-[12px]">Now Playing</span>
                        <span className="max-w-[16rem] truncate text-base font-semibold text-zinc-200 md:max-w-[24rem] md:text-lg">{currentSong.title}</span>
                    </div>
                    <div className="h-11 w-11" />
                </div>

                <div className="z-10 mx-auto flex h-full w-full max-w-6xl flex-1 flex-col overflow-hidden px-5 pb-[calc(0.9rem+env(safe-area-inset-bottom))] pt-3 md:px-8 md:pb-16">
                    <div className="mx-auto grid h-full w-full max-w-[23rem] grid-rows-[auto_1fr] gap-4 md:max-w-[30rem] lg:max-w-6xl lg:grid-cols-[minmax(20rem,29rem)_minmax(24rem,1fr)] lg:grid-rows-1 lg:items-center lg:gap-12">
                        <div className="mx-auto w-full lg:mx-0">
                            <div className="relative aspect-square overflow-hidden rounded-[1.6rem] bg-zinc-950/60 shadow-[0_20px_80px_rgba(0,0,0,0.38)]">
                                {showLyrics ? (
                                    <div className="h-full bg-transparent px-2 py-3 backdrop-blur-xl">
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

                        <div className="flex min-h-0 flex-1 flex-col gap-4 md:gap-6 lg:h-[min(38rem,100%)] lg:justify-between">
                            <div className="min-w-0">
                                <h2 className="mb-2 text-[2rem] font-bold leading-tight text-zinc-100 md:text-5xl">{currentSong.title}</h2>
                                <div className="space-y-2 text-base text-zinc-300 md:text-2xl">
                                    <div className="flex flex-wrap items-start gap-3">
                                        <div className="min-w-0 flex-1">
                                            <button
                                                type="button"
                                                onClick={handleArtistClick}
                                                disabled={!activeArtistId}
                                                className={cn(
                                                    "inline-flex max-w-full items-center rounded-full border border-white/[0.12] bg-white/[0.06] px-4 py-2 text-left text-sm font-semibold text-zinc-100 transition hover:bg-white/[0.12] hover:text-white disabled:cursor-default disabled:opacity-80 md:text-base",
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
                                            <button onClick={() => setShowAllArtists((value) => !value)} className="inline-flex flex-shrink-0 items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-foreground transition hover:bg-white/10">
                                                {showAllArtists ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                                {showAllArtists ? "Less" : "More"}
                                            </button>
                                        )}
                                    </div>
                                    {showAllArtists && artistList.length > 2 && (
                                        <div className="flex flex-wrap gap-2">
                                            {artistList.map((artistName, index) => (
                                                <span key={`${artistName}-${index}`} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-zinc-200">
                                                    {artistName}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="group/prog flex flex-col gap-2">
                                <div
                                    className="flex cursor-pointer items-center gap-3"
                                    onClick={(e) => {
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        const pos = (e.clientX - rect.left) / rect.width;
                                        seek(pos * duration);
                                    }}
                                >
                                    <div className="h-4 w-1.5 flex-shrink-0 rounded-full bg-white" />
                                    <div className="relative h-2.5 flex-1 rounded-full bg-zinc-700/90">
                                        <div
                                            className="absolute inset-y-0 left-0 rounded-full bg-white"
                                            style={{ width: `${clampedProgressPercent}%` }}
                                        />
                                        <div
                                            className="absolute top-1/2 h-2.5 w-2.5 rounded-full bg-white shadow-lg"
                                            style={{ left: `clamp(5px, ${clampedProgressPercent}%, calc(100% - 5px))`, transform: "translate(-50%, -50%)" }}
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-between text-xs font-medium text-zinc-300 md:text-base">
                                    <span>{formatTime(progress)}</span>
                                    <span>{formatTime(duration)}</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between gap-4 md:gap-8">
                                <button onClick={playPrevious} className="flex h-[4.4rem] w-[4.4rem] items-center justify-center rounded-full bg-zinc-800/95 text-zinc-100 transition hover:bg-zinc-700 md:h-24 md:w-24">
                                    <SkipBack size={34} fill="currentColor" />
                                </button>
                                <button onClick={togglePlay} className="flex min-w-0 flex-1 items-center justify-center gap-3 rounded-full bg-white px-5 py-4 text-xl font-semibold text-black shadow-sm transition hover:scale-[1.01] md:px-8 md:py-7 md:text-2xl">
                                    {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
                                    <span className="text-lg md:text-2xl">{isPlaying ? "Pause" : "Play"}</span>
                                </button>
                                <button onClick={playNext} className="flex h-[4.4rem] w-[4.4rem] items-center justify-center rounded-full bg-zinc-800/95 text-zinc-100 transition hover:bg-zinc-700 md:h-24 md:w-24">
                                    <SkipForward size={34} fill="currentColor" />
                                </button>
                            </div>

                            <div className="mt-auto flex items-end justify-between gap-3 pt-6 pb-[calc(0.1rem+env(safe-area-inset-bottom))] lg:pb-0">
                                <div className="flex flex-wrap items-center gap-3 md:gap-4">
                                    <button
                                        onClick={() => setShowLyrics((value) => !value)}
                                        className={cn(
                                            "flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-transparent text-zinc-300 transition hover:bg-white/10 md:h-16 md:w-16",
                                            showLyrics && "bg-white text-black hover:bg-white"
                                        )}
                                        title={showLyrics ? "Close Lyrics" : "Show Lyrics"}
                                    >
                                        {showLyrics ? <X size={20} /> : <Captions size={20} />}
                                    </button>
                                    <button
                                        onClick={toggleLike}
                                        className={cn(
                                            "flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-transparent text-zinc-300 transition hover:bg-white/10 active:scale-95 md:h-16 md:w-16",
                                            likedSongs.includes(currentSong.id) && "bg-white text-red-500 hover:bg-white"
                                        )}
                                        title={likedSongs.includes(currentSong.id) ? "Unlike Song" : "Like Song"}
                                    >
                                        <Heart size={20} fill={likedSongs.includes(currentSong.id) ? "currentColor" : "none"} />
                                    </button>
                                    <button onClick={toggleShuffle} className={cn("flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-transparent text-zinc-300 transition hover:bg-white/10 md:h-16 md:w-16", shuffle && "bg-white/10 text-white")}>
                                        <Shuffle size={20} />
                                    </button>
                                    <button className={cn("flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-transparent text-zinc-300 transition hover:bg-white/10 md:h-16 md:w-16", showQueue && "bg-white/10 text-white")} onClick={() => setShowQueue(!showQueue)}>
                                        <GripHorizontal size={20} />
                                    </button>
                                    <button onClick={toggleRepeat} className={cn("flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-transparent text-zinc-300 transition hover:bg-white/10 md:h-16 md:w-16", repeat !== "none" && "bg-white/10 text-white")}>
                                        <Repeat size={20} />
                                    </button>
                                </div>
                                <button className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-white text-black transition hover:scale-[1.02] md:h-16 md:w-16">
                                    <MoreHorizontal size={22} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Mini Player */}
            <div className={`fixed bottom-16 md:bottom-0 left-0 right-0 z-50 bg-surface border-t border-zinc-200 dark:border-white/5 md:h-[72px] h-[64px] group transition-transform duration-300 ${isMaximized ? 'translate-y-full' : 'translate-y-0'}`}>

                <QueueList isOpen={showQueue} onClose={() => setShowQueue(false)} />

                {/* Progress Bar (Absolute Top) */}
                <div
                    className="absolute top-0 left-0 right-0 h-[2px] bg-transparent group-hover:h-[4px] transition-all cursor-pointer z-10"
                    onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const pos = (e.clientX - rect.left) / rect.width;
                        seek(pos * duration);
                    }}
                >
                    <div className="absolute inset-0 bg-white/10" />
                    <div
                        className="absolute top-0 left-0 bottom-0 bg-primary transition-all duration-100"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>

                <div className="flex items-center justify-between px-4 h-full max-w-[100vw]">

                    {/* Start: Song Info */}
                    <div className="flex items-center gap-4 w-[30%] min-w-0 pointer-events-auto" onClick={() => setIsMaximized(true)}>
                        <div className="flex items-center gap-4 cursor-pointer group/info">
                            <div className="relative h-10 w-10 md:h-12 md:w-12 rounded bg-surface border border-zinc-200 dark:border-white/5 flex-shrink-0 overflow-hidden group-hover/info:brightness-75 transition">
                                <Maximize2 size={20} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 group-hover/info:opacity-100 z-10" />
                                <MusicImage
                                    src={currentSong.image}
                                    alt={currentSong.title}
                                    fill
                                    className="object-cover"
                                    sizes="48px"
                                    fallbackIconSize={16}
                                />
                            </div>
                            <div className="flex flex-col justify-center min-w-0">
                                <h3 className="font-medium text-foreground text-sm truncate leading-tight group-hover/info:underline">{currentSong.title}</h3>
                                <div className="flex items-center text-xs md:text-sm text-zinc-500 dark:text-zinc-400 truncate">
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
                        </div>
                    </div>

                    {/* Center: Controls (Desktop Only mainly) */}
                    <div className="hidden md:flex items-center gap-6 justify-center flex-1">
                        <button onClick={toggleShuffle} className={cn("text-zinc-500 dark:text-zinc-400 hover:text-foreground transition p-2", shuffle && "text-purple-500")}>
                            <Shuffle size={20} />
                        </button>
                        <button className="text-zinc-500 dark:text-zinc-400 hover:text-foreground transition p-2" onClick={playPrevious}>
                            <SkipBack size={24} fill="currentColor" />
                        </button>
                        <button onClick={togglePlay} className="h-10 w-10 rounded-full bg-foreground text-background flex items-center justify-center hover:scale-105 transition shadow-sm">
                            {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
                        </button>
                        <button className="text-zinc-500 dark:text-zinc-400 hover:text-foreground transition p-2" onClick={playNext}>
                            <SkipForward size={24} fill="currentColor" />
                        </button>
                        <button onClick={toggleRepeat} className={cn("text-zinc-500 dark:text-zinc-400 hover:text-foreground transition p-2", repeat !== 'none' && "text-purple-500")}>
                            <Repeat size={20} />
                        </button>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 justify-end w-[30%] min-w-0">
                        <button className="md:hidden p-2 text-foreground" onClick={togglePlay}>
                            {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
                        </button>

                        <div className="hidden md:flex items-center gap-4">
                            <span className="text-xs text-zinc-500 dark:text-zinc-400 min-w-[80px] text-center">{formatTime(progress)} / {formatTime(duration)}</span>
                            <div className="flex items-center gap-2 group/vol">
                                <Volume2 size={20} className="text-zinc-500 dark:text-zinc-400" />
                                <input
                                    type="range"
                                    min={0}
                                    max={1}
                                    step={0.01}
                                    value={volume}
                                    onChange={(e) => setVolume(Number(e.target.value))}
                                    className="w-24 h-1 bg-zinc-300 dark:bg-zinc-600 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-foreground [&::-webkit-slider-thumb]:rounded-full"
                                />
                            </div>
                            <div className="w-[1px] h-6 bg-zinc-200 dark:bg-white/10 mx-2" />
                            <button
                                className={cn("text-zinc-500 dark:text-zinc-400 hover:text-foreground transition", showQueue && "text-purple-500 dark:text-purple-400")}
                                title="Up Next"
                                onClick={() => setShowQueue(!showQueue)}
                            >
                                <GripHorizontal size={20} />
                            </button>
                            <button onClick={() => setIsMaximized(true)} className="text-zinc-500 dark:text-zinc-400 hover:text-foreground">
                                <Maximize2 size={20} />
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </>
    );
}
