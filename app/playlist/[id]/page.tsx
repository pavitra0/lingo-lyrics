"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getPlaylistById, JioSaavnPlaylist } from "@/lib/api/jiosaavn";
import { SongList } from "@/components/Shared/SongList";
import Image from "next/image";
import { usePlayer } from "@/lib/contexts/PlayerContext";
import { Play } from "lucide-react";

export default function PlaylistPage() {
    const params = useParams();
    const id = params.id as string;
    const [playlist, setPlaylist] = useState<JioSaavnPlaylist | null>(null);
    const [loading, setLoading] = useState(true);
    const { playSong, setQueue } = usePlayer();

    useEffect(() => {
        const init = async () => {
            if (id) {
                const data = await getPlaylistById(id);
                setPlaylist(data);
            }
            setLoading(false);
        };
        init();
    }, [id]);

    const handlePlayAll = () => {
        if (playlist && playlist.songs.length > 0) {
            const firstSong = playlist.songs[0];
            const highQualityImage = firstSong.image[firstSong.image.length - 1]?.url;
            const highQualityAudio = firstSong.downloadUrl[firstSong.downloadUrl.length - 1]?.url;

            playSong({
                id: firstSong.id,
                title: firstSong.name,
                artist: firstSong.primaryArtists,
                image: highQualityImage || "",
                url: highQualityAudio || "",
                duration: parseInt(firstSong.duration),
            });
        }
    };

    if (loading) return <div className="p-8 text-white">Loading...</div>;
    if (!playlist) return <div className="p-8 text-white">Playlist not found</div>;

    const coverImage = playlist.image[playlist.image.length - 1]?.url;

    return (
        <div className="flex flex-col w-full min-h-screen bg-black text-white p-4 md:p-8 pb-32">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-center md:items-end gap-6 mb-8">
                <div className="relative h-48 w-48 shadow-2xl rounded-lg overflow-hidden flex-shrink-0">
                    <Image src={coverImage} alt={playlist.name} fill className="object-cover" />
                </div>
                <div className="flex flex-col items-center md:items-start text-center md:text-left">
                    <h2 className="text-zinc-400 uppercase tracking-widest text-sm font-medium mb-2">Playlist</h2>
                    <h1 className="text-3xl md:text-5xl font-bold mb-4">{playlist.name}</h1>
                    <p className="text-zinc-400 mb-2 max-w-xl">{playlist.description}</p>
                    <div className="flex items-center gap-2 text-zinc-400 text-sm">
                        <span className="text-white font-medium">{playlist.username}</span>
                        <span>•</span>
                        <span>{playlist.songCount} songs</span>
                    </div>

                    <button
                        onClick={handlePlayAll}
                        className="mt-6 px-8 py-3 bg-white text-black rounded-full font-bold text-sm tracking-wide hover:scale-105 transition flex items-center gap-2"
                    >
                        <Play size={20} fill="black" />
                        PLAY ALL
                    </button>
                </div>
            </div>

            {/* Songs */}
            <div className="w-full max-w-4xl">
                <SongList songs={playlist.songs} />
            </div>
        </div>
    );
}
