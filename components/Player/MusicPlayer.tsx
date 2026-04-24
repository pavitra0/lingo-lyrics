"use client";

import React, { useEffect } from "react";
import { usePlayer } from "@/lib/contexts/PlayerContext";
import { Play, Pause, SkipBack, SkipForward, Volume2, GripHorizontal, ChevronDown, Shuffle, Repeat, Maximize2, Heart, Captions, X, ChevronUp, Mic2, AudioLines, ScanEye, Cast, Download, ListMusic, SquarePen } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "@/i18n/routing";
import { QueueList } from "./QueueList";
import { useState } from "react";
import { getSyncedLyrics, LrcLibSong } from "@/lib/api/lyrics";
import { getSongById } from "@/lib/api/jiosaavn";
import { LyricsContainer } from "@/components/Lyrics/LyricsContainer";
import { MusicImage } from "@/components/Shared/MusicImage";
import { applyCoverThemePalette, clearCoverThemePalette, extractCoverThemePalette, isUnavailableMusicImage } from "@/lib/musicArt";

function MovingTitle({ title, className, threshold = 28 }: { title: string; className?: string; threshold?: number }) {
    if (title.length <= threshold) {
        return (
            <span className={cn("block min-w-0 max-w-full truncate", className)} title={title}>
                {title}
            </span>
        );
    }

    return (
        <span className={cn("block min-w-0 max-w-full overflow-hidden whitespace-nowrap", className)} title={title} aria-label={title}>
            <span className="block truncate lg:hidden">
                {title}
            </span>
            <span className="music-title-marquee hidden lg:inline-flex">
                <span>{title}</span>
                <span aria-hidden="true">{title}</span>
            </span>
        </span>
    );
}

