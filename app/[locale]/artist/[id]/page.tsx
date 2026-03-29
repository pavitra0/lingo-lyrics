"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getArtistById, JioSaavnArtist } from "@/lib/api/jiosaavn";
import { SongList } from "@/components/Shared/SongList";
import { CheckCircle } from "lucide-react";
import { Link } from "@/i18n/routing";
import { MusicImage } from "@/components/Shared/MusicImage";

export default function ArtistPage() {
    const params = useParams();
    const id = params.id as string;
    const [artist, setArtist] = useState<JioSaavnArtist | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const init = async () => {
            if (id) {
                const data = await getArtistById(id);
                setArtist(data);
            }
            setLoading(false);
        };
        init();
    }, [id]);

    if (loading) return <div className="p-8 text-foreground">Loading...</div>;
    if (!artist) return <div className="p-8 text-foreground">Artist not found</div>;

    const coverImage = artist.image[artist.image.length - 1]?.url;

    return (
        <div className="flex flex-col w-full min-h-screen bg-background text-foreground p-4 md:p-8 pb-32">
            {/* Header */}
            <div className="flex flex-col items-center mb-12">
                <div className="relative h-48 w-48 rounded-full overflow-hidden mb-6 shadow-2xl border-4 border-zinc-800">
                    <MusicImage src={coverImage} alt={artist.name} fill className="object-cover" sizes="192px" fallbackIconSize={44} />
                </div>
                <div className="flex items-center gap-2 mb-2">
                    <h1 className="text-4xl md:text-5xl font-bold">{artist.name}</h1>
                    {artist.isVerified && <CheckCircle className="text-blue-500" fill="currentColor" size={24} />}
                </div>
                <p className="text-zinc-500 dark:text-zinc-400">{Number(artist.followerCount).toLocaleString()} Followers • {artist.dominantType}</p>
            </div>

            {/* Top Songs */}
            <div className="w-full max-w-4xl mx-auto mb-12">
                <h2 className="text-2xl font-bold mb-6">Top Songs</h2>
                <SongList songs={artist.topSongs} />
            </div>

            {/* Top Albums */}
            {artist.topAlbums && artist.topAlbums.length > 0 && (
                <div className="w-full max-w-4xl mx-auto">
                    <h2 className="text-2xl font-bold mb-6">Top Albums</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {artist.topAlbums.map((album) => (
                            <Link href={`/album/${album.id}`} key={album.id} className="group block">
                                <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-surface mb-3 shadow-lg">
                                    <MusicImage
                                        src={album.image[album.image.length - 1]?.url}
                                        alt={album.name}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                                        sizes="(max-width: 768px) 46vw, (max-width: 1024px) 30vw, 16rem"
                                        fallbackIconSize={28}
                                    />
                                    <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition" />
                                </div>
                                <h3 className="font-medium truncate text-foreground group-hover:text-purple-500 dark:group-hover:text-purple-400 transition">{album.name}</h3>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{album.year} • Album</p>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
