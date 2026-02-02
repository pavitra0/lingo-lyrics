import axios from "axios";

const BASE_URL = "https://lrclib.net/api";

export interface LrcLibSong {
    id: number;
    name: string;
    trackName: string;
    artistName: string;
    albumName: string;
    duration: number;
    instrumental: boolean;
    plainLyrics: string;
    syncedLyrics: string; // The LRC content
}

export const getSyncedLyrics = async (trackName: string, artistName: string, albumName?: string, duration?: number) => {
    try {
        const { data } = await axios.get<LrcLibSong>(`${BASE_URL}/get`, {
            params: {
                track_name: trackName,
                artist_name: artistName,
                album_name: albumName,
                duration: duration,
            },
        });
        return data;
    } catch (error) {
        console.warn("Error fetching lyrics from Lrclib:", error);
        return null;
    }
};

export const searchLyrics = async (query: string) => {
    try {
        const { data } = await axios.get<LrcLibSong[]>(`${BASE_URL}/search`, {
            params: { q: query }
        });
        return data;
    } catch (error) {
        console.error("Error searching lyrics:", error);
        return [];
    }
}
