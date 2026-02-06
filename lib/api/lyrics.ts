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
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove accents
        .normalize("NFC") // Re-compose to proper characters (Fix for Korean/Hangul)
        .replace(/\(.*\)/g, "") // Remove (...)
        .replace(/\[.*\]/g, "") // Remove [...]
        .replace(/-.*remaster.*/i, "") // Remove "- 2009 Remaster" etc
        .replace(/remaster.*/i, "")
        .replace(/feat\..*/i, "")
        .replace(/ft\..*/i, "")
        .replace(/\s+/g, " ") // Collapse multiple spaces
        .trim();
};

export const getSyncedLyrics = async (trackName: string, artistName: string, albumName?: string, duration?: number) => {
    try {
        if (!trackName || !artistName) return null;

        const cleanTrack = cleanString(trackName);
        let cleanArtist = artistName.split(',')[0].split('&')[0]; // Take first artist
        cleanArtist = cleanString(cleanArtist);

        // Remove trailing dots from track name explicitly as they often cause mismatch in strict search
        const trackStrict = cleanTrack.replace(/\.$/, "");

        console.log(`Fetching lyrics for: ${trackStrict} by ${cleanArtist}`);

        // 0. Try exact match with RAW data (Priority #1: "Fetch with this title")
        try {
            console.log(`Trying exact match with RAW data: ${trackName} by ${artistName}`);
            const { data } = await axios.get<LrcLibSong>(`${BASE_URL}/get`, {
                params: {
                    track_name: trackName,
                    artist_name: artistName,
                },
            });
            return data;
        } catch (e) {
            console.warn("Exact match with raw data failed.");
        }

        // 1. Try exact match with cleaned data
        try {
            const { data } = await axios.get<LrcLibSong>(`${BASE_URL}/get`, {
                params: {
                    track_name: trackStrict,
                    artist_name: cleanArtist,
                },
            });
            return data;
        } catch (e) {
            console.warn("Exact match with cleaned data failed.");
        }

        // 2. Fallback to Search with Cleaned Metadata
        const searchResults = await searchLyrics(`${trackStrict} ${cleanArtist}`);
        if (searchResults && searchResults.length > 0) {
            const bestFit = searchResults.find(s => Math.abs(s.duration - (duration || 0)) < 5) || searchResults[0];
            return bestFit;
        }

        // 3. Fallback: Search with Original Metadata
        if (trackName !== trackStrict || artistName !== cleanArtist) {
            console.log("Cleaned search failed, trying original metadata...");
            const rawSearchResults = await searchLyrics(`${trackName} ${artistName}`);
            if (rawSearchResults && rawSearchResults.length > 0) {
                const bestFit = rawSearchResults.find(s => Math.abs(s.duration - (duration || 0)) < 5) || rawSearchResults[0];
                return bestFit;
            }
        }

        // 4. Final Fallback: Translate Title & Search (User Request: "if doesnt fetch then translate")
        try {
            console.log("Refining search with English translation...");
            const { data: config } = await axios.get('/api/translate', {
                params: {
                    text: trackName,
                    target: 'en',
                    source: 'auto'
                }
            });

            const translatedTitle = config.translation;
            if (translatedTitle && translatedTitle !== trackName) {
                console.log(`Translated title: "${trackName}" -> "${translatedTitle}"`);
                const translatedSearchResults = await searchLyrics(`${translatedTitle} ${artistName}`);
                if (translatedSearchResults && translatedSearchResults.length > 0) {
                    const bestFit = translatedSearchResults.find(s => Math.abs(s.duration - (duration || 0)) < 5) || translatedSearchResults[0];
                    return bestFit;
                }
            }
        } catch (translateError) {
            console.warn("Translation fallback failed:", translateError);
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
