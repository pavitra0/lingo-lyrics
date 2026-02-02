"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { searchSongs, JioSaavnSong } from "@/lib/api/jiosaavn";
import { usePlayer } from "@/lib/contexts/PlayerContext";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function Home() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<JioSaavnSong[]>([]);
  const [loading, setLoading] = useState(false);
  const { playSong } = usePlayer();
  const router = useRouter();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    const data = await searchSongs(query);
    setResults(data);
    setLoading(false);
  };

  const handlePlay = (item: JioSaavnSong) => {
    // Map JioSaavnSong to our shared Song interface
    // Note: JioSaavn api returns image as array, we pick the highest quality
    const highQualityImage = item.image[item.image.length - 1]?.link;
    const highQualityAudio = item.downloadUrl[item.downloadUrl.length - 1]?.link;

    // We can play immediately, but navigating is better.
    // However, if we navigate, the new page should handle playing.
    // Let's just navigate.
    router.push(`/song/${item.id}`);
  };

  return (
    <main className="min-h-screen p-4 md:p-8 pt-20 pb-32 max-w-7xl mx-auto">
      <div className="flex flex-col items-center justify-center space-y-8 mb-12">
        <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600 text-center">
          LyricLingo
        </h1>
        <p className="text-zinc-400 text-center max-w-lg">
          Listen to global music with real-time sync lyrics and instant translation.
        </p>

        <form onSubmit={handleSearch} className="w-full max-w-xl relative">
          <input
            type="text"
            placeholder="Search for a song..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 rounded-full bg-zinc-900/50 border border-zinc-700 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none text-white transition glass"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
          <button
            type="submit"
            disabled={loading}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-purple-600 rounded-full text-sm font-medium hover:bg-purple-700 transition disabled:opacity-50"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {results.map((song) => {
          const imageUrl = song.image[song.image.length - 1]?.link;
          return (
            <div
              key={song.id}
              onClick={() => handlePlay(song)}
              className="group flex items-center p-3 gap-4 rounded-xl hover:bg-white/5 transition cursor-pointer glass-card"
            >
              <div className="relative h-16 w-16 flex-shrink-0 rounded-md overflow-hidden">
                <Image src={imageUrl} alt={song.name} fill className="object-cover group-hover:scale-110 transition duration-500" />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <span className="text-white">▶</span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-white truncate">{song.name}</h3>
                <p className="text-sm text-zinc-400 truncate">{song.primaryArtists}</p>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