export function MusicPlayer() {
    const router = useRouter();
    const {
        currentSong, isPlaying, togglePlay, progress, duration, seek, volume, setVolume,
        playNext, playPrevious, shuffle, toggleShuffle, repeat, toggleRepeat, queue
    } = usePlayer();

    const [showQueue, setShowQueue] = useState(false);
    const [isMaximized, setIsMaximized] = useState(false);
    const [likedSongs, setLikedSongs] = useState<string[]>([]); // Keep IDs for UI state
    const [lyricsData, setLyricsData] = useState<LrcLibSong | null>(null);
    const [showLyrics, setShowLyrics] = useState(false);
    const [showMovingBg, setShowMovingBg] = useState(false);
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
            setLyricsLoading(true);

            console.log("MusicPlayer: Fetching lyrics for:", currentSong);

            let artistName = currentSong.artist;

            if (!artistName) {
                const rawSong = currentSong as { artists?: { primary?: Array<{ name?: string }> } };
                if (rawSong.artists?.primary?.[0]?.name) artistName = rawSong.artists.primary[0].name;
            }

            artistName = String(artistName || "");

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
    }, [currentSong]);

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
    const artistLinks = currentSong.artistLinks?.length
        ? currentSong.artistLinks
        : currentSong.artist
            .split(",")
            .map((artist, index) => ({ name: artist.trim(), id: index === 0 ? currentSong.artistId : undefined }))
            .filter((artist) => artist.name.length > 0);
    const visibleArtists = showAllArtists ? artistLinks : artistLinks.slice(0, 2);
    const artistLabel = formatArtistLabel(artistLinks.map((artist) => artist.name).join(", "));
    const activeArtistId = artistLinks.find((artist) => artist.id)?.id || currentSong.artistId;
    const hasRealCover = !!currentSong.image && !isUnavailableMusicImage(currentSong.image);
    const handleArtistClick = async (artistId: string | undefined, artistName: string | undefined, event?: React.MouseEvent) => {
        event?.stopPropagation();
        let targetArtistId = artistId;

        if (!targetArtistId && artistName) {
            try {
                // Try searching for the artist in primary artists first
                const songData = await getSongById(currentSong.id);
                const normalizedSearch = artistName.trim().toLowerCase();
                
                const found = songData.artists?.primary?.find((artist) => (
                    artist.name?.trim().toLowerCase() === normalizedSearch
                )) || songData.artists?.featured?.find((artist) => (
                    artist.name?.trim().toLowerCase() === normalizedSearch
                ));

                targetArtistId = found?.id;
            } catch (error) {
                console.error("Failed to resolve artist link", error);
            }
        }

        if (!targetArtistId) {
            console.warn("Artist ID not found for navigation:", artistName);
            return;
        }

        setIsMaximized(false);
        setShowLyrics(false);
        router.push(`/artist/${targetArtistId}`);
    };
    const handleSeek = (event: React.MouseEvent<HTMLDivElement>) => {
        if (!duration) return;
        const rect = event.currentTarget.getBoundingClientRect();
        const pos = (event.clientX - rect.left) / rect.width;
        seek(pos * duration);
    };
    const utilityButtonClass = cn(
        "flex items-center justify-center rounded-2xl border border-white/15 bg-white/[0.06] text-zinc-200 backdrop-blur-xl transition hover:bg-white/[0.12] hover:text-white",
        showLyrics ? "h-10 w-10 md:h-12 md:w-12" : "h-12 w-12 md:h-14 md:w-14"
    );
    const utilityButtonActiveClass = "bg-white text-black hover:bg-white";
    const pressableButtonClass = "transform-gpu transition duration-150 ease-out active:scale-95";
    const pressableSoftClass = "transform-gpu transition duration-150 ease-out active:scale-[0.98]";

    return (
        <>
            {/* Maximized Player Overlay */}
            <div className={cn(
                "fixed inset-0 z-[60] flex h-dvh w-screen max-w-full flex-col overflow-hidden bg-black transition-all duration-300 ease-in-out",
                isMaximized ? "visible opacity-100" : "invisible opacity-0 pointer-events-none translate-y-12"
            )}>
                {hasRealCover && (
                    <div className="absolute inset-0 pointer-events-none overflow-hidden bg-black">
                        {/* Static background that is always there but fades when swirling is active */}
                        <div className={cn("absolute inset-[-15%] transition-all duration-1000", showMovingBg ? "opacity-20 scale-110 blur-[120px]" : "opacity-40 scale-100 blur-[100px]")}>
                            <MusicImage
                                src={currentSong.image}
                                alt={currentSong.title}
                                fill
                                className="object-cover saturate-150"
                                sizes="100vw"
                            />
                        </div>

                        {/* Swirling Blob 1 */}
                        {showMovingBg && (
                            <>
                                <div 
                                    className="absolute top-[-30%] left-[-10%] w-[100%] h-[120%] origin-center rounded-[40%_60%_70%_30%_/_40%_50%_60%_50%] opacity-70 mix-blend-screen animate-in fade-in duration-1000"
                                    style={{ animation: 'swirl 25s linear infinite' }}
                                >
                                    <MusicImage src={currentSong.image} alt={currentSong.title} fill className="object-cover blur-[100px] saturate-200" sizes="100vw" />
                                </div>
                                {/* Swirling Blob 2 */}
                                <div 
                                    className="absolute bottom-[-30%] right-[-10%] w-[100%] h-[120%] origin-center rounded-[60%_40%_30%_70%_/_60%_50%_40%_50%] opacity-70 mix-blend-screen animate-in fade-in duration-1000"
                                    style={{ animation: 'swirl-reverse 30s linear infinite' }}
                                >
                                    <MusicImage src={currentSong.image} alt={currentSong.title} fill className="object-cover blur-[100px] saturate-200" sizes="100vw" />
                                </div>
                            </>
                        )}
                        <div className="absolute inset-0 bg-black/30 pointer-events-none transition-colors duration-1000" />
                    </div>
                )}

                {/* Desktop View (lg+) */}
                <div className="relative z-10 hidden h-full w-full flex-row overflow-hidden lg:flex">
                    {/* Top Left Controls */}
                    <div className="absolute left-6 top-6 z-20 flex items-center gap-4">
                        <button
                            onClick={() => setIsMaximized(false)}
                            className={cn("flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20", pressableButtonClass)}
                        >
                            <X size={20} />
                        </button>
                        <button 
                            onClick={() => setShowLyrics(!showLyrics)}
                            className={cn("flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-white/20", pressableButtonClass, showLyrics ? "bg-white/20 text-white" : "bg-white/10 text-white/80")}
                        >
                            <Mic2 size={20} />
                        </button>
                        <button 
                            onClick={() => setShowMovingBg(!showMovingBg)}
                            className={cn("flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-white/20", pressableButtonClass, showMovingBg ? "bg-white/20 text-white" : "bg-white/10 text-white/80")}
                        >
                            <AudioLines size={20} />
                        </button>
                        <button className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/80 transition hover:bg-white/20">
                            <ScanEye size={20} />
                        </button>
                    </div>

                    {/* Left Column: Art & Controls */}
                    <div className={cn("flex flex-col justify-center px-12 h-full transition-all duration-500", showLyrics ? "w-[45%] lg:px-20" : "w-full items-center")}>
                        <div className={cn("mx-auto w-full transition-all duration-500", showLyrics ? "max-w-[420px]" : "max-w-[540px]")}>
                            {/* Album Art */}
                            <div className="relative aspect-square w-full shadow-[0_20px_80px_rgba(0,0,0,0.5)] transition-transform duration-500 hover:scale-[1.02]">
                                <MusicImage
                                    src={currentSong.image}
                                    alt={currentSong.title}
                                    fill
                                    className="rounded-xl object-cover"
                                    sizes="420px"
                                />
                            </div>

                            {/* Song Info */}
                            <div className="mt-10 flex items-center justify-between">
                                <div className="flex flex-col gap-1 min-w-0 flex-1 pr-4">
                                    <div className="flex items-center gap-3">
                                        <h1 className="text-2xl font-bold text-white truncate">{currentSong.title}</h1>
                                        <span className="flex-shrink-0 flex items-center rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-zinc-400">HD</span>
                                    </div>
                                    <button
                                        onClick={(e) => handleArtistClick(activeArtistId, artistLabel, e)}
                                        className="text-left text-lg text-zinc-400 hover:text-white truncate"
                                    >
                                        {artistLabel}
                                    </button>
                                </div>
                                <button onClick={toggleLike} className={cn("hover:scale-105 transition-transform", likedSongs.includes(currentSong.id) ? "text-red-500" : "text-white/70 hover:text-white")}>
                                    <Heart size={24} fill={likedSongs.includes(currentSong.id) ? "currentColor" : "none"} />
                                </button>
                            </div>

                            {/* Progress Bar */}
                            <div className="mt-8 flex flex-col gap-2">
                                <div
                                    className="group relative h-1.5 w-full cursor-pointer rounded-full bg-white/10"
                                    onClick={handleSeek}
                                >
                                    <div
                                        className="relative h-full rounded-full bg-white"
                                        style={{ width: `${clampedProgressPercent}%` }}
                                    >
                                        <div className="absolute right-0 top-1/2 hidden h-3 w-3 -translate-y-1/2 translate-x-1/2 rounded-full bg-white shadow-xl group-hover:block" />
                                    </div>
                                </div>
                                <div className="flex justify-between text-xs font-medium text-zinc-500">
                                    <span>{formatTime(progress)}</span>
                                    <span>{formatTime(duration)}</span>
                                </div>
                            </div>

                            {/* Playback Controls */}
                            <div className="mt-6 flex items-center justify-between px-2">
                                <button onClick={toggleShuffle} className={cn("text-zinc-500 hover:text-white", shuffle && "text-white")}>
                                    <Shuffle size={20} />
                                </button>
                                <div className="flex items-center gap-8">
                                    <button onClick={playPrevious} className="text-white hover:text-zinc-300">
                                        <SkipBack size={32} fill="currentColor" />
                                    </button>
                                    <button
                                        onClick={togglePlay}
                                        className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-black transition-transform hover:scale-105 active:scale-95"
                                    >
                                        {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
                                    </button>
                                    <button onClick={playNext} className="text-white hover:text-zinc-300">
                                        <SkipForward size={32} fill="currentColor" />
                                    </button>
                                </div>
                                <button onClick={toggleRepeat} className={cn("text-zinc-500 hover:text-white", repeat !== "none" && "text-white")}>
                                    <Repeat size={20} />
                                </button>
                            </div>

                            {/* Volume Slider */}
                            <div className="mt-8 flex items-center gap-3 px-4">
                                <Volume2 size={16} className="text-zinc-500" />
                                <input
                                    type="range"
                                    min={0}
                                    max={1}
                                    step={0.01}
                                    value={volume}
                                    onChange={(e) => setVolume(Number(e.target.value))}
                                    className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-white/10 accent-white [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Lyrics */}
                    {showLyrics && (
                        <div className="flex flex-1 min-w-0 flex-col overflow-hidden px-8 lg:px-16 pt-28 pb-12 animate-in fade-in slide-in-from-right-8 duration-500">
                            <div className="h-full w-full min-w-0">
                                <LyricsContainer
                                    key={currentSong.id}
                                    syncedLyrics={lyricsData?.syncedLyrics || ""}
                                    plainLyrics={lyricsData?.plainLyrics}
                                    artist={currentSong.artist}
                                    title={currentSong.title}
                                    songId={currentSong.id}
                                    language={currentSong.language}
                                    isLoading={lyricsLoading}
                                    className="h-full max-h-full max-w-none text-left items-start"
                                    variant="player"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Mobile View (sm to lg) */}
                <div className="relative z-10 flex h-full w-full flex-col lg:hidden">
                    {/* Grab Handle */}
                    <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-white/20" />

                    {/* Header Controls */}
                    <div className="flex items-center justify-end gap-3 px-6 pt-2">
                        <button 
                            onClick={() => setShowMovingBg(!showMovingBg)}
                            className={cn("flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-white/20", showMovingBg ? "bg-white/20 text-white" : "bg-white/10 text-white/80")}
                        >
                            <AudioLines size={20} />
                        </button>
                        <button 
                            onClick={() => setShowLyrics(!showLyrics)}
                            className={cn("flex h-10 w-10 items-center justify-center rounded-full text-white transition hover:bg-white/20", showLyrics ? "bg-white/20" : "bg-white/10")}
                        >
                            <Mic2 size={20} />
                        </button>
                    </div>

                    {showLyrics ? (
                        <>
                            {/* Song Info Small */}
                            <div className="flex items-center gap-4 px-6 pt-4 animate-in fade-in duration-300">
                                <div className="relative h-14 w-14 flex-shrink-0 shadow-lg">
                                    <MusicImage
                                        src={currentSong.image}
                                        alt={currentSong.title}
                                        fill
                                        className="rounded-lg object-cover"
                                        sizes="56px"
                                    />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <h1 className="text-xl font-bold text-white truncate">{currentSong.title}</h1>
                                        <span className="flex items-center rounded bg-white/10 px-1 py-0.5 text-[8px] font-bold tracking-wider text-zinc-400">HD</span>
                                    </div>
                                    <p className="text-sm text-zinc-400 truncate">{artistLabel}</p>
                                </div>
                            </div>

                            {/* Lyrics Center */}
                            <div className="flex-1 overflow-hidden px-6 pt-6 animate-in slide-in-from-bottom-8 fade-in duration-500">
                                <LyricsContainer
                                    key={currentSong.id}
                                    syncedLyrics={lyricsData?.syncedLyrics || ""}
                                    plainLyrics={lyricsData?.plainLyrics}
                                    artist={currentSong.artist}
                                    title={currentSong.title}
                                    songId={currentSong.id}
                                    language={currentSong.language}
                                    isLoading={lyricsLoading}
                                    variant="player"
                                    className="text-left items-start"
                                />
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-1 flex-col items-center justify-center px-8 pb-4 animate-in zoom-in-95 fade-in duration-500">
                            <div className="w-full max-w-[320px] aspect-square shadow-[0_20px_80px_rgba(0,0,0,0.5)] relative mb-12">
                                <MusicImage 
                                    src={currentSong.image} 
                                    alt={currentSong.title} 
                                    fill 
                                    className="rounded-2xl object-cover" 
                                    sizes="320px" 
                                />
                            </div>
                            <div className="w-full max-w-[320px] flex items-center justify-between">
                                <div className="flex flex-col min-w-0 pr-4">
                                    <h1 className="text-2xl font-bold text-white truncate">{currentSong.title}</h1>
                                    <span className="text-left text-lg text-zinc-400 truncate">{artistLabel}</span>
                                </div>
                                <button onClick={toggleLike} className={cn("hover:scale-105 transition-transform", likedSongs.includes(currentSong.id) ? "text-red-500" : "text-white/70")}>
                                    <Heart size={28} fill={likedSongs.includes(currentSong.id) ? "currentColor" : "none"} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Bottom Controls */}
                    <div className="flex flex-col gap-6 px-6 pt-6 pb-12 bg-gradient-to-t from-black/60 to-transparent">
                        <div className="flex flex-col gap-2">
                            <div
                                className="relative h-1.5 w-full cursor-pointer rounded-full bg-white/10"
                                onClick={handleSeek}
                            >
                                <div
                                    className="relative h-full rounded-full bg-white/80"
                                    style={{ width: `${clampedProgressPercent}%` }}
                                >
                                    <div className="absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 translate-x-1/2 rounded-full bg-white shadow-xl" />
                                </div>
                            </div>
                            <div className="flex justify-between text-[10px] font-semibold text-zinc-500">
                                <span>{formatTime(progress)}</span>
                                <span>{formatTime(duration)}</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <button onClick={toggleShuffle} className={cn("text-zinc-500", shuffle && "text-white")}>
                                <Shuffle size={20} />
                            </button>
                            <button onClick={playPrevious} className="text-white">
                                <SkipBack size={32} fill="currentColor" />
                            </button>
                            <button
                                onClick={togglePlay}
                                className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-black"
                            >
                                {isPlaying ? <Pause size={36} fill="currentColor" /> : <Play size={36} fill="currentColor" className="ml-1" />}
                            </button>
                            <button onClick={playNext} className="text-white">
                                <SkipForward size={32} fill="currentColor" />
                            </button>
                            <button onClick={toggleRepeat} className={cn("text-zinc-500", repeat !== "none" && "text-white")}>
                                <Repeat size={20} />
                            </button>
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
                                <MovingTitle title={currentSong.title} className="text-sm font-semibold leading-tight text-foreground md:text-base" threshold={30} />
                                <div className="truncate text-xs text-zinc-400 md:text-sm">
                                    <button
                                        type="button"
                                        className="truncate text-left hover:text-foreground hover:underline disabled:no-underline"
                                        onClick={(event) => handleArtistClick(activeArtistId, artistLabel, event)}
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
