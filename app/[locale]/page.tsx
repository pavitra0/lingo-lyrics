"use client";

import { useEffect, useState, useRef } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { searchSongs, searchAlbums, searchArtists, searchPlaylists, getHomeModules, getPlaylistById, JioSaavnSong, JioSaavnAlbum, JioSaavnArtist, JioSaavnPlaylist } from "@/lib/api/jiosaavn";
import { getSearchSuggestions } from "@/lib/api/suggestions";
import { usePlayer } from "@/lib/contexts/PlayerContext";
import { useRouter } from "@/i18n/routing";
import SectionHeader from "@/components/Home/SectionHeader";
import HorizontalScroll from "@/components/Home/HorizontalScroll";
import SongCard from "@/components/Home/SongCard";
import CompactSongCard from "@/components/Home/CompactSongCard";
import { useTranslations } from "next-intl";
import { useTheme } from "@/lib/contexts/ThemeContext";

type SearchSectionType = "song" | "album" | "artist" | "playlist" | "chart";

type SearchableImage = Array<{ url?: string; link?: string }> | string | undefined;

type SearchableItem = {
  id: string;
  name?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  header_desc?: string;
  artist?: string;
  primaryArtists?: string;
  artistId?: string;
  artists?: {
    primary?: Array<{
      id?: string;
      name?: string;
    }>;
  };
  image?: SearchableImage;
  downloadUrl?: Array<{ url?: string }>;
  url?: string;
  duration?: string | number;
  language?: string;
};

type HomeModulesData = {
  trending?: {
    songs?: JioSaavnSong[];
    albums?: JioSaavnAlbum[];
  };
  albums?: JioSaavnAlbum[];
  charts?: SearchableItem[];
};

