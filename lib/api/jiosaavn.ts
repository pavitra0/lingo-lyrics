export const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://jiosavan-api2.vercel.app/api";

export interface JioSaavnSong {
    id: string;
    name: string;
    type: string;
    artistId?: string; // Added for navigation
    album: {
        id: string;
        name: string;
        url: string;
    };
    year: string;
    releaseDate: string;
    duration: string;
    label: string;
    primaryArtists: string;
    featuredArtists: string;
    explicitContent: string;
    playCount: string;
    language: string;
    hasLyrics: string;
    url: string;
    copyright: string;
    image: {
        quality: string;
        url: string;
    }[];
    downloadUrl: {
        quality: string;
        url: string;
    }[];
}

export interface JioSaavnAlbum {
    id: string;
    name: string;
    year: string;
    type: string;
    playCount: string;
    language: string;
    explicitContent: string;
    primaryArtists: string;
    songCount: string;
    releaseDate: string;
    image: { quality: string; url: string }[];
    songs: JioSaavnSong[];
}

export interface JioSaavnPlaylist {
    id: string;
    name: string;
    description: string;
    year: string;
    type: string;
    playCount: string;
    language: string;
    explicitContent: string;
    songCount: string;
    username: string;
    image: { quality: string; url: string }[];
    songs: JioSaavnSong[];
}

export interface JioSaavnArtist {
    id: string;
    name: string;
    url: string;
    role: string;
    type: string;
    image: { quality: string; url: string }[];
    followerCount: string;
    isVerified: boolean;
    dominantLanguage: string;
    dominantType: string;
    topSongs: JioSaavnSong[];
    topAlbums: JioSaavnAlbum[];
    singles: JioSaavnSong[];
    similarArtists: { id: string; name: string; image: { quality: string; url: string }[] }[];
}

export interface SearchResponse<T> {
    success: boolean;
    data: {
        total: number;
        start: number;
        results: T[];
    };
}

// Helper to normalize song data
const formatSong = (song: any): JioSaavnSong => {
    if (!song) return song;

    // Map complex artists object to flat string if needed

    // Map complex artists object to flat string if needed
    // Map complex artists object to flat string if needed
    if (song.artists) {
        if (song.artists.primary) {
            song.primaryArtists = song.artists.primary.map((a: any) => a.name).join(', ');
            // Extract primary artist ID for linking
            if (song.artists.primary.length > 0) {
                song.artistId = song.artists.primary[0].id;
            }
        }
        if (song.artists.featured) {
            song.featuredArtists = song.artists.featured.map((a: any) => a.name).join(', ');
        }
    }


    // Ensure image is array (API sometimes returns string or complex obj?)
    // The current interface says { quality: string, url: string }[] but let's just leave it 
    // as the API returns it, usually it's correct enough or we handle it in context.

    return song as JioSaavnSong;
};

export const searchSongs = async (query: string, limit = 30) => {
    try {
        const response = await fetch(`${API_URL}/search/songs?query=${query}&limit=${limit}`);
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Failed to Fetch Song Data');
        }
        return (data.data.results as any[]).map(formatSong);
    }
    catch (error) {
        console.log('API Error: ', error);
        throw error;
    }
};

export const searchAlbums = async (query: string, limit = 30) => {
    try {
        const response = await fetch(`${API_URL}/search/albums?query=${query}&limit=${limit}`);
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Failed to fetch Album data');
        }
        return data.data.results as JioSaavnAlbum[];
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
};

export const searchArtists = async (query: string, limit = 30) => {
    try {
        const response = await fetch(`${API_URL}/search/artists?query=${query}&limit=${limit}`);
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Failed to Fetch Artist Data');
        }
        return data.data.results as JioSaavnArtist[];
    }
    catch (error) {
        console.log('API Error: ', error);
        throw error;
    }
};

