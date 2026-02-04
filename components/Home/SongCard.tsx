"use client";

import Image from "next/image";
import { Play } from "lucide-react";
import { useState } from "react";

interface SongCardProps {
    id: string;
    title: string;
    subtitle: string;
    image: string;
    type: "song" | "album" | "artist" | "playlist" | "chart";
    onPlay?: () => void;
    onClick?: () => void;
}

export default function SongCard({
    title,
    subtitle,
    image,
    type,
    onPlay,
    onClick,
}: SongCardProps) {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div
            className="group flex flex-col gap-3 min-w-[160px] max-w-[160px] md:min-w-[180px] md:max-w-[180px] cursor-pointer"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={onClick}
        >
            <div className="relative aspect-square rounded-md overflow-hidden bg-zinc-900 shadow-md">
                {image ? (
                    <Image
                        src={image}
                        alt={title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 768px) 160px, 180px"
                    />
                ) : (
                    <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-zinc-600">
                        <span className="text-xs">No Image</span>
                    </div>
                )}

                {/* Hover Overlay with Play Button */}
                <div
                    className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-300 ${isHovered ? "opacity-100" : "opacity-0"
                        }`}
                >
                    {onPlay && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onPlay();
                            }}
                            className="bg-white text-black p-3 rounded-full shadow-xl hover:scale-110 transition-transform active:scale-95"
                        >
                            <Play fill="currentColor" size={24} className="ml-1" />
                        </button>
                    )}
                </div>
            </div>

            <div className="flex flex-col gap-1">
                <span className="text-white font-medium truncate text-[0.95rem] group-hover:underline decoration-1 underline-offset-2">
                    {title}
                </span>
                <span className="text-zinc-400 text-sm truncate">{subtitle}</span>
            </div>
        </div>
    );
}
