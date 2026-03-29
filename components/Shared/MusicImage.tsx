"use client";

import Image, { ImageProps } from "next/image";
import { useMemo, useState } from "react";
import { Music } from "lucide-react";
import { MUSIC_PLACEHOLDER_SRC, resolveMusicImageSrc } from "@/lib/musicArt";

interface MusicImageProps extends Omit<ImageProps, "src" | "onError"> {
    src?: ImageProps["src"];
    fallbackIconSize?: number;
}

export function MusicImage({ src, alt, fallbackIconSize = 24, className, ...props }: MusicImageProps) {
    const [failedSrc, setFailedSrc] = useState<string | null>(null);
    const resolvedSrc = useMemo(() => normalizeSrc(src), [src]);
    const finalSrc =
        typeof resolvedSrc === "string" && failedSrc === resolvedSrc
            ? MUSIC_PLACEHOLDER_SRC
            : resolvedSrc;

    if (!resolvedSrc) {
        return (
            <div className={`flex items-center justify-center bg-zinc-800 text-zinc-600 ${className}`}>
                <Music size={fallbackIconSize} />
            </div>
        );
    }

    return (
        <Image
            src={finalSrc}
            alt={alt}
            className={className}
            onError={() => {
                if (typeof resolvedSrc === "string" && resolvedSrc !== MUSIC_PLACEHOLDER_SRC) {
                    setFailedSrc(resolvedSrc);
                }
            }}
            {...props}
        />
    );
}

function normalizeSrc(src?: ImageProps["src"]) {
    if (!src) return MUSIC_PLACEHOLDER_SRC;
    if (typeof src !== "string") return src;
    return resolveMusicImageSrc(src) || MUSIC_PLACEHOLDER_SRC;
}
