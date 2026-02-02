"use client";

import React from "react";
import { usePlayer } from "@/lib/contexts/PlayerContext";
import { Play, Pause, SkipBack, SkipForward, Volume2, Mic2 } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

export function MusicPlayer() {
    const { currentSong, isPlaying, togglePlay, progress, duration, seek, volume, setVolume } = usePlayer();

    if (!currentSong) return null;

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-white/10 px-4 py-3 md:px-6 md:py-4">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">

                {/* Song Info */}
                <div className="flex items-center gap-3 w-1/3 min-w-0">
                    <div className="relative h-12 w-12 md:h-14 md:w-14 rounded-md overflow-hidden bg-zinc-800 flex-shrink-0">
                        {currentSong.image && (
                            <Image
                                src={currentSong.image}
                                alt={currentSong.title}
                                fill
                                className="object-cover"
                            />
                        )}
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="font-medium text-white text-sm md:text-base truncate">{currentSong.title}</h3>
                        <p className="text-xs md:text-sm text-zinc-400 truncate">{currentSong.artist}</p>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex flex-col items-center flex-1 max-w-md">
                    <div className="flex items-center gap-6 mb-1">
                        <button className="text-zinc-400 hover:text-white transition">
                            <SkipBack size={20} />
                        </button>
                        <button
                            onClick={togglePlay}
                            className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition"
                        >
                            {isPlaying ? <Pause size={20} fill="black" /> : <Play size={20} fill="black" className="ml-1" />}
                        </button>
                        <button className="text-zinc-400 hover:text-white transition">
                            <SkipForward size={20} />
                        </button>
                    </div>

                    <div className="w-full flex items-center gap-2 text-xs text-zinc-400">
                        <span>{formatTime(progress)}</span>
                        <input
                            type="range"
                            min={0}
                            max={duration || 100}
                            value={progress}
                            onChange={(e) => seek(Number(e.target.value))}
                            className="flex-1 h-1 bg-zinc-600 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full hover:[&::-webkit-slider-thumb]:scale-125 transition-all"
                        />
                        <span>{formatTime(duration)}</span>
                    </div>
                </div>

                {/* Volume & Extras */}
                <div className="hidden md:flex items-center justify-end gap-2 w-1/3">
                    <button className="p-2 text-zinc-400 hover:text-white">
                        <Mic2 size={18} />
                    </button>
                    <div className="flex items-center gap-2 w-24">
                        <Volume2 size={18} className="text-zinc-400" />
                        <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.01}
                            value={volume}
                            onChange={(e) => setVolume(Number(e.target.value))}
                            className="flex-1 h-1 bg-zinc-600 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                        />
                    </div>
                </div>

            </div>
        </div>
    );
}
