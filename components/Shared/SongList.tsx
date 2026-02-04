"use client";

import { JioSaavnSong } from "@/lib/api/jiosaavn";
import { usePlayer } from "@/lib/contexts/PlayerContext";
import Image from "next/image";
import { Play } from "lucide-react";

interface SongListProps {
    songs: JioSaavnSong[];
    onPlay?: (index: number) => void;
}

export function SongList({ songs, onPlay }: SongListProps) {
    const { playSong, currentSong, isPlaying, togglePlay } = usePlayer();

    const handlePlay = (song: JioSaavnSong, index: number) => {
        if (onPlay) {
            onPlay(index);
            return;
        }

        const highQualityImage = song.image[song.image.length - 1]?.url;
        const highQualityAudio = song.downloadUrl[song.downloadUrl.length - 1]?.url;

        playSong({
            id: song.id,
            title: song.name,
            artist: song.primaryArtists,
            image: highQualityImage || "",
            url: highQualityAudio || "",
            duration: parseInt(song.duration),
        });
    };

    return (
        <div className="flex flex-col w-full">
            {songs.map((song, index) => {
                const isCurrent = currentSong?.id === song.id;
                const imageUrl = song.image[song.image.length - 1]?.url;

                return (
                    <div
                        key={song.id}
                        className={`group flex items-center p-2 rounded-md gap-4 hover:bg-white/10 transition cursor-pointer ${isCurrent ? "bg-white/10" : ""}`}
                        onClick={() => handlePlay(song, index)}
                    >
                        <span className="w-6 text-center text-zinc-500 text-sm group-hover:hidden">
                            {index + 1}
                        </span>
                        <span className="w-6 text-center text-white hidden group-hover:block">
                            <Play size={14} fill="currentColor" />
                        </span>

                        <div className="relative h-10 w-10 flex-shrink-0 rounded overflow-hidden bg-zinc-800">
                            <Image src={imageUrl} alt={song.name} fill className="object-cover" />
                        </div>

                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                            <span className={`text-sm font-medium truncate ${isCurrent ? "text-purple-400" : "text-white"}`}>
                                {song.name}
                            </span>
                            <span className="text-xs text-zinc-400 truncate">
                                {song.primaryArtists}
                            </span>
                        </div>

                        <div className="text-xs text-zinc-500">
                            {Math.floor(parseInt(song.duration) / 60)}:{(parseInt(song.duration) % 60).toString().padStart(2, '0')}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
