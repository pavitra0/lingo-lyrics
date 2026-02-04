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

const cleanString = (str: string) => {
    if (!str) return "";
    return str
        .replace(/\(.*\)/g, "") // Remove (...)
        .replace(/\[.*\]/g, "") // Remove [...]
        .replace(/-.*remaster.*/i, "") // Remove "- 2009 Remaster" etc
        .replace(/remaster.*/i, "")
        .replace(/feat\..*/i, "")
        .replace(/ft\..*/i, "")
        .trim();
};

export const getSyncedLyrics = async (trackName: string, artistName: string, albumName?: string, duration?: number) => {
    try {
        if (!trackName || !artistName) return null;

        const cleanTrack = cleanString(trackName);
        const cleanArtist = artistName.split(',')[0].split('&')[0].trim(); // Take first artist, split by , and &

        console.log(`Fetching lyrics for: ${cleanTrack} by ${cleanArtist}`);

        // 1. Try exact match with cleaned data (using Axios params, which handles encoding)
        try {
            // User reference suggests: artist_name & track_name ONLY. 
            // We'll try that first as it might be more lenient than including duration/album.
            const { data } = await axios.get<LrcLibSong>(`${BASE_URL}/get`, {
                params: {
                    track_name: cleanTrack,
                    artist_name: cleanArtist,
                    // duration: duration, // Removing duration based on user suggestion to rely on name strictness
                },
            });
            return data;
        } catch (e) {
            console.warn("Exact match failed, trying search...");
        }

        // 2. Fallback to Search
        const searchResults = await searchLyrics(`${cleanTrack} ${cleanArtist}`);
        if (searchResults && searchResults.length > 0) {
            // Find best fit (closest duration)
            const bestFit = searchResults.find(s => Math.abs(s.duration - (duration || 0)) < 5) || searchResults[0];
            return bestFit;
        }

        return null;
    } catch (error) {
        console.warn(`Error fetching lyrics for ${trackName} by ${artistName} from Lrclib:`, error);
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