export default function Home() {
  const t = useTranslations("Home");
  const { theme } = useTheme();
  const isTerminal = theme === "terminal";

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{
    songs: JioSaavnSong[];
    albums: JioSaavnAlbum[];
    artists: JioSaavnArtist[];
    playlists: JioSaavnPlaylist[];
  }>({ songs: [], albums: [], artists: [], playlists: [] });

  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [homeData, setHomeData] = useState<HomeModulesData | null>(null);
  const [recentlyPlayed, setRecentlyPlayed] = useState<SearchableItem[]>([]);
  const { playSong } = usePlayer();
  const router = useRouter();

  // Mood Chips State
  const [activeChip, setActiveChip] = useState<string | null>("Energize");
  const [moodSongs, setMoodSongs] = useState<JioSaavnSong[]>([]);
  const [moodAlbums, setMoodAlbums] = useState<JioSaavnAlbum[]>([]);
  const [moodPlaylists, setMoodPlaylists] = useState<JioSaavnPlaylist[]>([]);
  const [moodLoading, setMoodLoading] = useState(false);

  // Expanded Chips
  const chips = ["Energize", "Relax", "Workout", "Party", "Focus", "Romance", "Sleep", "Retro", "Sad", "Jazz", "Commute"];

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch mood data when activeChip changes
  useEffect(() => {
    const fetchMoodData = async () => {
      if (!activeChip) {
        setMoodSongs([]);
        setMoodAlbums([]);
        setMoodPlaylists([]);
        return;
      }

      setMoodLoading(true);
      try {
        // Fetch Playlists and Albums in parallel
        const [playlists, albums] = await Promise.all([
          searchPlaylists(`${activeChip} songs`),
          searchAlbums(`${activeChip} songs`)
        ]);

        setMoodPlaylists(playlists || []);
        setMoodAlbums(albums || []);

        // For Quick Picks (Songs), get songs from the first playlist found
        if (playlists && playlists.length > 0) {
          const firstPlaylist = playlists[0];
          const playlistDetails = await getPlaylistById(firstPlaylist.id);
          if (playlistDetails && playlistDetails.songs) {
            setMoodSongs(playlistDetails.songs);
          } else {
            setMoodSongs([]);
          }
        } else {
          setMoodSongs([]);
        }

      } catch (e) {
        console.error(e);
        // Reset on error
        setMoodSongs([]);
        setMoodAlbums([]);
        setMoodPlaylists([]);
      } finally {
        setMoodLoading(false);
      }
    };

    fetchMoodData();
  }, [activeChip]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);

    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    searchTimeout.current = setTimeout(async () => {
      if (val.trim().length > 1) {
        try {
          const data = await getSearchSuggestions(val);
          setSuggestions(data);
          setShowSuggestions(data.length > 0);
        } catch (error) {
          console.error("Failed to load search suggestions", error);
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);
  };

  useEffect(() => {
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, []);

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

  const executeSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults({ songs: [], albums: [], artists: [], playlists: [] });
      setSearchError(null);
      return;
    }

    setQuery(searchQuery);
    setShowSuggestions(false);
    setLoading(true);
    setSearchError(null);

    try {
      const [songs, albums, artists, playlists] = await Promise.all([
        searchSongs(searchQuery),
        searchAlbums(searchQuery),
        searchArtists(searchQuery),
        searchPlaylists(searchQuery)
      ]);

      setResults({
        songs: songs || [],
        albums: albums || [],
        artists: artists || [],
        playlists: playlists || []
      });
    } catch (error) {
      console.error("Search failed", error);
      setResults({ songs: [], albums: [], artists: [], playlists: [] });
      setSearchError("Could not complete search right now.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(query);
  };

  const handleChipClick = (chip: string) => {
    if (activeChip === chip) {
      return;
    }
    setActiveChip(chip);
  };

  const handlePlay = (item: SearchableItem) => {
    // Handle both JioSaavnSong and stored history item structure
    const image = item.image && Array.isArray(item.image) ? item.image[item.image.length - 1]?.url : (typeof item.image === 'string' ? item.image : "");
    const downloadUrl = item.downloadUrl && Array.isArray(item.downloadUrl) ? item.downloadUrl[item.downloadUrl.length - 1]?.url : item.url;

    playSong({
      id: item.id,
      title: item.name || item.title || "Unknown Title",
      artist: item.primaryArtists || item.artist || item.subtitle || "Unknown Artist",
      artistId: item.artistId || item.artists?.primary?.[0]?.id,
      image: image || "",
      url: downloadUrl || "",
      duration: typeof item.duration === 'string' ? parseInt(item.duration) : item.duration,
      language: item.language,
    });
  };

  const normalizeItem = (item: SearchableItem, type: SearchSectionType) => {
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

  const renderSection = (title: string, items: SearchableItem[], type: SearchSectionType) => {
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
      {/* Premium Background Gradient (Dark Theme Only) */}
      {theme === "dark" && (
        <div className="fixed inset-0 z-[-1] pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-900/20 blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-900/20 blur-[120px]" />
          <div className="absolute top-[20%] right-[20%] w-[30%] h-[30%] rounded-full bg-pink-900/10 blur-[100px]" />
        </div>
      )}

      {/* Modern / Terminal Header Sections */}
      {!query && isTerminal && (
        <>
          <div className="mt-12 mb-10 flex flex-col items-center text-center w-full">
            <div className="text-foreground font-bold text-lg mb-16 tracking-wide">
              LingoLyrics
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-foreground tracking-tight mb-6 leading-tight">
              Most Actively Listened-To Global <br className="hidden md:block" /> Music
            </h1>
            <p className="text-zinc-400 text-sm md:text-base max-w-2xl leading-relaxed">
              Discover what people are actually listening to right now.<br />
              Ranked by real-world activity, not just charts.
            </p>
          </div>
          <div className="flex gap-3 justify-center flex-wrap w-full mb-10 px-4">
            {chips.slice(0, 6).map(chip => (
              <button
                key={chip}
                onClick={() => handleChipClick(chip)}
                className={cn(
                  "px-4 py-1.5 rounded text-xs font-mono transition border",
                  activeChip === chip
                    ? "bg-foreground text-background border-foreground"
                    : "bg-background hover:bg-surface-hover hover:text-foreground border-zinc-800 text-zinc-400"
                )}
              >
                {chip}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Classic / Dark Theme Header Sections */}
      {!query && !isTerminal && (
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">{getGreeting()}</h1>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar w-full pb-2 sticky top-0 bg-background/95 py-2 z-20 -mx-4 px-4 md:mx-0 md:px-0">
            {chips.map(chip => (
              <button
                key={chip}
                onClick={() => handleChipClick(chip)}
                className={cn(
                  "px-4 py-1.5 rounded-lg transition whitespace-nowrap text-sm font-medium border",
                  activeChip === chip
                    ? "bg-foreground text-background border-foreground"
                    : "bg-surface hover:bg-surface-hover hover:text-foreground border-zinc-800/10 text-zinc-500 dark:text-zinc-300"
                )}
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search Header */}
      <div className={cn("relative w-full mx-auto px-4 md:px-0 flex relative", isTerminal ? "mb-16 max-w-3xl items-center justify-center gap-4 flex-col md:flex-row" : "mb-8 flex-col items-start gap-6 max-w-lg")}>
        <form onSubmit={handleSearch} className={cn("relative", isTerminal ? "w-full flex-1" : "w-full")}>
          <Search className={cn("absolute left-4 top-1/2 -translate-y-1/2", isTerminal ? "text-zinc-600" : "text-zinc-400")} size={isTerminal ? 16 : 20} />
          <input
            type="text"
            placeholder={isTerminal ? "Search for songs, artists..." : "Search songs, albums, artists..."}
            value={query}
            onChange={handleInputChange}
            className={cn(
              "w-full pl-12 pr-4 transition outline-none",
              isTerminal
                ? "py-2.5 rounded bg-background border border-zinc-800 focus:border-zinc-500 text-foreground placeholder-zinc-600 text-sm font-mono"
                : "py-3 rounded-full bg-surface border border-zinc-200 dark:border-transparent focus:border-zinc-300 dark:focus:border-white/10 focus:bg-surface-hover text-foreground placeholder-zinc-500"
            )}
          />
        </form>
        {isTerminal && (
          <button className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-foreground text-background text-sm font-bold rounded opacity-90 hover:opacity-100 transition-colors whitespace-nowrap">
            + Add Playlist
          </button>
        )}

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full text-foreground left-0 w-full max-w-lg bg-surface border border-zinc-200 dark:border-white/10 rounded-xl overflow-hidden shadow-2xl z-50 mt-2">
            {suggestions.map((s, i) => (
              <button
                key={i}
                className="w-full text-left px-4 py-3 hover:bg-surface-hover transition flex items-center gap-3"
                onClick={() => executeSearch(s)}
              >
                <Search size={16} className="text-zinc-500" />
                <span>{s}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {loading && <div className="text-zinc-400 text-center py-20 flex flex-col items-center"><div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mb-4" />Searching...</div>}

      {/* Search Results */}
      {
        query && !loading && (
          <div className="flex flex-col gap-10 mb-12">
            {renderSection("Songs", results.songs, "song")}
            {renderSection("Albums", results.albums, "album")}
            {renderSection("Artists", results.artists, "artist")}
            {renderSection("Playlists", results.playlists, "playlist")}
            {searchError && <div className="text-center text-zinc-500">{searchError}</div>}
            {!searchError && results.songs.length === 0 && results.albums.length === 0 && results.artists.length === 0 && results.playlists.length === 0 && (
              <div className="text-center text-zinc-500">No results found.</div>
            )}
          </div>
        )
      }

      {/* Home Content */}
      {
        !query && !loading && (
          <div className="flex flex-col gap-10">

            {/* Quick Picks / Start Radio Section (Grid Layout) */}
            {recentlyPlayed.length > 0 && (
              <section className="mb-0">
                <SectionHeader title={t("quick_picks")} />
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

            {/* Mood Sections */}
            {activeChip && (
              <div className="flex flex-col gap-10">
                {moodLoading ? (
                  <div className="flex items-center gap-2 text-zinc-400 py-4"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Loading {activeChip} ...</div>
                ) : (
                  <>
                    {/* 1. Mood Quick Picks (Songs from top album) */}
                    {moodSongs.length > 0 && (
                      <section className="mb-0">
                        <SectionHeader title={`${activeChip} Picks`} />
                        <div className="flex overflow-x-auto pb-4 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
                          <div className="grid grid-rows-4 grid-flow-col gap-x-6 gap-y-3 min-w-max">
                            {moodSongs.slice(0, 16).map((item, idx) => {
                              const data = normalizeItem(item, "song");
                              if (!data.image || !data.title) return null;

                              return (
                                <CompactSongCard
                                  key={`${data.id}-${idx}m`}
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

                    {/* 2. Mood Playlists (Mixes) */}
                    {moodPlaylists.length > 0 && renderSection(`${activeChip} Mixes`, moodPlaylists, "playlist")}

                    {/* 3. Mood Albums */}
                    {moodAlbums.length > 0 && renderSection(`${activeChip} Albums`, moodAlbums, "album")}
                  </>
                )}
              </div>
            )}

            {/* Mapping homeData to sections */}
            {homeData && (
              <>
                {/* Mixed for you - using Trending Songs for now */}
                {homeData.trending && renderSection(t("trending"), homeData.trending.songs || [], "song")}

                {/* From the community - using Playlists/Albums if available, or just Charts */}
                {homeData.charts && renderSection(t("top_charts"), homeData.charts, "chart")}

                {/* Recommended New Releases */}
                {homeData.albums && renderSection(t("new_releases"), homeData.albums, "album")}

                {/* Trending Albums */}
                {homeData.trending && renderSection(t("trending"), homeData.trending.albums || [], "album")}
              </>
            )}
          </div>
        )
      }

    </div >
  );
}
