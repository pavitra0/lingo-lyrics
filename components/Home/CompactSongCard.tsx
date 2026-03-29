"use client";

import { Play } from "lucide-react";
import { useState } from "react";
import { useTheme } from "@/lib/contexts/ThemeContext";
import { MusicImage } from "@/components/Shared/MusicImage";

interface CompactSongCardProps {
    id: string;
    title: string;
    subtitle: string;
    image: string;
    onPlay?: () => void;
    onClick?: () => void;
}

export default function CompactSongCard({ title, subtitle, image, onClick }: CompactSongCardProps) {
    const [isHovered, setIsHovered] = useState(false);
    const { theme } = useTheme();
    const isTerminal = theme === "terminal";

    return (
        <div
            className={`group flex items-center gap-3 w-full max-w-[360px] cursor-pointer p-1.5 transition-colors ${isTerminal ? 'rounded border border-transparent hover:border-zinc-800' : 'rounded-md hover:bg-surface-hover'}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={onClick}
        >
            <div className={`relative h-12 w-12 flex-shrink-0 overflow-hidden ${isTerminal ? 'rounded-[2px] bg-black border border-zinc-800' : 'rounded-[4px] bg-surface-hover'}`}>
                <MusicImage src={image} alt={title} fill className="object-cover" fallbackIconSize={16} />

                {/* Hover Overlay */}
                <div className={`absolute inset-0 bg-black/60 flex items-center justify-center transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
                    <Play fill="white" size={isTerminal ? 16 : 18} className="text-white ml-0.5" />
                </div>
            </div>

            <div className="flex flex-col overflow-hidden">
                <span className={`truncate ${isTerminal ? 'text-zinc-200 font-mono text-sm group-hover:text-white transition-colors' : 'text-foreground font-medium text-sm'}`}>{title}</span>
                <span className={`truncate ${isTerminal ? 'text-zinc-500 font-mono text-xs' : 'text-zinc-500 dark:text-zinc-400 text-xs'}`}>{subtitle}</span>
            </div>
        </div>
    );
}
