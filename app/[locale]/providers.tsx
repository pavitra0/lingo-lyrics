"use client";

import { PlayerProvider } from "@/lib/contexts/PlayerContext";
import { NavigationProvider } from "@/lib/contexts/NavigationContext";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <NavigationProvider>
            <PlayerProvider>
                {children}
            </PlayerProvider>
        </NavigationProvider>
    );
}
