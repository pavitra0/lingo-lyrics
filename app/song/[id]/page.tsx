"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getSongById, JioSaavnSong } from "@/lib/api/jiosaavn";
import { getSyncedLyrics, LrcLibSong } from "@/lib/api/lyrics";
import { usePlayer } from "@/lib/contexts/PlayerContext";
import { LyricsContainer } from "@/components/Lyrics/LyricsContainer";
import Image from "next/image";

export default function SongPage() {
    const params = useParams();
    const id = params.id as string;
    const { playSong, currentSong, isPlaying } = usePlayer();
    const [loading, setLoading] = useState(true);
    const [song, setSong] = useState<JioSaavnSong | null>(null);
    const [lyricsData, setLyricsData] = useState<LrcLibSong | null>(null);

    useEffect(() => {
        const init = async () => {
            if (!id) return;

            // Fetch Song Details
            // Note: getSongById needs to be robust.
            // If we came from navigation, currentSong might already be set, but we fetch to be sure of details/lyrics.

            // Wait, if currentSong.id === id, we assume it's loaded?
            // But we still need lyrics.

            let songData = null;
            if (currentSong?.id === id) {
                // It's playing. But we need original object metadata?
                // We can't easily reconstruct JioSaavnSong from Song interface completely, 
                // but we can fecth it or use what we have.
                // Let's fetch to be safe and consistent.
                try {
                    // const data = await getSongById(id);
                    // songData = data;
                    // Actually getSongById(id) currently returns unknown. 
                    // Whatever, let's just use what we have if possible, 
                    // BUT we need Artist/Track string for Lyrics search.
                    // So fetching fresh data is best.
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
                // Determine artist and title
                // songData structure depends on API.
                // Usually: songData.name, songData.primaryArtists
                const title = songData.name;
                // Clean artist name (remove featured artists if needed for better match)
                const artist = songData.primaryArtists?.split(',')[0];

                const lyrics = await getSyncedLyrics(title, artist, songData.album?.name, parseInt(songData.duration));
                setLyricsData(lyrics);

                // If not playing this song, play it
                if (currentSong?.id !== id) {
                    const highQualityImage = songData.image[songData.image.length - 1]?.link;
                    const highQualityAudio = songData.downloadUrl[songData.downloadUrl.length - 1]?.link;

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
        <div className="min-h-screen relative flex flex-col items-center pt-10 pb-32 overflow-hidden bg-gradient-to-b from-purple-900/20 to-black">
            {/* Background Blur */}
            <div className="absolute inset-0 z-0">
                {song.image && (
                    <Image
                        src={song.image[song.image.length - 1]?.link}
                        alt="bg"
                        fill
                        className="object-cover opacity-20 blur-2xl"
                    />
                )}
                <div className="absolute inset-0 bg-black/50" />
            </div>

            <div className="relative z-10 w-full flex flex-col items-center gap-6 px-4">
                {/* Album Art (Small) - or hidden if we want focus on lyrics */}
                {/* Maybe show at top */}
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-white">{song.name}</h1>
                    <p className="text-zinc-400">{song.primaryArtists}</p>
                </div>

                <LyricsContainer
                    syncedLyrics={lyricsData?.syncedLyrics || ""}
                    plainLyrics={lyricsData?.plainLyrics}
                    title={song.name}
                    artist={song.primaryArtists}
                    songId={song.id}
                />
            </div>
        </div>
    );
}
