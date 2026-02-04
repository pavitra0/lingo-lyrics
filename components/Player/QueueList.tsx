"use client";

import { usePlayer, Song } from "@/lib/contexts/PlayerContext";
import { cn } from "@/lib/utils";
import { X, Play } from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

interface QueueListProps {
    isOpen: boolean;
    onClose: () => void;
}

export function QueueList({ isOpen, onClose }: QueueListProps) {
    const { queue, currentSong, playSong } = usePlayer();

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 50, scale: 0.95 }}
                    className="absolute bottom-20 right-4 w-full max-w-sm bg-[#212121] border border-white/10 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[60vh] z-50 origin-bottom-right"
                >
                    <div className="flex items-center justify-between p-4 border-b border-white/5 bg-[#181818]">
                        <h3 className="font-bold text-white">Up Next</h3>
                        <button onClick={onClose} className="text-zinc-400 hover:text-white transition">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 no-scrollbar">
                        {queue.length === 0 ? (
                            <div className="text-center text-zinc-500 py-10">Queue is empty</div>
                        ) : (
                            queue.map((song, index) => {
                                const isCurrent = currentSong?.id === song.id;
                                return (
                                    <div
                                        key={`${song.id}-${index}`}
                                        className={cn(
                                            "flex items-center gap-3 p-2 rounded-lg cursor-pointer group hover:bg-white/5 transition",
                                            isCurrent && "bg-white/10"
                                        )}
                                        onClick={() => playSong(song)}
                                    >
                                        <div className="relative w-10 h-10 rounded overflow-hidden flex-shrink-0 bg-zinc-800">
                                            {song.image && <Image src={song.image} alt={song.title} fill className="object-cover" />}
                                            <div className={cn("absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition", isCurrent && "opacity-100")}>
                                                {isCurrent ? (
                                                    <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse" />
                                                ) : (
                                                    <Play size={16} fill="white" className="text-white" />
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className={cn("text-sm font-medium truncate", isCurrent ? "text-purple-400" : "text-white")}>
                                                {song.title}
                                            </span>
                                            <span className="text-xs text-zinc-400 truncate">{song.artist}</span>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
