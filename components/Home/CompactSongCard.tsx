"use client";

import Image from "next/image";
import { Play } from "lucide-react";
import { useState } from "react";

interface CompactSongCardProps {
    id: string;
    title: string;
    subtitle: string;
    image: string;
    onPlay?: () => void;
    onClick?: () => void;
}

export default function CompactSongCard({
    title,
    subtitle,
    image,
    onPlay,
    onClick,
}: CompactSongCardProps) {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div
            className="group flex items-center gap-3 w-full max-w-[360px] cursor-pointer rounded-md hover:bg-white/10 p-1.5 transition-colors"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={onClick}
        >
            <div className="relative h-12 w-12 flex-shrink-0 rounded-[4px] overflow-hidden bg-zinc-800">
                {image ? (
                    <Image src={image} alt={title} fill className="object-cover" />
                ) : (
                    <div className="w-full h-full bg-zinc-800" />
                )}

                {/* Hover Overlay */}
                <div className={`absolute inset-0 bg-black/60 flex items-center justify-center transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
                    <Play fill="white" size={18} className="text-white ml-0.5" />
                </div>
            </div>

            <div className="flex flex-col overflow-hidden">
                <span className="text-white font-medium truncate text-sm">{title}</span>
                <span className="text-zinc-400 text-xs truncate">{subtitle}</span>
            </div>
        </div>
    );
}
