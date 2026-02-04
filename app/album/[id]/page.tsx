"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getAlbumById, JioSaavnAlbum } from "@/lib/api/jiosaavn";
import { SongList } from "@/components/Shared/SongList";
import Image from "next/image";
import { usePlayer } from "@/lib/contexts/PlayerContext";
import { Play } from "lucide-react";

export default function AlbumPage() {
    const params = useParams();
    const id = params.id as string;
    const [album, setAlbum] = useState<JioSaavnAlbum | null>(null);
    const [loading, setLoading] = useState(true);
    const { playSong, setQueue } = usePlayer();

    useEffect(() => {
        const init = async () => {
            if (id) {
                const data = await getAlbumById(id);
                setAlbum(data);
            }
            setLoading(false);
        };
        init();
    }, [id]);

    const handlePlayAll = () => {
        if (album && album.songs.length > 0) {
            const mappedSongs = album.songs.map(song => {
                const highQualityImage = song.image[song.image.length - 1]?.url;
                const highQualityAudio = song.downloadUrl[song.downloadUrl.length - 1]?.url;
                return {
                    id: song.id,
                    title: song.name,
                    artist: song.primaryArtists,
                    image: highQualityImage || "",
                    url: highQualityAudio || "",
                    duration: parseInt(song.duration),
                };
            });

            playSong(mappedSongs[0]);
            setQueue(mappedSongs);
        }
    };

    if (loading) return <div className="p-8 text-white">Loading...</div>;
    if (!album) return <div className="p-8 text-white">Album not found</div>;

    const coverImage = album.image[album.image.length - 1]?.url;

    return (
        <div className="flex flex-col w-full min-h-screen bg-black text-white p-4 md:p-8 pb-32">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-center md:items-end gap-6 mb-8">
                <div className="relative h-48 w-48 shadow-2xl rounded-lg overflow-hidden flex-shrink-0">
                    <Image src={coverImage} alt={album.name} fill className="object-cover" />
                </div>
                <div className="flex flex-col items-center md:items-start text-center md:text-left">
                    <h2 className="text-zinc-400 uppercase tracking-widest text-sm font-medium mb-2">Album</h2>
                    <h1 className="text-3xl md:text-5xl font-bold mb-4">{album.name}</h1>
                    <div className="flex items-center gap-2 text-zinc-400 text-sm">
                        <span className="text-white font-medium">{album.primaryArtists}</span>
                        <span>•</span>
                        <span>{album.year}</span>
                        <span>•</span>
                        <span>{album.songCount} songs</span>
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
                <SongList songs={album.songs} />
            </div>
        </div>
    );
}
