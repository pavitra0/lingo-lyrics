"use client";

import { Play } from "lucide-react";
import { useState } from "react";
import { useTheme } from "@/lib/contexts/ThemeContext";
import { MusicImage } from "@/components/Shared/MusicImage";

interface SongCardProps {
    id: string;
    title: string;
    subtitle: string;
    image: string;
    type: "song" | "album" | "artist" | "playlist" | "chart";
    onPlay?: () => void;
    onClick?: () => void;
}

export default function SongCard({ title, subtitle, image, onPlay, onClick }: SongCardProps) {
    const [isHovered, setIsHovered] = useState(false);
    const { theme } = useTheme();
    const isTerminal = theme === "terminal";

    return (
        <div
            className="group flex flex-col gap-3 min-w-[160px] max-w-[160px] md:min-w-[180px] md:max-w-[180px] cursor-pointer"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={onClick}
        >
            <div className={`relative aspect-square overflow-hidden bg-surface-hover ${isTerminal ? 'rounded border border-zinc-800' : 'rounded-md shadow-md'}`}>
                <MusicImage
                    src={image}
                    alt={title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 160px, 180px"
                    fallbackIconSize={isTerminal ? 20 : 24}
                />

                {/* Hover Overlay with Play Button */}
                <div
                    className={`absolute inset-0 bg-black/${isTerminal ? '60' : '40'} flex items-center justify-center transition-opacity duration-300 ${isHovered ? "opacity-100" : "opacity-0"
                        }`}
                >
                    {onPlay && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onPlay();
                            }}
                            className={`bg-white text-black p-3 shadow-xl hover:scale-110 transition-transform active:scale-95 ${isTerminal ? 'rounded' : 'rounded-full'}`}
                        >
                            <Play fill="currentColor" size={isTerminal ? 20 : 24} className={isTerminal ? "ml-0.5" : "ml-1"} />
                        </button>
                    )}
                </div>
            </div>

            <div className={`flex flex-col gap-1 ${isTerminal ? 'mt-1' : ''}`}>
                <span className={`truncate ${isTerminal ? 'text-zinc-200 font-mono text-sm group-hover:text-white transition-colors' : 'text-foreground font-medium text-[0.95rem] group-hover:underline decoration-1 underline-offset-2'}`}>
                    {title}
                </span>
                <span className={`truncate ${isTerminal ? 'text-zinc-500 font-mono text-xs' : 'text-zinc-500 dark:text-zinc-400 text-sm'}`}>{subtitle}</span>
            </div>
        </div>
    );
}
