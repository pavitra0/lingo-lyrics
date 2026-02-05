"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { searchSongs, searchAlbums, searchArtists, searchPlaylists, getHomeModules, JioSaavnSong, JioSaavnAlbum, JioSaavnArtist, JioSaavnPlaylist } from "@/lib/api/jiosaavn";
import { usePlayer } from "@/lib/contexts/PlayerContext";
import { useRouter } from "next/navigation";
import Image from "next/image";
import SectionHeader from "@/components/Home/SectionHeader";
import HorizontalScroll from "@/components/Home/HorizontalScroll";
import SongCard from "@/components/Home/SongCard";
import CompactSongCard from "@/components/Home/CompactSongCard";

export default function Home() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{
    songs: JioSaavnSong[];
    albums: JioSaavnAlbum[];
    artists: JioSaavnArtist[];
    playlists: JioSaavnPlaylist[];
  }>({ songs: [], albums: [], artists: [], playlists: [] });

  const [loading, setLoading] = useState(false);
  const [homeData, setHomeData] = useState<any>(null);
  const [recentlyPlayed, setRecentlyPlayed] = useState<any[]>([]);
  const { playSong } = usePlayer();
  const router = useRouter();

  // Mock Chips
  const chips = ["Energize", "Relax", "Workout", "Commute", "Focus"];

  useEffect(() => {
    const initHome = async () => {
      const data = await getHomeModules();
      setHomeData(data);
    };
    initHome();

    // Load Recently Played
    const saved = localStorage.getItem("playedSongs");
    if (saved) {
      try {
        setRecentlyPlayed(JSON.parse(saved));
      } catch (e) { console.error(e); }
    }
  }, []);

  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return "Good Morning";
    if (hours < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      setResults({ songs: [], albums: [], artists: [], playlists: [] });
      return;
    }

    setLoading(true);
    const [songs, albums, artists, playlists] = await Promise.all([
      searchSongs(query),
      searchAlbums(query),
      searchArtists(query),
      searchPlaylists(query)
    ]);

    setResults({ songs, albums, artists, playlists });
    setLoading(false);
  };

  const handlePlay = (item: JioSaavnSong | any) => {
    // Handle both JioSaavnSong and stored history item structure
    const image = item.image && Array.isArray(item.image) ? item.image[item.image.length - 1]?.url : (typeof item.image === 'string' ? item.image : "");
    const downloadUrl = item.downloadUrl && Array.isArray(item.downloadUrl) ? item.downloadUrl[item.downloadUrl.length - 1]?.url : item.url;

    playSong({
      id: item.id,
      title: item.name || item.title,
      artist: item.primaryArtists || item.artist || item.subtitle,
      image: image || "",
      url: downloadUrl || "",
      duration: typeof item.duration === 'string' ? parseInt(item.duration) : item.duration,
    });
  };

  const normalizeItem = (item: any, type: "song" | "album" | "artist" | "playlist" | "chart") => {
    let image = "";
    if (Array.isArray(item.image)) {
      image = item.image[item.image.length - 1]?.link || item.image[item.image.length - 1]?.url || "";
    } else if (typeof item.image === 'string') {
      image = item.image;
    }

    // Fallback if image is still missing/empty
    if (!image && item.image) image = String(item.image);

    const title = item.title || item.name || "Unknown Title";
    const subtitle = item.subtitle || item.description || item.header_desc || item.artist || item.primaryArtists || "Unknown Artist";

    return { id: item.id, title, subtitle, image, type, original: item };
  };

  const renderSection = (title: string, items: any[], type: "song" | "album" | "artist" | "playlist" | "chart") => {
    if (!items || items.length === 0) return null;

    return (
      <HorizontalScroll title={title}>
        {items.map((item, idx) => {
          const data = normalizeItem(item, type);
          if (!data.image) return null; // Skip items without valid image
          return (
            <SongCard
              key={`${data.id}-${idx}`}
              id={data.id}
              title={data.title}
              subtitle={data.subtitle}
              image={data.image}
              type={type}
              onPlay={() => type === 'song' ? handlePlay(item) : undefined}
              onClick={() => {
                if (type === 'song') handlePlay(item);
                else if (type === 'album') router.push(`/album/${item.id}`);
                else if (type === 'artist') router.push(`/artist/${item.id}`);
                else if (type === 'playlist') router.push(`/playlist/${item.id}`);
              }}
            />
          );
        })}
      </HorizontalScroll>
    );
  };

  return (
    <div className="p-4 md:p-8 max-w-[1700px] mx-auto pb-40 relative">
      {/* Premium Background Gradient */}
      <div className="fixed inset-0 z-[-1] pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-900/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-900/20 blur-[120px]" />
        <div className="absolute top-[20%] right-[20%] w-[30%] h-[30%] rounded-full bg-pink-900/10 blur-[100px]" />
      </div>

      {/* Header / Greeting */}
      {!query && (
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-6">
            {/* Profile Pic Placeholder - Match YTM style */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
              PB
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">{getGreeting()}</h1>
          </div>

          {/* Chips */}
          <div className="flex gap-3 overflow-x-auto no-scrollbar w-full pb-2 sticky top-0 bg-black/95 py-2 z-20 -mx-4 px-4 md:mx-0 md:px-0">
            {chips.map(chip => (
              <button key={chip} className="px-4 py-1.5 rounded-lg bg-[#212121] hover:bg-[#333] hover:text-white transition whitespace-nowrap text-sm font-medium border border-white/10 text-zinc-300">
                {chip}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search Header */}
      <div className="mb-8 flex flex-col items-start gap-6">
        <form onSubmit={handleSearch} className="w-full max-w-lg relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
          <input
            type="text"
            placeholder="Search songs, albums, artists..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-full bg-[#212121] border border-transparent focus:border-white/10 focus:bg-[#2a2a2a] text-white placeholder:text-zinc-500 transition outline-none"
          />
        </form>
      </div>

      {loading && <div className="text-zinc-400 text-center py-20 flex flex-col items-center"><div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mb-4" />Searching...</div>}

      {/* Search Results */}
      {query && !loading && (
        <div className="flex flex-col gap-10 mb-12">
          {renderSection("Songs", results.songs, "song")}
          {renderSection("Albums", results.albums, "album")}
          {renderSection("Artists", results.artists, "artist")}
          {renderSection("Playlists", results.playlists, "playlist")}
          {results.songs.length === 0 && results.albums.length === 0 && <div className="text-center text-zinc-500">No results found.</div>}
        </div>
      )}

      {/* Home Content */}
      {!query && !loading && (
        <div className="flex flex-col gap-10">

          {/* Quick Picks / Start Radio Section (Grid Layout) */}
          {recentlyPlayed.length > 0 && (
            <section className="mb-0">
              <SectionHeader title="Quick picks" />
              <div className="flex overflow-x-auto pb-4 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
                <div className="grid grid-rows-4 grid-flow-col gap-x-6 gap-y-3 min-w-max">
                  {recentlyPlayed.slice(0, 16).map((item, idx) => {
                    const data = normalizeItem(item, "song");
                    // Filter out broken items
                    if (!data.image || !data.title || data.title === "Unknown Title") return null;

                    return (
                      <CompactSongCard
                        key={`${data.id}-${idx}r`}
                        {...data}
                        onPlay={() => handlePlay(item)}
                        onClick={() => handlePlay(item)}
                      />
                    )
                  })}
                </div>
              </div>
            </section>
          )}

          {/* Mapping homeData to sections */}
          {homeData && (
            <>
              {/* Mixed for you - using Trending Songs for now */}
              {homeData.trending && renderSection("Mixed for you", homeData.trending.songs, "song")}

              {/* From the community - using Playlists/Albums if available, or just Charts */}
              {homeData.charts && renderSection("From the community", homeData.charts, "chart")}

              {/* Recommended New Releases */}
              {homeData.albums && renderSection("New releases", homeData.albums, "album")}

              {/* Trending Albums */}
              {homeData.trending && renderSection("Trending Albums", homeData.trending.albums, "album")}
            </>
          )}
        </div>
      )}

    </div>
  );
}
