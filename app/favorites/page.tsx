"use client";

import { useEffect, useState } from "react";
import { usePlayer } from "@/lib/contexts/PlayerContext";
import { Play, Trash2, Heart, Music2, Quote } from "lucide-react";
import { getSongById } from "@/lib/api/jiosaavn";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface FavoriteLine {
    id: string;
    songId: string;
    time: number;
    text: string;
    title: string;
    artist: string;
    image?: string;
}

export default function FavoritesPage() {
    const [activeTab, setActiveTab] = useState<'songs' | 'lyrics'>('songs');

    return (
        <div className="flex flex-col w-full min-h-screen bg-black text-white p-4 md:p-8 pb-32 max-w-[1600px] mx-auto">
            <div className="flex items-center gap-4 mb-8">
                <Heart className="text-red-500" size={32} fill="currentColor" />
                <h1 className="text-3xl md:text-4xl font-bold">Favorites</h1>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-4 mb-8 border-b border-white/10 pb-1">
                <button
                    onClick={() => setActiveTab('songs')}
                    className={cn(
                        "px-4 py-2 text-sm font-medium transition flex items-center gap-2 border-b-2",
                        activeTab === 'songs' ? "border-purple-500 text-white" : "border-transparent text-zinc-400 hover:text-white"
                    )}
                >
                    <Music2 size={18} />
                    Liked Songs
                </button>
                <button
                    onClick={() => setActiveTab('lyrics')}
                    className={cn(
                        "px-4 py-2 text-sm font-medium transition flex items-center gap-2 border-b-2",
                        activeTab === 'lyrics' ? "border-purple-500 text-white" : "border-transparent text-zinc-400 hover:text-white"
                    )}
                >
                    <Quote size={18} />
                    Saved Lyrics
                </button>
            </div>

            <div className="w-full">
                {activeTab === 'songs' ? <LikedSongsTab /> : <SavedLyricsTab />}
            </div>
        </div>
    );
}

function LikedSongsTab() {
    const [songs, setSongs] = useState<any[]>([]);
    const { playSong } = usePlayer();

    useEffect(() => {
        const loadSongs = () => {
            const savedDB = localStorage.getItem("likedSongs_db");
            if (savedDB) {
                try {
                    setSongs(JSON.parse(savedDB).reverse());
                } catch (e) { console.error(e); }
            }
        };
        loadSongs();
        window.addEventListener('storage', loadSongs);
        return () => window.removeEventListener('storage', loadSongs);
    }, []);

    const removeSong = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newSongs = songs.filter(s => s.id !== id);
        setSongs(newSongs);
        localStorage.setItem("likedSongs_db", JSON.stringify(newSongs));
        // Also update IDs DB for sync
        const ids = newSongs.map(s => s.id);
        localStorage.setItem("likedSongsIds", JSON.stringify(ids));
        window.dispatchEvent(new Event('storage'));
    };

    if (songs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
                <Music2 size={48} className="mb-4 opacity-20" />
                <p>No liked songs yet.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-2">
            {songs.map((song, i) => (
                <motion.div
                    key={`${song.id}-${i}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="group flex items-center justify-between p-2 rounded-md hover:bg-white/5 transition cursor-pointer"
                    onClick={() => playSong(song)}
                >
                    <div className="flex items-center gap-4">
                        <span className="text-zinc-500 w-6 text-center">{i + 1}</span>
                        <div className="relative h-12 w-12 rounded overflow-hidden bg-zinc-800 flex-shrink-0">
                            {song.image && <Image src={song.image} alt={song.title} fill className="object-cover" />}
                        </div>
                        <div>
                            <h3 className="font-medium text-white group-hover:text-purple-400 transition line-clamp-1">{song.title}</h3>
                            <p className="text-sm text-zinc-400 line-clamp-1">{song.artist}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-zinc-500 hidden md:block">
                            {song.duration ? `${Math.floor(song.duration / 60)}:${(song.duration % 60).toString().padStart(2, '0')}` : ''}
                        </span>
                        <button
                            onClick={(e) => removeSong(song.id, e)}
                            className="p-2 text-zinc-500 hover:text-red-500 hover:bg-white/10 rounded-full transition opacity-0 group-hover:opacity-100"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}

function SavedLyricsTab() {
    const [favorites, setFavorites] = useState<FavoriteLine[]>([]);
    const { playSong, seek } = usePlayer();

    useEffect(() => {
        const loadFavorites = () => {
            const savedDB = localStorage.getItem("lyric_favorites_db");
            if (savedDB) {
                try {
                    setFavorites(JSON.parse(savedDB).reverse());
                } catch (e) { console.error(e); }
            }
        };
        loadFavorites();
        window.addEventListener('storage', loadFavorites);
        return () => window.removeEventListener('storage', loadFavorites);
    }, []);

    const handlePlay = async (fav: FavoriteLine) => {
        try {
            const songData = await getSongById(fav.songId);
            if (songData) {
                const song = Array.isArray(songData) ? songData[0] : songData;
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
                setTimeout(() => seek(fav.time), 500);
            }
        } catch (e) {
            console.error("Failed to play favorite", e);
        }
    };

    const removeFavorite = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newFavs = favorites.filter(f => f.id !== id);
        setFavorites(newFavs);
        localStorage.setItem("lyric_favorites_db", JSON.stringify(newFavs));
        window.dispatchEvent(new Event('storage'));
    };

    if (favorites.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
                <Quote size={48} className="mb-4 opacity-20" />
                <p>No favorite lines yet.</p>
                <p className="text-sm">Click the heart icon next to lyrics to save them here.</p>
            </div>
        );
    }

    return (
        <div className="grid gap-4 w-full max-w-4xl mx-auto">
            {favorites.map((fav, index) => (
                <div
                    key={`${fav.id}-${index}`}
                    className="bg-zinc-900/50 hover:bg-zinc-800 border border-white/5 rounded-xl p-4 flex items-center justify-between group transition cursor-pointer"
                    onClick={() => handlePlay(fav)}
                >
                    <div className="flex items-center gap-4 min-w-0">
                        <div className="h-12 w-12 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0 text-zinc-500">
                            <Play size={20} fill="currentColor" />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <p className="font-serif text-lg md:text-xl italic text-purple-200 line-clamp-2">"{fav.text}"</p>
                            <p className="text-sm text-zinc-400 mt-1 truncate">{fav.title} • {fav.artist}</p>
                        </div>
                    </div>

                    <button
                        onClick={(e) => removeFavorite(fav.id, e)}
                        className="p-3 text-zinc-500 hover:text-red-500 hover:bg-white/10 rounded-full transition opacity-0 group-hover:opacity-100"
                        title="Remove"
                    >
                        <Trash2 size={20} />
                    </button>
                </div>
            ))}
        </div>
    );
}
