"use client";

import Image, { ImageProps } from "next/image";
import { useState } from "react";
import { Music } from "lucide-react";

interface MusicImageProps extends Omit<ImageProps, 'onError'> {
    fallbackIconSize?: number;
}

export function MusicImage({ src, alt, fallbackIconSize = 24, className, ...props }: MusicImageProps) {
    const [error, setError] = useState(false);

    if (error || !src) {
        return (
            <div className={`flex items-center justify-center bg-zinc-800 text-zinc-600 ${className}`}>
                <Music size={fallbackIconSize} />
            </div>
        );
    }

    return (
        <Image
            src={src}
            alt={alt}
            className={className}
            onError={() => setError(true)}
            {...props}
        />
    );
}
