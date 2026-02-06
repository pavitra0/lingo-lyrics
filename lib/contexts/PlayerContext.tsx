"use client";

import React, { createContext, useContext, useState, useRef, useEffect, ReactNode, useCallback } from "react";
import { getSongRecommendations, JioSaavnSong } from "@/lib/api/jiosaavn";

export interface Song {
    id: string;
    title: string;
    artist: string;
    album?: string;
    image: string;
    url: string; // Preview URL or Full URL
    duration?: number;
    artistId?: string;
    language?: string;
}

interface PlayerContextType {
    currentSong: Song | null;
    isPlaying: boolean;
    playSong: (song: Song) => void;
    pauseSong: () => void;
    togglePlay: () => void;
    audioRef: React.RefObject<HTMLAudioElement | null>;
    progress: number;
    duration: number;
    volume: number;
    setVolume: (volume: number) => void;
    seek: (time: number) => void;
    isLoading: boolean;
    // Queue
    queue: Song[];
    addToQueue: (song: Song) => void;
    setQueue: (songs: Song[]) => void;
    playNext: () => void;
    playPrevious: () => void;
    shuffle: boolean;
    toggleShuffle: () => void;
    repeat: 'none' | 'one' | 'all';
    toggleRepeat: () => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: ReactNode }) {
    const [currentSong, setCurrentSong] = useState<Song | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isLoading, setIsLoading] = useState(false);

    // Queue State
    const [queue, setQueueState] = useState<Song[]>([]);
    const [history, setHistory] = useState<Song[]>([]);
    const [shuffle, setShuffle] = useState(false);
    const [repeat, setRepeat] = useState<'none' | 'one' | 'all'>('none');

    const audioRef = useRef<HTMLAudioElement>(null);

    // Helper to map API languages to ISO codes
    const getLanguageCode = (lang: string): string => {
        console.log("Detecting Language for:", lang); // DEBUG
        const map: Record<string, string> = {
            "hindi": "hi",
            "english": "en",
            "punjabi": "pa",
            "tamil": "ta",
            "telugu": "te",
            "marathi": "mr",
            "gujarati": "gu",
            "bengali": "bn",
            "kannada": "kn",
            "bhojpuri": "bho",
            "malayalam": "ml",
            "urdu": "ur",
            "haryanvi": "hi", // Close enough fallback
            "rajasthani": "hi", // Close enough fallback
            "odia": "or",
            "assamese": "as"
        };
        return map[lang?.toLowerCase()] || "en";
    };

    const playSong = (song: any) => {
        // Normalize raw API data to our Song interface
        console.log("Raw Song Data in playSong:", song); // DEBUG
        const normalizedSong: Song = {
            id: song.id,
            title: song.title || song.name || "Unknown Title", // Handle 'name' vs 'title'
            artist: song.artist || "", // Will resolve below
            album: song.album?.name || song.album || "Unknown Album",
            image: "", // Will resolve below
            url: song.url || "",
            duration: typeof song.duration === 'string' ? parseInt(song.duration) : song.duration,
            artistId: song.artistId || song.artists?.primary?.[0]?.id || undefined,
            language: getLanguageCode(song.language),
        };

        // 1. Resolve Artist
        if (song.artists?.primary?.[0]?.name) {
            normalizedSong.artist = song.artists.primary[0].name;
        }
        else if (!normalizedSong.artist) {
            if (song.primaryArtists) normalizedSong.artist = song.primaryArtists;
            else if (song.primary_artists) normalizedSong.artist = song.primary_artists;
            else if (song.subtitle) normalizedSong.artist = song.subtitle;
            else if (song.description) normalizedSong.artist = song.description;
            else if (Array.isArray(song.artist)) normalizedSong.artist = song.artist[0];
        }

        // Final cleanup for artist
        if (Array.isArray(normalizedSong.artist)) {
            normalizedSong.artist = normalizedSong.artist[0];
        }
        if (typeof normalizedSong.artist !== 'string') {
            normalizedSong.artist = String(normalizedSong.artist || "");
        }

        // 2. Resolve Image (JioSaavn returns array, we need string)
        if (Array.isArray(song.image) && song.image.length > 0) {
            // Take the last one (usually highest quality) or first
            normalizedSong.image = song.image[song.image.length - 1].link || song.image[song.image.length - 1].url || "";
        } else if (typeof song.image === 'string') {
            normalizedSong.image = song.image;
        }

        console.log("Normalized Song for Player:", normalizedSong);

        setCurrentSong(normalizedSong);
        setIsPlaying(true);

        // Add to history
        const newHistory = [normalizedSong, ...history.filter(s => s.id !== normalizedSong.id)].slice(0, 50);
        setHistory(newHistory);
        localStorage.setItem("playedSongs", JSON.stringify(newHistory));

        if (!queue.find(s => s.id === normalizedSong.id)) {
            setQueueState([normalizedSong]);
            getSongRecommendations(normalizedSong.id).then(recs => {
                // ... logic remains similar but we should probably normalize recs too if needed, 
                // but existing logic manually maps recs so it might be fine.
                // For now let's keep the existing recommendation logic but using normalizedSong.id
                if (recs && recs.length > 0) {
                    const mappedRecs = recs.map(item => {
                        const highQualityImage = item.image[item.image.length - 1]?.url;
                        const highQualityAudio = item.downloadUrl[item.downloadUrl.length - 1]?.url;
                        return {
                            id: item.id,
                            title: item.name,
                            artist: item.primaryArtists,
                            image: highQualityImage || "",
                            url: highQualityAudio || "",
                            duration: parseInt(item.duration),
                            language: getLanguageCode(item.language),
                        };
                    });
                    setQueueState(prev => [...prev, ...mappedRecs]);
                }
            });
        }
    };

    // Load history & Last Played Song on mount
    useEffect(() => {
        const savedHistory = localStorage.getItem("playedSongs");
        if (savedHistory) {
            try {
                setHistory(JSON.parse(savedHistory));
            } catch (e) { console.error("Failed to parse history", e); }
        }

        const lastSong = localStorage.getItem("lastPlayedSong");
        if (lastSong) {
            try {
                const song = JSON.parse(lastSong);
                setCurrentSong(song);
                // Don't auto-play
                setIsPlaying(false);
            } catch (e) { console.error("Failed to parse last song", e); }
        }
    }, []);

    // Persist Current Song
    useEffect(() => {
        if (currentSong) {
            localStorage.setItem("lastPlayedSong", JSON.stringify(currentSong));
        }
    }, [currentSong]);

    const addToQueue = (song: Song) => {
        setQueueState(prev => [...prev, song]);
    };

    const setQueue = (songs: Song[]) => {
        setQueueState(songs);
    };

    const pauseSong = () => {
        setIsPlaying(false);
    };

    const togglePlay = () => {
        if (isPlaying) pauseSong();
        else setIsPlaying(true);
    };

    const seek = (time: number) => {
        if (audioRef.current) {
            audioRef.current.currentTime = time;
            setProgress(time);
        }
    };

    const playNext = useCallback(() => {
        if (!currentSong) return;

        if (repeat === 'one') {
            seek(0);
            audioRef.current?.play();
            return;
        }

        const currentIndex = queue.findIndex(s => s.id === currentSong.id);

        if (shuffle) {
            const nextIndex = Math.floor(Math.random() * queue.length);
            setCurrentSong(queue[nextIndex]);
        } else {
            if (currentIndex !== -1 && currentIndex < queue.length - 1) {
                setCurrentSong(queue[currentIndex + 1]);
            } else if (repeat === 'all') {
                setCurrentSong(queue[0]);
            } else {
                // End of queue
                setIsPlaying(false);
            }
        }
    }, [currentSong, queue, repeat, shuffle]);

    const playPrevious = useCallback(() => {
        if (!currentSong) return;
        const currentIndex = queue.findIndex(s => s.id === currentSong.id);

        // If > 3 seconds, replay current
        if (audioRef.current && audioRef.current.currentTime > 3) {
            seek(0);
            return;
        }

        if (currentIndex > 0) {
            setCurrentSong(queue[currentIndex - 1]);
        }
    }, [currentSong, queue]);

    const toggleShuffle = () => setShuffle(!shuffle);
    const toggleRepeat = () => {
        if (repeat === 'none') setRepeat('all');
        else if (repeat === 'all') setRepeat('one');
        else setRepeat('none');
    };

    useEffect(() => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.play().catch(e => console.error("Playback failed", e));
            } else {
                audioRef.current.pause();
            }
        }
    }, [isPlaying, currentSong]);


    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const updateProgress = () => setProgress(audio.currentTime);
        const updateDuration = () => setDuration(audio.duration || 0);
        const handleEnded = () => {
            playNext();
        };
        const handleError = (e: any) => {
            console.error("Audio playback error:", e);
            setIsLoading(false);
            // Auto skip if error
            if (queue.length > 0) {
                setTimeout(() => playNext(), 1000);
            } else {
                setIsPlaying(false);
            }
        };
        const handleWaiting = () => setIsLoading(true);
        const handleCanPlay = () => setIsLoading(false);
        const handlePlaying = () => {
            setIsLoading(false);
            setIsPlaying(true);
        };

        audio.addEventListener('timeupdate', updateProgress);
        audio.addEventListener('loadedmetadata', updateDuration);
        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('error', handleError);
        audio.addEventListener('waiting', handleWaiting);
        audio.addEventListener('canplay', handleCanPlay);
        audio.addEventListener('playing', handlePlaying);

        return () => {
            audio.removeEventListener('timeupdate', updateProgress);
            audio.removeEventListener('loadedmetadata', updateDuration);
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('error', handleError);
            audio.removeEventListener('waiting', handleWaiting);
            audio.removeEventListener('canplay', handleCanPlay);
            audio.removeEventListener('playing', handlePlaying);
        }
    }, [playNext, queue]); // Depend on queue for auto-skip logic

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
        }
    }, [volume]);

    // Media Session API
    useEffect(() => {
        if ("mediaSession" in navigator && currentSong) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: currentSong.title,
                artist: currentSong.artist,
                album: currentSong.album || "LingoLyrics",
                artwork: [
                    { src: currentSong.image, sizes: "512x512", type: "image/jpeg" },
                    { src: currentSong.image, sizes: "96x96", type: "image/jpeg" },
                ],
            });

            navigator.mediaSession.setActionHandler("play", () => {
                togglePlay();
            });
            navigator.mediaSession.setActionHandler("pause", () => {
                togglePlay();
            });
            navigator.mediaSession.setActionHandler("previoustrack", () => {
                playPrevious();
            });
            navigator.mediaSession.setActionHandler("nexttrack", () => {
                playNext();
            });
        }
    }, [currentSong, togglePlay, playPrevious, playNext]);

    return (
        <PlayerContext.Provider
            value={{
                currentSong,
                isPlaying,
                playSong,
                pauseSong,
                togglePlay,
                audioRef,
                progress,
                duration,
                volume,
                setVolume,
                seek,
                queue,
                addToQueue,
                setQueue,
                playNext,
                playPrevious,
                shuffle,
                toggleShuffle,
                repeat,
                toggleRepeat,
                isLoading
            }}
        >
            <audio ref={audioRef} src={currentSong?.url} className="hidden" />
            {children}
        </PlayerContext.Provider>
    );
}

export function usePlayer() {
    const context = useContext(PlayerContext);
    if (context === undefined) {
        throw new Error("usePlayer must be used within a PlayerProvider");
    }
    return context;
}
