"use client";

import React, { useEffect } from "react";
import { usePlayer } from "@/lib/contexts/PlayerContext";
import { Play, Pause, SkipBack, SkipForward, Volume2, Mic2, LayoutList, GripHorizontal, CloudCog, ChevronDown, MoreHorizontal, Shuffle, Repeat, Maximize2, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { QueueList } from "./QueueList";
import { useState } from "react";
import { getSyncedLyrics, LrcLibSong } from "@/lib/api/lyrics";
import { LyricsContainer } from "@/components/Lyrics/LyricsContainer";


export function MusicPlayer() {
    const {
        currentSong, isPlaying, togglePlay, progress, duration, seek, volume, setVolume,
        playNext, playPrevious, shuffle, toggleShuffle, repeat, toggleRepeat
    } = usePlayer();

    const [showQueue, setShowQueue] = useState(false);
    const [isMaximized, setIsMaximized] = useState(false);
    const [likedSongs, setLikedSongs] = useState<string[]>([]); // Keep IDs for UI state
    const [lyricsData, setLyricsData] = useState<LrcLibSong | null>(null);
    const [showLyrics, setShowLyrics] = useState(false);

    useEffect(() => {
        // Load initial state
        const savedDB = localStorage.getItem("likedSongs_db");
        if (savedDB) {
            try {
                const songs = JSON.parse(savedDB);
                setLikedSongs(songs.map((s: any) => s.id));
            } catch (e) { console.error(e); }
        }
    }, []);

    useEffect(() => {
        if (!currentSong) return;

        // Reset lyrics when song changes
        setLyricsData(null);

        const fetchLyrics = async () => {
            // Only fetch if lyrics view is active
            if (!showLyrics) return;

            console.log("MusicPlayer: Fetching lyrics for:", currentSong);

            // Artist name is now normalized in PlayerContext, so we can trust currentSong.artist
            let artistName = currentSong.artist;

            // Safety fallback just in case (e.g. if currentSong structure was bypassed)
            if (!artistName) {
                const rawSong = currentSong as any;
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
            }
        };

        fetchLyrics();
    }, [currentSong, showLyrics]);

    const toggleLike = () => {
        if (!currentSong) return;

        const savedDB = localStorage.getItem("likedSongs_db");
        let db = savedDB ? JSON.parse(savedDB) : [];
        let newLikedIds;

        if (likedSongs.includes(currentSong.id)) {
            // Remove
            newLikedIds = likedSongs.filter(id => id !== currentSong.id);
            db = db.filter((s: any) => s.id !== currentSong.id);
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

    const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;

    return (
        <>
            {/* Maximized Player Overlay */}
            <div className={cn(
                "fixed inset-0 bg-black z-[60] flex flex-col transition-all duration-500 ease-in-out transform",
                isMaximized ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"
            )}>
                <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 to-black pointer-events-none" />

                {/* Header */}
                <div className="flex items-center justify-between p-6 z-10">
                    <button onClick={() => setIsMaximized(false)} className="text-white p-2 hover:bg-white/10 rounded-full">
                        <ChevronDown size={32} />
                    </button>
                    <div className="flex flex-col items-center">
                        <span className="text-zinc-400 text-xs tracking-widest uppercase mb-1">Now Playing</span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowLyrics(false)}
                                className={cn("text-xs font-bold px-3 py-1 rounded-full border transition-colors", !showLyrics ? "bg-white text-black border-white" : "text-zinc-400 border-zinc-700 hover:border-zinc-500")}
                            >
                                SONG
                            </button>
                            <button
                                onClick={() => setShowLyrics(true)}
                                className={cn("text-xs font-bold px-3 py-1 rounded-full border transition-colors", showLyrics ? "bg-white text-black border-white" : "text-zinc-400 border-zinc-700 hover:border-zinc-500")}
                            >
                                LYRICS
                            </button>
                        </div>
                    </div>
                    <button className="text-white p-2 hover:bg-white/10 rounded-full">
                        <MoreHorizontal size={24} />
                    </button>
                </div>

                <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-12 p-8 z-10 max-w-7xl mx-auto w-full overflow-hidden">
                    {/* Art / Lyrics Area */}
                    <div className={cn(
                        "relative rounded-xl overflow-hidden flex items-center justify-center transition-all duration-500",
                        showLyrics ? "w-full h-full max-w-5xl aspect-auto" : "w-full aspect-square max-w-md md:max-w-xl shadow-2xl border border-white/5 bg-zinc-900/50"
                    )}>
                        {!showLyrics ? (
                            currentSong.image && <Image src={currentSong.image} alt={currentSong.title} fill className="object-cover" />
                        ) : (
                            <LyricsContainer
                                syncedLyrics={lyricsData?.syncedLyrics || ""}
                                plainLyrics={lyricsData?.plainLyrics}
                                artist={currentSong.artist}
                                title={currentSong.title}
                                songId={currentSong.id}
                            />
                        )}
                    </div>

                    {/* Info & Controls */}
                    {!showLyrics && (
                        <div className="w-full max-w-md flex flex-col gap-8">
                            <div>
                                <h2 className="text-3xl font-bold text-white mb-2 leading-tight">{currentSong.title}</h2>
                                <p className="text-xl text-zinc-400">
                                    {currentSong.artist}
                                </p>
                            </div>

                            {/* Progress */}
                            <div className="flex flex-col gap-2 group/prog">
                                <div
                                    className="h-1 bg-white/20 rounded-full cursor-pointer relative"
                                    onClick={(e) => {
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        const pos = (e.clientX - rect.left) / rect.width;
                                        seek(pos * duration);
                                    }}
                                >
                                    <div className="absolute top-0 left-0 h-full bg-white rounded-full group-hover/prog:bg-purple-500 transition-colors" style={{ width: `${progressPercent}%` }} />
                                    <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg opacity-0 group-hover/prog:opacity-100 transition-opacity" style={{ left: `${progressPercent}%`, marginLeft: '-8px' }} />
                                </div>
                                <div className="flex justify-between text-xs text-zinc-500 font-medium">
                                    <span>{formatTime(progress)}</span>
                                    <span>{formatTime(duration)}</span>
                                </div>
                            </div>

                            {/* Controls */}
                            <div className="flex items-center justify-between">
                                <button onClick={toggleShuffle} className={cn("p-2", shuffle ? "text-purple-500" : "text-zinc-400")}>
                                    <Shuffle size={24} />
                                </button>
                                <div className="flex items-center gap-6">
                                    <button onClick={playPrevious} className="text-white hover:text-purple-400 transition"><SkipBack size={36} fill="currentColor" /></button>
                                    <button onClick={togglePlay} className="w-20 h-20 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 transition shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                                        {isPlaying ? <Pause size={36} fill="currentColor" /> : <Play size={36} fill="currentColor" className="ml-1" />}
                                    </button>
                                    <button onClick={playNext} className="text-white hover:text-purple-400 transition"><SkipForward size={36} fill="currentColor" /></button>
                                </div>
                                <button onClick={toggleRepeat} className={cn("p-2", repeat !== 'none' ? "text-purple-500" : "text-zinc-400")}>
                                    <Repeat size={24} />
                                </button>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-between items-center px-4">
                                <button onClick={toggleLike} className={cn("transition transform active:scale-90", likedSongs.includes(currentSong.id) ? "text-red-500" : "text-zinc-400")}>
                                    <Heart size={28} fill={likedSongs.includes(currentSong.id) ? "currentColor" : "none"} />
                                </button>
                                {/* Volume */}
                                <div className="flex items-center gap-3">
                                    <Volume2 size={20} className="text-zinc-400" />
                                    <input
                                        type="range" min={0} max={1} step={0.01} value={volume}
                                        onChange={(e) => setVolume(Number(e.target.value))}
                                        className="w-24 h-1 bg-zinc-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Mini Player */}
            <div className={`fixed bottom-16 md:bottom-0 left-0 right-0 z-50 bg-[#212121] border-t border-white/5 md:h-[72px] h-[64px] group transition-transform duration-300 ${isMaximized ? 'translate-y-full' : 'translate-y-0'}`}>

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
                        className="absolute top-0 left-0 bottom-0 bg-red-600 group-hover:bg-red-500 transition-all duration-100"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>

                <div className="flex items-center justify-between px-4 h-full max-w-[100vw]">

                    {/* Start: Song Info */}
                    <div className="flex items-center gap-4 w-[30%] min-w-0 pointer-events-auto" onClick={() => setIsMaximized(true)}>
                        <div className="flex items-center gap-4 cursor-pointer group/info">
                            <div className="relative h-10 w-10 md:h-12 md:w-12 rounded bg-zinc-800 flex-shrink-0 overflow-hidden group-hover/info:brightness-75 transition">
                                <Maximize2 size={20} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 group-hover/info:opacity-100 z-10" />
                                {currentSong.image && (
                                    <Image
                                        src={currentSong.image}
                                        alt={currentSong.title}
                                        fill
                                        className="object-cover"
                                    />
                                )}
                            </div>
                            <div className="flex flex-col justify-center min-w-0">
                                <h3 className="font-medium text-white text-sm truncate leading-tight group-hover/info:underline">{currentSong.title}</h3>
                                <div className="flex items-center text-xs md:text-sm text-zinc-400 truncate">
                                    {currentSong.artistId ? (
                                        <Link href={`/artist/${currentSong.artistId}`} className="truncate hover:text-white hover:underline" onClick={(e) => e.stopPropagation()}>
                                            {currentSong.artist}
                                        </Link>
                                    ) : (
                                        <span className="truncate">{currentSong.artist}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Center: Controls (Desktop Only mainly) */}
                    <div className="hidden md:flex items-center gap-6 justify-center flex-1">
                        <button onClick={toggleShuffle} className={cn("text-zinc-400 hover:text-white transition p-2", shuffle && "text-purple-500")}>
                            <Shuffle size={20} />
                        </button>
                        <button className="text-zinc-400 hover:text-white transition p-2" onClick={playPrevious}>
                            <SkipBack size={24} fill="currentColor" />
                        </button>
                        <button onClick={togglePlay} className="h-10 w-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition shadow-lg">
                            {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
                        </button>
                        <button className="text-zinc-400 hover:text-white transition p-2" onClick={playNext}>
                            <SkipForward size={24} fill="currentColor" />
                        </button>
                        <button onClick={toggleRepeat} className={cn("text-zinc-400 hover:text-white transition p-2", repeat !== 'none' && "text-purple-500")}>
                            <Repeat size={20} />
                        </button>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 justify-end w-[30%] min-w-0">
                        <button className="md:hidden p-2 text-white" onClick={togglePlay}>
                            {isPlaying ? <Pause size={24} fill="white" /> : <Play size={24} fill="white" />}
                        </button>

                        <div className="hidden md:flex items-center gap-4">
                            <span className="text-xs text-zinc-400 min-w-[80px] text-center">{formatTime(progress)} / {formatTime(duration)}</span>
                            <div className="flex items-center gap-2 group/vol">
                                <Volume2 size={20} className="text-zinc-400" />
                                <input
                                    type="range"
                                    min={0}
                                    max={1}
                                    step={0.01}
                                    value={volume}
                                    onChange={(e) => setVolume(Number(e.target.value))}
                                    className="w-24 h-1 bg-zinc-600 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                                />
                            </div>
                            <div className="w-[1px] h-6 bg-white/10 mx-2" />
                            <button
                                className={cn("text-zinc-400 hover:text-white transition", showQueue && "text-purple-400")}
                                title="Up Next"
                                onClick={() => setShowQueue(!showQueue)}
                            >
                                <GripHorizontal size={20} />
                            </button>
                            <button onClick={() => setIsMaximized(true)} className="text-zinc-400 hover:text-white">
                                <Maximize2 size={20} />
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </>
    );
}
