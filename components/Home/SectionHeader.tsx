"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface SectionHeaderProps {
    title: string;
    onScrollLeft?: () => void;
    onScrollRight?: () => void;
    showControls?: boolean;
}

export default function SectionHeader({
    title,
    onScrollLeft,
    onScrollRight,
    showControls = true,
}: SectionHeaderProps) {
    return (
        <div className="flex items-end justify-between mb-4 px-4 md:px-0 group/header">
            <div className="flex flex-col gap-1">
                {/* Optional: Add "Start Radio" or subtitle if needed in future */}
                {/* <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Start Radio</span> */}
                <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">{title}</h2>
            </div>

            {showControls && (
                <div className="hidden md:flex gap-2 opacity-0 group-hover/header:opacity-100 transition-opacity duration-300">
                    <button
                        onClick={onScrollLeft}
                        className="p-2 rounded-full border border-zinc-700 bg-black/50 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
                        aria-label="Scroll left"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <button
                        onClick={onScrollRight}
                        className="p-2 rounded-full border border-zinc-700 bg-black/50 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
                        aria-label="Scroll right"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            )}
        </div>
    );
}
