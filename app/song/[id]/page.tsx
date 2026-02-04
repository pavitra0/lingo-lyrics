"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getSongById, JioSaavnSong, getLyrics, getSongRecommendations, searchSongs } from "@/lib/api/jiosaavn";
import { getSyncedLyrics, LrcLibSong } from "@/lib/api/lyrics";
import { usePlayer } from "@/lib/contexts/PlayerContext";
import { LyricsContainer } from "@/components/Lyrics/LyricsContainer";
import { SongList } from "@/components/Shared/SongList";
import Image from "next/image";

export default function SongPage() {
    const params = useParams();
    const id = params.id as string;
    const { playSong, currentSong, isPlaying } = usePlayer();
    const [loading, setLoading] = useState(true);
    const [song, setSong] = useState<JioSaavnSong | null>(null);
    const [lyricsData, setLyricsData] = useState<LrcLibSong | null>(null);
    const [recommendations, setRecommendations] = useState<JioSaavnSong[]>([]);
    const [activeTab, setActiveTab] = useState<'lyrics' | 'related'>('lyrics');

    useEffect(() => {
        const init = async () => {
            if (!id) return;

            let songData = null;
            if (currentSong?.id === id) {
                try {
                    const data = await getSongById(id);
                    songData = data;
                } catch (e) {
                    console.error(e);
                }
            } else {
                const data = await getSongById(id);
                songData = data;
            }

            setSong(songData);

            if (songData) {
                // Fetch Recommendations with Fallback
                try {
                    let recs = await getSongRecommendations(id);

                    if (!recs || recs.length === 0) {
                        console.log("No direct recommendations, using fallback search.");
                        const searchQuery = `${songData.name} ${songData.primaryArtists?.split(',')[0]}`;
                        const searchResults = await searchSongs(searchQuery);
                        // Filter out current song
                        recs = searchResults.filter(s => s.id !== id);
                    }

                    setRecommendations(recs || []);
                } catch (e) {
                    console.warn("Failed to fetch recommendations", e);
                    setRecommendations([]);
                }

                console.log("Song Data for Lyrics (Full):", songData); // DEBUG
                const title = songData.name;

                // Defensive Artist Extraction
                let artist = songData.primaryArtists?.split(',')[0];

                // Check for nested object if flat string is missing/empty
                if (!artist) {
                    console.log("Primary Artists string missing. Checking nested object...");
                    const rawData = songData as any; // Cast to access 'artists'
                    if (rawData.artists && typeof rawData.artists === 'object') {
                        console.log("Found nested artists object:", rawData.artists);
                        const primary = rawData.artists.primary;
                        if (Array.isArray(primary) && primary.length > 0) {
                            artist = primary[0].name;
                            console.log("Extracted artist from nested object:", artist);
                        } else {
                            console.warn("Primary artists array is empty or invalid in nested object");
                        }
                    } else {
                        console.warn("No nested 'artists' object found on songData");
                    }
                } else {
                    console.log("Found flat primaryArtists:", artist);
                }

                const album = songData.album?.name;
                const duration = parseInt(songData.duration);

                console.log(`Calling getSyncedLyrics with: Title='${title}', Artist='${artist}', Album='${album}', Duration=${duration}`); // DEBUG

                let lyrics = null;
                if (title && artist) {
                    lyrics = await getSyncedLyrics(title, artist, album, duration);
                } else {
                    console.warn("Skipping synced lyrics fetch due to missing title or artist");
                }

                // Fallback to JioSaavn lyrics if LrcLib fails
                if (!lyrics) {
                    try {
                        const jioLyrics = await getLyrics(songData.id);
                        if (jioLyrics && jioLyrics.lyrics) {
                            lyrics = {
                                id: 0, // Dummy ID
                                name: title,
                                trackName: title,
                                artistName: artist,
                                albumName: songData.album?.name || "",
                                duration: parseInt(songData.duration),
                                instrumental: false,
                                plainLyrics: jioLyrics.lyrics.replace(/<br\s*\/?>/gi, '\n'),
                                syncedLyrics: ""
                            };
                        }
                    } catch (e) {
                        console.warn("JioSaavn lyrics fallback failed", e);
                    }
                }

                setLyricsData(lyrics);

                if (currentSong?.id !== id) {
                    const highQualityImage = songData.image[songData.image.length - 1]?.url;
                    const highQualityAudio = songData.downloadUrl[songData.downloadUrl.length - 1]?.url;

                    playSong({
                        id: songData.id,
                        title: songData.name,
                        artist: songData.primaryArtists,
                        image: highQualityImage,
                        url: highQualityAudio,
                        duration: parseInt(songData.duration)
                    });
                }
            }

            setLoading(false);
        };

        init();
    }, [id]);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>;
    }

    if (!song) {
        return <div className="min-h-screen flex items-center justify-center text-white">Song not found</div>;
    }

    return (
        <div className="min-h-screen w-full bg-black text-white relative overflow-hidden flex flex-col md:flex-row">

            {/* Background Image (Blurred & Glass Effect) */}
            {song.image && (
                <div className="absolute inset-0 z-0 select-none pointer-events-none">
                    {/* Dark Overlay for text readability */}
                    <div className="absolute inset-0 bg-black/60 z-10" />
                    {/* Gradient Mesh Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-transparent to-black/80 z-10" />

                    <Image
                        src={song.image[song.image.length - 1]?.url}
                        alt="background"
                        fill
                        className="object-cover blur-[80px] scale-110 opacity-60"
                        priority
                    />
                </div>
            )}

            <div className="relative z-20 w-full flex flex-col md:flex-row p-4 pb-32 md:p-8 md:pb-24 gap-8 justify-center items-center max-w-[1600px] mx-auto h-full min-h-screen">

                {/* Left Column: Album Art */}
                <div className="w-full md:w-1/2 flex flex-col items-center justify-center md:h-[calc(100vh-100px)] md:sticky md:top-0">
                    <div className="relative aspect-square w-full max-w-sm md:max-w-md shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-2xl overflow-hidden border border-white/10 group">
                        {song.image && (
                            <Image
                                src={song.image[song.image.length - 1]?.url}
                                alt={song.name}
                                fill
                                className="object-cover"
                                priority
                            />
                        )}
                        {/* Shimmer effect on hover */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition duration-700 pointer-events-none" />
                    </div>

                    <div className="mt-8 text-center md:text-left w-full max-w-sm md:max-w-md">
                        <h1 className="text-3xl md:text-5xl font-extrabold leading-tight tracking-tight mb-3 drop-shadow-lg">{song.name}</h1>
                        <p className="text-xl md:text-2xl text-zinc-200 font-semibold drop-shadow-md">{song.primaryArtists}</p>
                        <p className="text-sm text-zinc-400 mt-2 uppercase tracking-widest font-medium">{song.album?.name} • {song.year}</p>
                    </div>
                </div>

                {/* Right Column: Lyrics / Related (Glass Panel) */}
                <div className="w-full md:w-1/2 flex flex-col items-center h-full max-h-[calc(100vh-100px)]">
                    <div className="w-full h-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col relative">
                        {/* Decorative top shimmer */}
                        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                        {/* Tab Switcher */}
                        <div className="bg-black/20 flex items-center justify-center p-1 mx-6 mt-6 rounded-xl border border-white/5 mb-2">
                            <button
                                onClick={() => setActiveTab('lyrics')}
                                className={`flex-1 py-2 rounded-lg text-sm font-bold uppercase tracking-wider transition-all duration-300 ${activeTab === 'lyrics' ? 'bg-white/10 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}`}
                            >
                                Lyrics
                            </button>
                            <button
                                onClick={() => setActiveTab('related')}
                                className={`flex-1 py-2 rounded-lg text-sm font-bold uppercase tracking-wider transition-all duration-300 ${activeTab === 'related' ? 'bg-white/10 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}`}
                            >
                                Related
                            </button>
                        </div>

                        <div className="p-6 md:p-8 flex-1 overflow-hidden flex flex-col h-full">
                            {activeTab === 'lyrics' ? (
                                <LyricsContainer
                                    syncedLyrics={lyricsData?.syncedLyrics || ""}
                                    plainLyrics={lyricsData?.plainLyrics}
                                    title={song.name}
                                    artist={song.primaryArtists}
                                    songId={song.id}
                                />
                            ) : (
                                <div className="overflow-y-auto h-full w-full no-scrollbar">
                                    <h3 className="text-zinc-400 text-xs font-bold uppercase mb-4 tracking-wider">Up Next</h3>
                                    <SongList songs={recommendations} />
                                    {recommendations.length === 0 && (
                                        <div className="w-full h-full flex items-center justify-center text-zinc-500">No suggestions available</div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}