export const searchPlaylists = async (query: string, limit = 30) => {
    try {
        const response = await fetch(`${API_URL}/search/playlists?query=${query}&limit=${limit}`);
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Failed to Fetch Playlist Data');
        }
        return data.data.results as JioSaavnPlaylist[];
    }
    catch (error) {
        console.log('API Error: ', error);
        throw error;
    }
};

export const getSongById = async (id: string) => {
    try {
        const response = await fetch(`${API_URL}/songs/${id}`);
        const data = await response.json();
        if (!response.ok) {
            throw new Error(`Failed to fetch song: ${response.status} ${response.statusText}`);
        }

        let songData: any;
        if (Array.isArray(data.data)) {
            songData = data.data[0];
        } else {
            songData = data.data;
        }

        return formatSong(songData);
    } catch (error) {
        console.error("Error fetching song:", error);
        throw error;
    }
};

export const getAlbumById = async (id: string) => {
    try {
        const response = await fetch(`${API_URL}/albums?id=${id}&limit=30`);
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Failed to Fetch Album Data');
        }
        // Normalize songs in album if needed, though album usually has flat structure.
        // Let's assume album songs are fine or we can verify.
        if (data.data && Array.isArray(data.data.songs)) {
            data.data.songs = data.data.songs.map(formatSong);
        }
        return data.data as JioSaavnAlbum;
    }
    catch (error) {
        console.log('API Error: ', error);
        throw error;
    }
};

export const getArtistById = async (id: string) => {
    try {
        const response = await fetch(`${API_URL}/artists?id=${id}`);
        const text = await response.text();
        const data = JSON.parse(text);
        if (!response.ok) {
            throw new Error(data.message || 'Failed to Fetch Artist Data');
        }
        // Normalize top songs
        if (data.data && Array.isArray(data.data.topSongs)) {
            data.data.topSongs = data.data.topSongs.map(formatSong);
        }
        return data.data as JioSaavnArtist;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
};

export const getPlaylistById = async (id: string) => {
    try {
        const response = await fetch(`${API_URL}/playlists?id=${id}&limit=40`);
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Failed to Fetch Playlist Data');
        }
        // Normalize songs in playlist
        if (data.data && Array.isArray(data.data.songs)) {
            data.data.songs = data.data.songs.map(formatSong);
        }
        return data.data as JioSaavnPlaylist;
    }
    catch (error) {
        console.log('API Error: ', error);
        throw error;
    }
};

export const getSongRecommendations = async (id: string) => {
    try {
        // Mapped from user's getSuggestionSong
        const response = await fetch(`${API_URL}/songs/${id}/suggestions?limit=30`);
        const data = await response.json();
        console.log("Suggestions API Response:", data); // DEBUG
        if (!response.ok) {
            throw new Error(data.message || 'Failed to Fetch Recommendations');
        }
        return (data.data as any[]).map(formatSong);
    }
    catch (error) {
        console.log('API Error: ', error);
        throw error;
    }
};

export const getLyrics = async (id: string) => {
    try {
        const response = await fetch(`${API_URL}/songs/${id}/lyrics`);
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Failed to Fetch Lyrics');
        }
        return data.data; // Type might need refinement if structure is known
    }
    catch (error) {
        console.log('API Error: ', error);
        throw error;
    }
}

export const getHomeModules = async () => {
    try {
        const response = await fetch(`${API_URL}/modules?language=hindi,english`);
        const data = await response.json();
        return data.data;
    } catch (error) {
        console.error("Error fetching home modules, using fallback:", error);
        try {
            const [trendingSongs, trendingAlbums, newAlbums] = await Promise.all([
                searchSongs("Top 50 Hindi"),
                searchAlbums("Top 50"),
                searchAlbums("New Releases")
            ]);

            return {
                trending: {
                    songs: trendingSongs,
                    albums: trendingAlbums
                },
                albums: newAlbums,
                charts: []
            };
        } catch (fallbackError) {
            console.error("Fallback failed:", fallbackError);
            return null;
        }
    }
}

