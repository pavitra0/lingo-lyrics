"use client";

import { PlayerProvider } from "@/lib/contexts/PlayerContext";
import { NavigationProvider } from "@/lib/contexts/NavigationContext";

import { ThemeProvider } from "@/lib/contexts/ThemeContext";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider>
            <NavigationProvider>
                <PlayerProvider>
                    {children}
                </PlayerProvider>
            </NavigationProvider>
        </ThemeProvider>
    );
}
