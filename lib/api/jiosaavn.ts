import axios from "axios";

const BASE_URL = "https://jiosavan-api2.vercel.app/api";

export interface JioSaavnSong {
    id: string;
    name: string;
    type: string;
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
        link: string;
    }[];
    downloadUrl: {
        quality: string;
        link: string;
    }[];
}

export interface SearchResponse {
    success: boolean;
    data: {
        total: number;
        start: number;
        results: JioSaavnSong[];
    };
}

export const searchSongs = async (query: string, page = 1, limit = 10) => {
    try {
        const { data } = await axios.get<SearchResponse>(`${BASE_URL}/search/songs`, {
            params: { query, page, limit },
        });
        return data.data.results;
    } catch (error) {
        console.error("Error searching songs:", error);
        return [];
    }
};

export const getSongById = async (id: string) => {
    try {
        const { data } = await axios.get<{ data: JioSaavnSong[] | JioSaavnSong }>(`${BASE_URL}/songs/${id}`);
        if (Array.isArray(data.data)) {
            return data.data[0];
        }
        return data.data;
    } catch (error) {
        console.error("Error fetching song details:", error);
        return null;
    }
};
