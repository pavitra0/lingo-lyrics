"use client";

import { PlayerProvider } from "@/lib/contexts/PlayerContext";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <PlayerProvider>
            {children}
        </PlayerProvider>
    );
}
