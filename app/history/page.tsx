"use client";

import { useEffect, useState } from "react";
import { History as HistoryIcon, Play, Trash2 } from "lucide-react";
import Image from "next/image";
import { usePlayer, Song } from "@/lib/contexts/PlayerContext";

export default function HistoryPage() {
    const [history, setHistory] = useState<Song[]>([]);
    const { playSong } = usePlayer();

    useEffect(() => {
        const loadHistory = () => {
            const savedDB = localStorage.getItem("playedSongs");
            if (savedDB) {
                try {
                    setHistory(JSON.parse(savedDB));
                } catch (e) { console.error(e); }
            }
        };
        loadHistory();
        window.addEventListener('storage', loadHistory); // Listen if updated elsewhere
        return () => window.removeEventListener('storage', loadHistory);
    }, []);

    const clearHistory = () => {
        localStorage.removeItem("playedSongs");
        setHistory([]);
    };

    return (
        <div className="flex flex-col w-full min-h-screen bg-black text-white p-4 md:p-8 pb-32">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <HistoryIcon className="text-zinc-400" size={32} />
                    <h1 className="text-3xl md:text-4xl font-bold">Recently Played</h1>
                </div>
                {history.length > 0 && (
                    <button onClick={clearHistory} className="flex items-center gap-2 text-red-500 hover:text-red-400 transition text-sm font-medium">
                        <Trash2 size={16} />
                        Clear History
                    </button>
                )}
            </div>

            {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
                    <HistoryIcon size={48} className="mb-4 opacity-20" />
                    <p>No recently played songs.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 w-full">
                    {history.map((song, index) => (
                        <div
                            key={`${song.id}-${index}`}
                            className="group flex flex-col gap-3 cursor-pointer yt-card p-3 rounded-lg -mx-3 hover:bg-zinc-900/50"
                            onClick={() => playSong(song)}
                        >
                            <div className="relative aspect-square rounded-md overflow-hidden bg-zinc-800 shadow-lg">
                                <Image src={song.image} alt={song.title} fill className="object-cover group-hover:scale-105 transition duration-500" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                    <div className="p-3 bg-white rounded-full text-black scale-90 group-hover:scale-100 transition shadow-lg">
                                        <Play size={24} fill="currentColor" />
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <h3 className="font-semibold text-white truncate text-base leading-tight">{song.title}</h3>
                                <div className="flex items-center text-zinc-400 text-sm truncate">
                                    <span className="truncate">{song.artist}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
