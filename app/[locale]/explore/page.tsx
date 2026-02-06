"use client";

import { useEffect, useRef, useState } from "react";
import { searchPlaylists, JioSaavnPlaylist } from "@/lib/api/jiosaavn";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const GENRES = ["For You", "Hindi", "English", "Punjabi", "Tamil", "Telugu", "Marathi", "Gujarati", "Bengali", "Kannada", "Bhojpuri", "Haryanvi", "Rajasthani"];

export default function ExplorePage() {
    const [selectedGenre, setSelectedGenre] = useState("For You");
    const [playlists, setPlaylists] = useState<JioSaavnPlaylist[]>([]);
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const scrollLeft = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollBy({ left: -800, behavior: "smooth" });
        }
    };

    const scrollRight = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollBy({ left: 800, behavior: "smooth" });
        }
    };

    const fetchPlaylists = async (genre: string) => {
        setLoading(true);
        try {
            // For "For You", we might want a different logic, or just search generic "Top" or "Trending"
            // Since we don't have local data, we'll search for the genre or "Top English" etc.
            const query = genre === "For You" ? "Trending" : genre;
            const results = await searchPlaylists(query); // limit is handled in api or default
            setPlaylists(results);
        } catch (error) {
            console.error("Error fetching playlists:", error);
            setPlaylists([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPlaylists(selectedGenre);
    }, [selectedGenre]);

    return (
        <div className="p-4 md:p-8 max-w-[1600px] mx-auto min-h-screen pb-24">
            <h1 className="text-3xl font-bold mb-8">Explore</h1>

            {/* Genre Pills */}
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-6 sticky top-0 z-20 bg-black/80 backdrop-blur-xl py-4 -mt-4 -mx-4 px-4 md:mx-0 md:px-0 md:static md:bg-transparent md:backdrop-blur-none">
                {GENRES.map((genre) => (
                    <button
                        key={genre}
                        onClick={() => setSelectedGenre(genre)}
                        className={cn(
                            "px-6 py-2 rounded-full whitespace-nowrap transition-all font-medium text-sm md:text-base border hover:scale-105 active:scale-95",
                            selectedGenre === genre
                                ? "bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.4)]"
                                : "bg-[#121212] text-zinc-400 border-white/10 hover:border-white/50 hover:text-white"
                        )}
                    >
                        {genre}
                    </button>
                ))}
            </div>

            <div className="mt-8">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <span className="w-1.5 h-6 bg-purple-500 rounded-full inline-block"></span>
                        {selectedGenre} Playlists
                    </h2>
                    <div className="hidden md:flex gap-2">
                        <button onClick={scrollLeft} className="p-2 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white transition">
                            <ChevronLeft size={24} />
                        </button>
                        <button onClick={scrollRight} className="p-2 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white transition">
                            <ChevronRight size={24} />
                        </button>
                    </div>
                </div>

                {/* Playlist Grid/Track (Horizontal Scroll on Desktop to match user request "scrollLeft/Right") */}
                {/* User implementation used grid but with scroll buttons. Let's make it a horizontal scroll container properly. */}
                <div className="relative group/container">

                    {/* Desktop Hover Arrows */}
                    <button
                        onClick={scrollLeft}
                        className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-black/50 backdrop-blur-md rounded-full items-center justify-center text-white opacity-0 group-hover/container:opacity-100 transition-opacity hover:bg-black/80 -ml-6 border border-white/10"
                    >
                        <ChevronLeft size={28} />
                    </button>

                    <button
                        onClick={scrollRight}
                        className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-black/50 backdrop-blur-md rounded-full items-center justify-center text-white opacity-0 group-hover/container:opacity-100 transition-opacity hover:bg-black/80 -mr-6 border border-white/10"
                    >
                        <ChevronRight size={28} />
                    </button>


                    <div
                        ref={scrollRef}
                        className="flex overflow-x-auto gap-6 pb-8 no-scrollbar scroll-smooth"
                    >
                        {loading ? (
                            Array.from({ length: 10 }).map((_, i) => (
                                <div key={i} className="min-w-[160px] md:min-w-[200px] flex flex-col gap-3 animate-pulse">
                                    <div className="aspect-square bg-zinc-800 rounded-lg"></div>
                                    <div className="h-4 bg-zinc-800 rounded w-3/4"></div>
                                    <div className="h-3 bg-zinc-800 rounded w-1/2"></div>
                                </div>
                            ))
                        ) : (
                            playlists.map((playlist) => {
                                const image = playlist.image?.[playlist.image.length - 1]?.url || "";
                                return (
                                    <Link
                                        href={`/playlist/${playlist.id}`}
                                        key={playlist.id}
                                        className="min-w-[160px] md:min-w-[200px] group flex flex-col gap-3 cursor-pointer p-3 rounded-xl transition-colors hover:bg-zinc-900/50"
                                    >
                                        <div className="relative aspect-square rounded-lg overflow-hidden bg-zinc-800 shadow-lg">
                                            {image && (
                                                <Image
                                                    src={image}
                                                    alt={playlist.name}
                                                    fill
                                                    className="object-cover group-hover:scale-105 transition duration-500"
                                                />
                                            )}
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                                <div className="p-3 bg-white rounded-full text-black scale-90 group-hover:scale-100 transition shadow-lg">
                                                    <Play size={24} fill="currentColor" />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <h3 className="font-semibold text-white truncate text-base leading-tight group-hover:text-purple-400 transition-colors">{playlist.name}</h3>
                                            <p className="text-zinc-400 text-sm truncate">{playlist.language || "Playlist"}</p>
                                        </div>
                                    </Link>
                                );
                            })
                        )}
                        {!loading && playlists.length === 0 && (
                            <div className="w-full text-center text-zinc-500 py-20">No playlists found.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
