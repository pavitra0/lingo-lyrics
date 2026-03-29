"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type Theme = "dark" | "light" | "terminal" | "rose" | "ocean" | "miami" | "bento" | "serika-dark" | "matrix" | "tokyo-night" | "vaporwave-shrine" | "riverstone-gray" | "city-rain" | "inkstone-blue" | "origami-crane" | "paper-lantern" | "harbor-fog" | "gingko-avenue" | "bamboo-shadow" | "yukata-blue" | "neon-sakura" | "bamboo-mist" | "koi-pond" | "matcha-cream" | "shinkansen-speed" | "calligraphy-ink" | "bento-box" | "konbini-light" | "ramen-steam" | "pearl-wave" | "kendo-strike" | "fuji-sunrise" | "taiko-thunder" | "yakuza-tattoo" | "sakurajima-ash" | "taisho-cafe" | "blooming-ume" | "moonlit-bay" | "mountain-cedar" | "festival-red" | "tea-garden" | "ramune-fizz" | "lantern-blue" | "citrus-shrine" | "yuzu-mist" | "thunder-temple" | "shibuya-nights" | "plum-blossom" | "tokyo-metro" | "zen-stone" | "samurai-steel" | "indigo-shibori" | "tatami-room" | "moss-temple" | "akihabara-glow" | "rice-field-gold" | "shogun-gold" | "sakura-storm" | "sumo-strength" | "izakaya-warm" | "onsen-steam" | "bamboo-forest" | "lavender-fields" | "wisteria-dream" | "ryokan-evening" | "autumn-maple" | "okinawa-sea" | "firefly-field" | "frozen-lake" | "kabuki-drama" | "geisha-grace" | "ghost-parade" | "soda-float" | "tanuki-mischief" | "pixel-retro" | "holographic-idol" | "umbrella-rain" | "starry-tanabata" | "mochi-pastel" | "wind-god" | "street-lantern" | "vending-glow" | "midnight-ramen" | "autumn-temple" | "jpop-energy" | "noh-mask" | "strawberry-daifuku" | "komorebi-green" | "night-market" | "quiet-library" | "sakura-soda" | "storm-lake" | "winter-kimono" | "sake-glass" | "matcha-foam" | "shrine-stone" | "ink-wash" | "plaza-snow" | "tsukiji-morning" | "spring-bamboo" | "sundown-shrine" | "sea-glass" | "koi-glow" | "tsukimi-night" | "gingko-gold" | "coastal-breeze" | "festival-mask" | "torii-sunset";
export type Font = "sans" | "mono" | "comic" | "dyslexic" | "serif";

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    font: Font;
    setFont: (font: Font) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<Theme>("dark");
    const [font, setFontState] = useState<Font>("sans");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const savedTheme = localStorage.getItem("app-theme") as Theme;
        const savedFont = localStorage.getItem("app-font") as Font;

        if (savedTheme) {
            setThemeState(savedTheme);
            applyTheme(savedTheme);
        } else {
            setThemeState("dark");
            applyTheme("dark");
        }

        if (savedFont) {
            setFontState(savedFont);
            applyFont(savedFont);
        } else {
            setFontState("sans");
            applyFont("sans");
        }
    }, []);

    const applyTheme = (newTheme: Theme) => {
        document.documentElement.setAttribute("data-theme", newTheme);

        // Handle legacy classes if they are still used in CSS
        document.documentElement.classList.remove(
            "light-theme", "rose-theme", "ocean-theme", "terminal-theme",
            "miami-theme", "bento-theme", "serika-dark-theme", "matrix-theme", "tokyo-night-theme"
        );

        if (["terminal", "light", "rose", "ocean", "miami", "bento", "serika-dark", "matrix", "tokyo-night"].includes(newTheme)) {
            document.documentElement.classList.add(`${newTheme}-theme`);
        }
    };

    const applyFont = (newFont: Font) => {
        document.documentElement.setAttribute("data-font", newFont);
    };

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
        localStorage.setItem("app-theme", newTheme);
        applyTheme(newTheme);
    };

    const setFont = (newFont: Font) => {
        setFontState(newFont);
        localStorage.setItem("app-font", newFont);
        applyFont(newFont);
    };

    return (
        <ThemeContext.Provider value={{ theme, setTheme, font, setFont }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
}
