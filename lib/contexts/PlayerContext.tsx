"use client";

import React, { createContext, useContext, useState, useRef, useEffect, ReactNode, useCallback } from "react";
import { getSongById, getSongRecommendations, JioSaavnSong } from "@/lib/api/jiosaavn";

export interface SongArtist {
    id?: string;
    name: string;
}

export interface Song {
    id: string;
    title: string;
    artist: string;
    album?: string;
    image: string;
    url: string; // Preview URL or Full URL
    duration?: number;
    artistId?: string;
    artistLinks?: SongArtist[];
    language?: string;
}

type PlayableSongInput = {
    id: string;
    title?: string;
    name?: string;
    artist?: string | string[];
    album?: string | { name?: string };
    image?: string | Array<{ link?: string; url?: string }>;
    url?: string;
    duration?: string | number;
    artistId?: string;
    artistLinks?: SongArtist[];
    artists?: JioSaavnSong["artists"];
    primaryArtists?: string;
    primary_artists?: string;
    subtitle?: string;
    description?: string;
    downloadUrl?: Array<{ link?: string; url?: string }>;
    language?: string;
};

interface PlayerContextType {
    currentSong: Song | null;
    isPlaying: boolean;
    playSong: (song: PlayableSongInput) => void;
    pauseSong: () => void;
    togglePlay: () => void;
    audioRef: React.RefObject<HTMLAudioElement | null>;
    progress: number;
    duration: number;
    volume: number;
    setVolume: (volume: number) => void;
    seek: (time: number) => void;
    isLoading: boolean;
    suggestions: Song[];
    // Queue
    queue: Song[];
    addToQueue: (song: PlayableSongInput) => void;
    setQueue: (songs: PlayableSongInput[]) => void;
    playNext: () => void;
    playPrevious: () => void;
    shuffle: boolean;
    toggleShuffle: () => void;
    repeat: 'none' | 'one' | 'all';
    toggleRepeat: () => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

const readStoredHistory = (): Song[] => {
    if (typeof window === "undefined") return [];

    const savedHistory = window.localStorage.getItem("playedSongs");
    if (!savedHistory) return [];

    try {
        return JSON.parse(savedHistory) as Song[];
    } catch (error) {
        console.error("Failed to parse history", error);
        return [];
    }
};

const readStoredLastSong = (): Song | null => {
    if (typeof window === "undefined") return null;

    const lastSong = window.localStorage.getItem("lastPlayedSong");
    if (!lastSong) return null;

    try {
        return JSON.parse(lastSong) as Song;
    } catch (error) {
        console.error("Failed to parse last song", error);
        return null;
    }
};

export function PlayerProvider({ children }: { children: ReactNode }) {
    const [currentSong, setCurrentSong] = useState<Song | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [suggestions, setSuggestions] = useState<Song[]>([]);

    // Queue State
    const [queue, setQueueState] = useState<Song[]>([]);
    const [history, setHistory] = useState<Song[]>([]);
    const [shuffle, setShuffle] = useState(false);
    const [repeat, setRepeat] = useState<'none' | 'one' | 'all'>('none');

    const audioRef = useRef<HTMLAudioElement>(null);
    const playRequestRef = useRef(0);

    // Hydration: Load initial state from localStorage on mount
    useEffect(() => {
        const frameId = window.requestAnimationFrame(() => {
            const lastSong = readStoredLastSong();
            if (lastSong) {
                setCurrentSong(lastSong);
            }

            const storedHistory = readStoredHistory();
            if (storedHistory.length > 0) {
                setHistory(storedHistory);
            }
        });

        return () => {
            window.cancelAnimationFrame(frameId);
        };
    }, []);

    // Helper to map API languages to ISO codes
    const getLanguageCode = useCallback((lang: string): string => {
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
    }, []);

    const buildArtistLinks = useCallback((song: PlayableSongInput): SongArtist[] => {
        if (song.artistLinks?.length) {
            return song.artistLinks
                .map((artist) => ({ id: artist.id, name: artist.name.trim() }))
                .filter((artist) => artist.name.length > 0);
        }

        if (song.artists?.primary?.length) {
            return song.artists.primary
                .map((artist) => ({ id: artist.id, name: artist.name?.trim() || "" }))
                .filter((artist) => artist.name.length > 0);
        }

        const artistValue = Array.isArray(song.artist)
            ? song.artist.join(", ")
            : song.artist || song.primaryArtists || song.primary_artists || song.subtitle || song.description || "";

        return artistValue
            .split(",")
            .map((artist) => artist.trim())
            .filter(Boolean)
            .map((name, index) => ({ name, id: index === 0 ? song.artistId : undefined }));
    }, []);

    const getImageSrc = useCallback((image: PlayableSongInput["image"]) => {
        if (Array.isArray(image) && image.length > 0) {
            const bestImage = image[image.length - 1];
            return bestImage.link || bestImage.url || "";
        }

        return typeof image === "string" ? image : "";
    }, []);

    const getAudioSrc = useCallback((song: PlayableSongInput) => {
        if (Array.isArray(song.downloadUrl) && song.downloadUrl.length > 0) {
            const bestAudio = song.downloadUrl[song.downloadUrl.length - 1];
            return bestAudio.link || bestAudio.url || song.url || "";
        }

        return song.url || "";
    }, []);

    const normalizeSong = useCallback((song: PlayableSongInput): Song => {
        const artistLinks = buildArtistLinks(song);
        const artistName = artistLinks.length > 0
            ? artistLinks.map((artist) => artist.name).join(", ")
            : "Unknown Artist";
        const parsedDuration = typeof song.duration === "string" ? parseInt(song.duration, 10) : song.duration;

        return {
            id: song.id,
            title: song.title || song.name || "Unknown Title",
            artist: artistName,
            album: typeof song.album === "string" ? song.album : song.album?.name || "Unknown Album",
            image: getImageSrc(song.image),
            url: getAudioSrc(song),
            duration: Number.isFinite(parsedDuration) ? parsedDuration : undefined,
            artistId: artistLinks.find((artist) => artist.id)?.id || song.artistId,
            artistLinks: artistLinks.length > 0 ? artistLinks : undefined,
            language: getLanguageCode(song.language || ""),
        };
    }, [buildArtistLinks, getAudioSrc, getImageSrc, getLanguageCode]);

    const isLikelyPageUrl = (url: string) => {
        try {
            const parsedUrl = new URL(url);
            return parsedUrl.hostname === "jiosaavn.com" || parsedUrl.hostname === "www.jiosaavn.com";
        } catch {
            return false;
        }
    };

    const shouldRepairAudioSource = (song: PlayableSongInput, normalizedSong: Song) => {
        const alreadyHasDownloadUrl = Array.isArray(song.downloadUrl) && song.downloadUrl.length > 0;
        return !alreadyHasDownloadUrl && (!normalizedSong.url || isLikelyPageUrl(normalizedSong.url));
    };

    const startNormalizedSong = (normalizedSong: Song) => {
        setCurrentSong(normalizedSong);
        setIsPlaying(true);
        setSuggestions([]);

        // Add to history
        const newHistory = [normalizedSong, ...history.filter(s => s.id !== normalizedSong.id)].slice(0, 50);
        setHistory(newHistory);
        localStorage.setItem("playedSongs", JSON.stringify(newHistory));

        if (!queue.find(s => s.id === normalizedSong.id)) {
            setQueueState([normalizedSong]);
        }
    };

    const playSong = (song: PlayableSongInput) => {
        const requestId = playRequestRef.current + 1;
        playRequestRef.current = requestId;

        const normalizedSong = normalizeSong(song);

        if (shouldRepairAudioSource(song, normalizedSong)) {
            void getSongById(normalizedSong.id)
                .then((freshSong) => {
                    if (playRequestRef.current !== requestId) return;
                    startNormalizedSong(normalizeSong(freshSong));
                })
                .catch((error) => {
                    console.error("Failed to repair audio URL", error);
                    if (playRequestRef.current === requestId) {
                        startNormalizedSong(normalizedSong);
                    }
                });
            return;
        }

        startNormalizedSong(normalizedSong);
    };

    // Persist Current Song
    useEffect(() => {
        if (currentSong) {
            localStorage.setItem("lastPlayedSong", JSON.stringify(currentSong));
        }
    }, [currentSong]);

    useEffect(() => {
        if (!currentSong) {
            return;
        }

        let cancelled = false;

        const loadSuggestions = async () => {
            try {
                const recs = await getSongRecommendations(currentSong.id);
                if (cancelled) return;

                const mappedRecs = recs
                    .map(normalizeSong)
                    .filter((song) => song.id !== currentSong.id);

                setSuggestions(mappedRecs);

                setQueueState((prev) => {
                    if (prev.length <= 1 && prev[0]?.id === currentSong.id) {
                        return [prev[0], ...mappedRecs];
                    }

                    return prev;
                });
            } catch (error) {
                console.error("Failed to fetch player suggestions", error);
                if (!cancelled) {
                    setSuggestions([]);
                }
            }
        };

        void loadSuggestions();

        return () => {
            cancelled = true;
        };
    }, [currentSong, normalizeSong]);

    const addToQueue = (song: PlayableSongInput) => {
        setQueueState(prev => [...prev, normalizeSong(song)]);
    };

    const setQueue = (songs: PlayableSongInput[]) => {
        setQueueState(songs.map(normalizeSong));
    };

    const pauseSong = useCallback(() => {
        setIsPlaying(false);
    }, []);

    const togglePlay = useCallback(() => {
        setIsPlaying((playing) => !playing);
    }, []);

    const seek = useCallback((time: number) => {
        if (audioRef.current) {
            audioRef.current.currentTime = time;
            setProgress(time);
        }
    }, []);

    const playNext = useCallback(() => {
        if (!currentSong) return;

        if (repeat === 'one') {
            seek(0);
            if (isPlaying) {
                void audioRef.current?.play();
            }
            return;
        }

        if (queue.length === 0) {
            setIsPlaying(false);
            return;
        }

        const currentIndex = queue.findIndex(s => s.id === currentSong.id);
        if (currentIndex === -1) {
            setIsPlaying(false);
            return;
        }

        if (shuffle) {
            const playableQueue = queue.length > 1 ? queue.filter((song) => song.id !== currentSong.id) : queue;
            const nextSong = playableQueue[Math.floor(Math.random() * playableQueue.length)];
            if (nextSong) {
                setCurrentSong(nextSong);
            }
        } else {
            if (currentIndex < queue.length - 1) {
                setCurrentSong(queue[currentIndex + 1]);
            } else if (repeat === 'all') {
                setCurrentSong(queue[0]);
            } else {
                // End of queue
                setIsPlaying(false);
            }
        }
    }, [currentSong, isPlaying, queue, repeat, seek, shuffle]);

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
    }, [currentSong, queue, seek]);

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
        const handleError = (event: Event) => {
            console.error("Audio playback error:", event);
            setIsLoading(false);
            setIsPlaying(false);
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
    }, [playNext]);

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
                suggestions,
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
