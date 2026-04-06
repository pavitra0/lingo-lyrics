"use client";

import { usePlayer } from "@/lib/contexts/PlayerContext";
import { cn } from "@/lib/utils";
import { X, Play } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { MusicImage } from "@/components/Shared/MusicImage";

interface QueueListProps {
    isOpen: boolean;
    onClose: () => void;
}

export function QueueList({ isOpen, onClose }: QueueListProps) {
    const { queue, currentSong, playSong } = usePlayer();
    const pressableButtonClass = "transform-gpu transition duration-150 ease-out active:scale-95";
    const pressableSoftClass = "transform-gpu transition duration-150 ease-out active:scale-[0.98]";

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 50, scale: 0.95 }}
                    className="absolute bottom-[calc(100%+0.9rem)] right-0 z-50 flex max-h-[60vh] w-[min(25rem,calc(100vw-1rem))] flex-col overflow-hidden rounded-[1.5rem] border border-white/10 bg-black/75 shadow-[0_28px_90px_rgba(0,0,0,0.45)] backdrop-blur-2xl origin-bottom-right"
                >
                    <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.05] p-4">
                        <div>
                            <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-zinc-500">Queue</div>
                            <h3 className="text-sm font-semibold text-white">Up Next</h3>
                        </div>
                        <button onClick={onClose} className={cn("text-zinc-400 transition hover:text-white", pressableButtonClass)}>
                            <X size={20} />
                        </button>
                    </div>

                    <div className="no-scrollbar flex-1 overflow-y-auto p-2.5">
                        {queue.length === 0 ? (
                            <div className="text-center text-zinc-500 py-10">Queue is empty</div>
                        ) : (
                            queue.map((song, index) => {
                                const isCurrent = currentSong?.id === song.id;
                                return (
                                    <div
                                        key={`${song.id}-${index}`}
                                        className={cn(
                                            "group flex cursor-pointer items-center gap-3 rounded-2xl p-2.5 transition hover:bg-white/[0.08]",
                                            pressableSoftClass,
                                            isCurrent && "bg-white/[0.12]"
                                        )}
                                        onClick={() => playSong(song)}
                                    >
                                        <div className="relative h-11 w-11 flex-shrink-0 overflow-hidden rounded-xl bg-zinc-800">
                                            <MusicImage src={song.image} alt={song.title} fill className="object-cover" fallbackIconSize={16} />
                                            <div className={cn("absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition", isCurrent && "opacity-100")}>
                                                {isCurrent ? (
                                                    <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse" />
                                                ) : (
                                                    <Play size={16} fill="white" className="text-white" />
                                                )}
                                            </div>
                                        </div>
                                        <div className="min-w-0 flex flex-col">
                                            <span className={cn("truncate text-sm font-medium", isCurrent ? "text-white" : "text-white/90")}>
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
