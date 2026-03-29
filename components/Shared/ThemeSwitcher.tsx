"use client";

import { useTheme, Theme, Font } from "@/lib/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import { Palette, Moon, Sun, Terminal, Droplets, Heart, Sunset, LayoutGrid, Coffee, Binary, Sparkles, Type, Check, Search, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export default function ThemeSwitcher() {
    const { theme, setTheme, font, setFont } = useTheme();
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const themes: { id: Theme; label: string; icon: React.ReactNode; color: string }[] = [
        { id: "dark", label: "Dark", icon: <Moon size={14} />, color: "bg-black border border-zinc-600" },
        { id: "light", label: "Light", icon: <Sun size={14} />, color: "bg-white border border-zinc-300" },
        { id: "terminal", label: "Terminal", icon: <Terminal size={14} />, color: "bg-black border border-white" },
        { id: "rose", label: "Rose", icon: <Heart size={14} />, color: "bg-[#f43f5e] border border-transparent" },
        { id: "ocean", label: "Ocean", icon: <Droplets size={14} />, color: "bg-[#0284c7] border border-transparent" },
        { id: "miami", label: "Miami", icon: <Sunset size={14} />, color: "bg-[#f38f9b] border border-transparent" },
        { id: "bento", label: "Bento", icon: <LayoutGrid size={14} />, color: "bg-[#2d394d] border border-transparent" },
        { id: "serika-dark", label: "Serika Dark", icon: <Coffee size={14} />, color: "bg-[#323437] border border-[#e2b714]" },
        { id: "matrix", label: "Matrix", icon: <Binary size={14} />, color: "bg-black border border-[#00ff41]" },
        { id: "tokyo-night", label: "Tokyo Night", icon: <Sparkles size={14} />, color: "bg-[#1a1b26] border border-[#7aa2f7]" },
        { id: "vaporwave-shrine", label: "Vaporwave Shrine", icon: <Palette size={14} />, color: "bg-[oklch(17.0%_0.072_305.0_/_1)] border border-transparent" },
        { id: "riverstone-gray", label: "Riverstone Gray", icon: <Palette size={14} />, color: "bg-[oklch(20.0%_0.010_260.0_/_1)] border border-transparent" },
        { id: "city-rain", label: "City Rain", icon: <Palette size={14} />, color: "bg-[oklch(16.0%_0.030_260.0_/_1)] border border-transparent" },
        { id: "inkstone-blue", label: "Inkstone Blue", icon: <Palette size={14} />, color: "bg-[oklch(17.0%_0.020_255.0_/_1)] border border-transparent" },
        { id: "origami-crane", label: "Origami Crane", icon: <Palette size={14} />, color: "bg-[oklch(95.0%_0.008_90.0_/_1)] border border-transparent" },
        { id: "paper-lantern", label: "Paper Lantern", icon: <Palette size={14} />, color: "bg-[oklch(18.0%_0.030_20.0_/_1)] border border-transparent" },
        { id: "harbor-fog", label: "Harbor Fog", icon: <Palette size={14} />, color: "bg-[oklch(22.0%_0.015_250.0_/_1)] border border-transparent" },
        { id: "gingko-avenue", label: "Gingko Avenue", icon: <Palette size={14} />, color: "bg-[oklch(23.0%_0.020_75.0_/_1)] border border-transparent" },
        { id: "bamboo-shadow", label: "Bamboo Shadow", icon: <Palette size={14} />, color: "bg-[oklch(18.0%_0.040_150.0_/_1)] border border-transparent" },
        { id: "yukata-blue", label: "Yukata Blue", icon: <Palette size={14} />, color: "bg-[oklch(19.0%_0.035_250.0_/_1)] border border-transparent" },
        { id: "neon-sakura", label: "Neon Sakura", icon: <Palette size={14} />, color: "bg-[oklch(18.5%_0.055_320.0_/_1)] border border-transparent" },
        { id: "bamboo-mist", label: "Bamboo Mist", icon: <Palette size={14} />, color: "bg-[oklch(24.0%_0.032_150.0_/_1)] border border-transparent" },
        { id: "koi-pond", label: "Koi Pond", icon: <Palette size={14} />, color: "bg-[oklch(20.0%_0.048_240.0_/_1)] border border-transparent" },
        { id: "matcha-cream", label: "Matcha Cream", icon: <Palette size={14} />, color: "bg-[oklch(92.0%_0.025_140.0_/_1)] border border-transparent" },
        { id: "shinkansen-speed", label: "Shinkansen Speed", icon: <Palette size={14} />, color: "bg-[oklch(22.0%_0.035_240.0_/_1)] border border-transparent" },
        { id: "calligraphy-ink", label: "Calligraphy Ink", icon: <Palette size={14} />, color: "bg-[oklch(96.0%_0.008_85.0_/_1)] border border-transparent" },
        { id: "bento-box", label: "Bento Box", icon: <Palette size={14} />, color: "bg-[oklch(22.0%_0.025_45.0_/_1)] border border-transparent" },
        { id: "konbini-light", label: "Konbini Light", icon: <Palette size={14} />, color: "bg-[oklch(96.0%_0.015_210.0_/_1)] border border-transparent" },
        { id: "ramen-steam", label: "Ramen Steam", icon: <Palette size={14} />, color: "bg-[oklch(21.0%_0.038_50.0_/_1)] border border-transparent" },
        { id: "pearl-wave", label: "Pearl Wave", icon: <Palette size={14} />, color: "bg-[oklch(21.0%_0.045_235.0_/_1)] border border-transparent" },
        { id: "kendo-strike", label: "Kendo Strike", icon: <Palette size={14} />, color: "bg-[oklch(16.0%_0.028_265.0_/_1)] border border-transparent" },
        { id: "fuji-sunrise", label: "Fuji Sunrise", icon: <Palette size={14} />, color: "bg-[oklch(23.0%_0.048_40.0_/_1)] border border-transparent" },
        { id: "taiko-thunder", label: "Taiko Thunder", icon: <Palette size={14} />, color: "bg-[oklch(17.0%_0.035_280.0_/_1)] border border-transparent" },
        { id: "yakuza-tattoo", label: "Yakuza Tattoo", icon: <Palette size={14} />, color: "bg-[oklch(17.0%_0.045_255.0_/_1)] border border-transparent" },
        { id: "sakurajima-ash", label: "Sakurajima Ash", icon: <Palette size={14} />, color: "bg-[oklch(22.0%_0.025_270.0_/_1)] border border-transparent" },
        { id: "taisho-cafe", label: "Taisho Cafe", icon: <Palette size={14} />, color: "bg-[oklch(18.0%_0.028_65.0_/_1)] border border-transparent" },
        { id: "blooming-ume", label: "Blooming Ume", icon: <Palette size={14} />, color: "bg-[oklch(95.0%_0.015_15.0_/_1)] border border-transparent" },
        { id: "moonlit-bay", label: "Moonlit Bay", icon: <Palette size={14} />, color: "bg-[oklch(16.0%_0.018_240.0_/_1)] border border-transparent" },
        { id: "mountain-cedar", label: "Mountain Cedar", icon: <Palette size={14} />, color: "bg-[oklch(20.0%_0.020_150.0_/_1)] border border-transparent" },
        { id: "festival-red", label: "Festival Red", icon: <Palette size={14} />, color: "bg-[oklch(17.0%_0.055_25.0_/_1)] border border-transparent" },
        { id: "tea-garden", label: "Tea Garden", icon: <Palette size={14} />, color: "bg-[oklch(22.0%_0.035_140.0_/_1)] border border-transparent" },
        { id: "ramune-fizz", label: "Ramune Fizz", icon: <Palette size={14} />, color: "bg-[oklch(92.0%_0.030_210.0_/_1)] border border-transparent" },
        { id: "lantern-blue", label: "Lantern Blue", icon: <Palette size={14} />, color: "bg-[oklch(16.0%_0.030_250.0_/_1)] border border-transparent" },
        { id: "citrus-shrine", label: "Citrus Shrine", icon: <Palette size={14} />, color: "bg-[oklch(20.0%_0.030_70.0_/_1)] border border-transparent" },
        { id: "yuzu-mist", label: "Yuzu Mist", icon: <Palette size={14} />, color: "bg-[oklch(92.0%_0.025_95.0_/_1)] border border-transparent" },
        { id: "thunder-temple", label: "Thunder Temple", icon: <Palette size={14} />, color: "bg-[oklch(16.0%_0.065_280.0_/_1)] border border-transparent" },
        { id: "shibuya-nights", label: "Shibuya Nights", icon: <Palette size={14} />, color: "bg-[oklch(12.0%_0.045_290.0_/_1)] border border-transparent" },
        { id: "plum-blossom", label: "Plum Blossom", icon: <Palette size={14} />, color: "bg-[oklch(23.0%_0.042_340.0_/_1)] border border-transparent" },
        { id: "tokyo-metro", label: "Tokyo Metro", icon: <Palette size={14} />, color: "bg-[oklch(20.0%_0.025_260.0_/_1)] border border-transparent" },
        { id: "zen-stone", label: "Zen Stone", icon: <Palette size={14} />, color: "bg-[oklch(25.0%_0.015_260.0_/_1)] border border-transparent" },
        { id: "samurai-steel", label: "Samurai Steel", icon: <Palette size={14} />, color: "bg-[oklch(18.0%_0.022_250.0_/_1)] border border-transparent" },
        { id: "indigo-shibori", label: "Indigo Shibori", icon: <Palette size={14} />, color: "bg-[oklch(19.0%_0.055_255.0_/_1)] border border-transparent" },
        { id: "tatami-room", label: "Tatami Room", icon: <Palette size={14} />, color: "bg-[oklch(88.0%_0.035_85.0_/_1)] border border-transparent" },
        { id: "moss-temple", label: "Moss Temple", icon: <Palette size={14} />, color: "bg-[oklch(22.0%_0.045_145.0_/_1)] border border-transparent" },
        { id: "akihabara-glow", label: "Akihabara Glow", icon: <Palette size={14} />, color: "bg-[oklch(15.0%_0.065_300.0_/_1)] border border-transparent" },
        { id: "rice-field-gold", label: "Rice Field Gold", icon: <Palette size={14} />, color: "bg-[oklch(24.0%_0.045_80.0_/_1)] border border-transparent" },
        { id: "shogun-gold", label: "Shogun Gold", icon: <Palette size={14} />, color: "bg-[oklch(18.0%_0.035_80.0_/_1)] border border-transparent" },
        { id: "sakura-storm", label: "Sakura Storm", icon: <Palette size={14} />, color: "bg-[oklch(90.0%_0.032_340.0_/_1)] border border-transparent" },
        { id: "sumo-strength", label: "Sumo Strength", icon: <Palette size={14} />, color: "bg-[oklch(20.0%_0.022_35.0_/_1)] border border-transparent" },
        { id: "izakaya-warm", label: "Izakaya Warm", icon: <Palette size={14} />, color: "bg-[oklch(20.0%_0.045_35.0_/_1)] border border-transparent" },
        { id: "onsen-steam", label: "Onsen Steam", icon: <Palette size={14} />, color: "bg-[oklch(25.0%_0.022_210.0_/_1)] border border-transparent" },
        { id: "bamboo-forest", label: "Bamboo Forest", icon: <Palette size={14} />, color: "bg-[oklch(21.0%_0.045_155.0_/_1)] border border-transparent" },
        { id: "lavender-fields", label: "Lavender Fields", icon: <Palette size={14} />, color: "bg-[oklch(19.0%_0.058_290.0_/_1)] border border-transparent" },
        { id: "wisteria-dream", label: "Wisteria Dream", icon: <Palette size={14} />, color: "bg-[oklch(20.0%_0.048_290.0_/_1)] border border-transparent" },
        { id: "ryokan-evening", label: "Ryokan Evening", icon: <Palette size={14} />, color: "bg-[oklch(23.0%_0.038_280.0_/_1)] border border-transparent" },
        { id: "autumn-maple", label: "Autumn Maple", icon: <Palette size={14} />, color: "bg-[oklch(21.0%_0.052_30.0_/_1)] border border-transparent" },
        { id: "okinawa-sea", label: "Okinawa Sea", icon: <Palette size={14} />, color: "bg-[oklch(23.0%_0.055_215.0_/_1)] border border-transparent" },
        { id: "firefly-field", label: "Firefly Field", icon: <Palette size={14} />, color: "bg-[oklch(16.0%_0.038_150.0_/_1)] border border-transparent" },
        { id: "frozen-lake", label: "Frozen Lake", icon: <Palette size={14} />, color: "bg-[oklch(24.0%_0.035_230.0_/_1)] border border-transparent" },
        { id: "kabuki-drama", label: "Kabuki Drama", icon: <Palette size={14} />, color: "bg-[oklch(15.0%_0.048_25.0_/_1)] border border-transparent" },
        { id: "geisha-grace", label: "Geisha Grace", icon: <Palette size={14} />, color: "bg-[oklch(18.0%_0.055_15.0_/_1)] border border-transparent" },
        { id: "ghost-parade", label: "Ghost Parade", icon: <Palette size={14} />, color: "bg-[oklch(15.0%_0.045_310.0_/_1)] border border-transparent" },
        { id: "soda-float", label: "Soda Float", icon: <Palette size={14} />, color: "bg-[oklch(93.0%_0.032_150.0_/_1)] border border-transparent" },
        { id: "tanuki-mischief", label: "Tanuki Mischief", icon: <Palette size={14} />, color: "bg-[oklch(22.0%_0.042_55.0_/_1)] border border-transparent" },
        { id: "pixel-retro", label: "Pixel Retro", icon: <Palette size={14} />, color: "bg-[oklch(14.0%_0.025_280.0_/_1)] border border-transparent" },
        { id: "bamboo-forest", label: "Bamboo Forest", icon: <Palette size={14} />, color: "bg-[oklch(21.0%_0.045_155.0_/_1)] border border-transparent" },
        { id: "lavender-fields", label: "Lavender Fields", icon: <Palette size={14} />, color: "bg-[oklch(19.0%_0.058_290.0_/_1)] border border-transparent" },
        { id: "wisteria-dream", label: "Wisteria Dream", icon: <Palette size={14} />, color: "bg-[oklch(20.0%_0.048_290.0_/_1)] border border-transparent" },
        { id: "ryokan-evening", label: "Ryokan Evening", icon: <Palette size={14} />, color: "bg-[oklch(23.0%_0.038_280.0_/_1)] border border-transparent" },
        { id: "autumn-maple", label: "Autumn Maple", icon: <Palette size={14} />, color: "bg-[oklch(21.0%_0.052_30.0_/_1)] border border-transparent" },
        { id: "okinawa-sea", label: "Okinawa Sea", icon: <Palette size={14} />, color: "bg-[oklch(23.0%_0.055_215.0_/_1)] border border-transparent" },
        { id: "firefly-field", label: "Firefly Field", icon: <Palette size={14} />, color: "bg-[oklch(16.0%_0.038_150.0_/_1)] border border-transparent" },
        { id: "frozen-lake", label: "Frozen Lake", icon: <Palette size={14} />, color: "bg-[oklch(24.0%_0.035_230.0_/_1)] border border-transparent" },
        { id: "kabuki-drama", label: "Kabuki Drama", icon: <Palette size={14} />, color: "bg-[oklch(15.0%_0.048_25.0_/_1)] border border-transparent" },
        { id: "geisha-grace", label: "Geisha Grace", icon: <Palette size={14} />, color: "bg-[oklch(18.0%_0.055_15.0_/_1)] border border-transparent" },
        { id: "ghost-parade", label: "Ghost Parade", icon: <Palette size={14} />, color: "bg-[oklch(15.0%_0.045_310.0_/_1)] border border-transparent" },
        { id: "soda-float", label: "Soda Float", icon: <Palette size={14} />, color: "bg-[oklch(93.0%_0.032_150.0_/_1)] border border-transparent" },
        { id: "tanuki-mischief", label: "Tanuki Mischief", icon: <Palette size={14} />, color: "bg-[oklch(22.0%_0.042_55.0_/_1)] border border-transparent" },
        { id: "pixel-retro", label: "Pixel Retro", icon: <Palette size={14} />, color: "bg-[oklch(14.0%_0.025_280.0_/_1)] border border-transparent" },
        { id: "holographic-idol", label: "Holographic Idol", icon: <Palette size={14} />, color: "bg-[oklch(14.0%_0.065_300.0_/_1)] border border-transparent" },
        { id: "umbrella-rain", label: "Umbrella Rain", icon: <Palette size={14} />, color: "bg-[oklch(22.0%_0.018_250.0_/_1)] border border-transparent" },
        { id: "starry-tanabata", label: "Starry Tanabata", icon: <Palette size={14} />, color: "bg-[oklch(15.0%_0.048_275.0_/_1)] border border-transparent" },
        { id: "mochi-pastel", label: "Mochi Pastel", icon: <Palette size={14} />, color: "bg-[oklch(94.0%_0.028_340.0_/_1)] border border-transparent" },
        { id: "wind-god", label: "Wind God", icon: <Palette size={14} />, color: "bg-[oklch(19.0%_0.045_175.0_/_1)] border border-transparent" },
        { id: "street-lantern", label: "Street Lantern", icon: <Palette size={14} />, color: "bg-[oklch(19.0%_0.038_40.0_/_1)] border border-transparent" },
        { id: "vending-glow", label: "Vending Glow", icon: <Palette size={14} />, color: "bg-[oklch(16.0%_0.025_280.0_/_1)] border border-transparent" },
        { id: "midnight-ramen", label: "Midnight Ramen", icon: <Palette size={14} />, color: "bg-[oklch(16.0%_0.042_30.0_/_1)] border border-transparent" },
        { id: "autumn-temple", label: "Autumn Temple", icon: <Palette size={14} />, color: "bg-[oklch(20.0%_0.048_35.0_/_1)] border border-transparent" },
        { id: "jpop-energy", label: "Jpop Energy", icon: <Palette size={14} />, color: "bg-[oklch(15.0%_0.055_310.0_/_1)] border border-transparent" },
        { id: "noh-mask", label: "Noh Mask", icon: <Palette size={14} />, color: "bg-[oklch(20.0%_0.028_285.0_/_1)] border border-transparent" },
        { id: "strawberry-daifuku", label: "Strawberry Daifuku", icon: <Palette size={14} />, color: "bg-[oklch(96.0%_0.018_340.0_/_1)] border border-transparent" },
        { id: "komorebi-green", label: "Komorebi Green", icon: <Palette size={14} />, color: "bg-[oklch(22.0%_0.030_150.0_/_1)] border border-transparent" },
        { id: "night-market", label: "Night Market", icon: <Palette size={14} />, color: "bg-[oklch(16.0%_0.035_35.0_/_1)] border border-transparent" },
        { id: "quiet-library", label: "Quiet Library", icon: <Palette size={14} />, color: "bg-[oklch(92.0%_0.012_90.0_/_1)] border border-transparent" },
        { id: "sakura-soda", label: "Sakura Soda", icon: <Palette size={14} />, color: "bg-[oklch(94.0%_0.025_345.0_/_1)] border border-transparent" },
        { id: "storm-lake", label: "Storm Lake", icon: <Palette size={14} />, color: "bg-[oklch(15.0%_0.050_250.0_/_1)] border border-transparent" },
        { id: "winter-kimono", label: "Winter Kimono", icon: <Palette size={14} />, color: "bg-[oklch(16.0%_0.040_260.0_/_1)] border border-transparent" },
        { id: "sake-glass", label: "Sake Glass", icon: <Palette size={14} />, color: "bg-[oklch(98.0%_0.004_90.0_/_1)] border border-transparent" },
        { id: "matcha-foam", label: "Matcha Foam", icon: <Palette size={14} />, color: "bg-[oklch(92.0%_0.020_140.0_/_1)] border border-transparent" },
        { id: "shrine-stone", label: "Shrine Stone", icon: <Palette size={14} />, color: "bg-[oklch(19.0%_0.015_260.0_/_1)] border border-transparent" },
        { id: "ink-wash", label: "Ink Wash", icon: <Palette size={14} />, color: "bg-[oklch(96.0%_0.006_90.0_/_1)] border border-transparent" },
        { id: "plaza-snow", label: "Plaza Snow", icon: <Palette size={14} />, color: "bg-[oklch(97.0%_0.006_240.0_/_1)] border border-transparent" },
        { id: "tsukiji-morning", label: "Tsukiji Morning", icon: <Palette size={14} />, color: "bg-[oklch(22.0%_0.020_235.0_/_1)] border border-transparent" },
        { id: "spring-bamboo", label: "Spring Bamboo", icon: <Palette size={14} />, color: "bg-[oklch(93.0%_0.018_150.0_/_1)] border border-transparent" },
        { id: "sundown-shrine", label: "Sundown Shrine", icon: <Palette size={14} />, color: "bg-[oklch(18.0%_0.055_330.0_/_1)] border border-transparent" },
        { id: "sea-glass", label: "Sea Glass", icon: <Palette size={14} />, color: "bg-[oklch(96.0%_0.015_210.0_/_1)] border border-transparent" },
        { id: "koi-glow", label: "Koi Glow", icon: <Palette size={14} />, color: "bg-[oklch(22.0%_0.045_40.0_/_1)] border border-transparent" },
        { id: "tsukimi-night", label: "Tsukimi Night", icon: <Palette size={14} />, color: "bg-[oklch(14.0%_0.030_260.0_/_1)] border border-transparent" },
        { id: "gingko-gold", label: "Gingko Gold", icon: <Palette size={14} />, color: "bg-[oklch(23.0%_0.030_85.0_/_1)] border border-transparent" },
        { id: "coastal-breeze", label: "Coastal Breeze", icon: <Palette size={14} />, color: "bg-[oklch(20.0%_0.035_225.0_/_1)] border border-transparent" },
        { id: "festival-mask", label: "Festival Mask", icon: <Palette size={14} />, color: "bg-[oklch(20.0%_0.042_15.0_/_1)] border border-transparent" },
        { id: "torii-sunset", label: "Torii Sunset", icon: <Palette size={14} />, color: "bg-[oklch(22.0%_0.058_35.0_/_1)] border border-transparent" },
    ];

    const fonts: { id: Font; label: string; familyClass: string }[] = [
        { id: "sans", label: "Sans Serif", familyClass: "font-sans" },
        { id: "mono", label: "Monospace", familyClass: "font-mono" },
        { id: "serif", label: "Serif", familyClass: "font-serif" },
        { id: "comic", label: "Comic", familyClass: "font-[Comic_Sans_MS]" },
        { id: "dyslexic", label: "OpenDyslexic", familyClass: "font-[OpenDyslexic]" },
    ];

    const hiddenThemeIds = new Set(themes.slice(0, 12).map((themeOption) => themeOption.id));
    const visibleThemes = themes.filter((themeOption) => !hiddenThemeIds.has(themeOption.id));
    const currentTheme = themes.find(t => t.id === theme) || visibleThemes[0] || themes[0];
    const featuredThemes = visibleThemes.slice(0, 8);
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const filteredThemes = normalizedSearch
        ? visibleThemes.filter((themeOption) => themeOption.label.toLowerCase().includes(normalizedSearch) || themeOption.id.toLowerCase().includes(normalizedSearch))
        : visibleThemes;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex h-9 items-center gap-2 rounded-full border border-zinc-200/10 bg-background/70 px-2.5 text-left shadow-sm backdrop-blur-md transition hover:bg-surface-hover"
                title="Change Theme"
            >
                <div className={cn("h-4 w-4 rounded-full shadow-sm", currentTheme.color)} />
                <span className="hidden md:block max-w-24 truncate text-xs font-medium text-foreground">{currentTheme.label}</span>
                <ChevronDown size={14} className={cn("text-zinc-500 transition-transform", isOpen && "rotate-180")} />
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-[min(88vw,20rem)] overflow-hidden rounded-2xl border border-zinc-200/70 bg-background/92 shadow-2xl backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-200 dark:border-white/10">
                    <div className="max-h-[72vh] overflow-y-auto p-2.5 scrollbar-thin">
                        <div className="mb-2 flex items-center justify-between gap-3 px-1">
                            <div className="min-w-0">
                                <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-zinc-500">Theme</div>
                                <div className="truncate text-sm font-semibold text-foreground">{currentTheme.label}</div>
                            </div>
                            <div className={cn("h-7 w-7 rounded-xl shadow-sm", currentTheme.color)} />
                        </div>

                        <div className="relative mb-3">
                            <Search size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                            <input
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search themes"
                                className="w-full rounded-xl border border-zinc-200/70 bg-background/80 py-2 pl-8 pr-3 text-sm text-foreground outline-none transition placeholder:text-zinc-400 focus:border-foreground/30 dark:border-white/10"
                            />
                        </div>

                        {!normalizedSearch && (
                            <>
                                <div className="px-1 pb-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
                                    Quick Picks
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    {featuredThemes.map((themeOption) => (
                                        <button
                                            key={`featured-${themeOption.id}`}
                                            onClick={() => {
                                                setTheme(themeOption.id);
                                                setIsOpen(false);
                                            }}
                                            className={cn(
                                                "rounded-xl border p-2.5 text-left transition-all",
                                                theme === themeOption.id
                                                    ? "border-foreground/25 bg-foreground/10"
                                                    : "border-zinc-200/70 bg-surface/60 hover:border-zinc-300 dark:border-white/10"
                                            )}
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="flex min-w-0 items-center gap-2">
                                                    <div className={cn("h-6 w-6 rounded-lg shadow-sm", themeOption.color)} />
                                                    <div className="truncate text-xs font-medium text-foreground">{themeOption.label}</div>
                                                </div>
                                                {theme === themeOption.id && <Check size={16} className="text-foreground" />}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}

                        <div className="px-1 pb-2 pt-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
                            {normalizedSearch ? `Results (${filteredThemes.length})` : "All Themes"}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {filteredThemes.map((themeOption) => (
                                <button
                                    key={themeOption.id}
                                    onClick={() => {
                                        setTheme(themeOption.id);
                                        setIsOpen(false);
                                    }}
                                    className={cn(
                                        "group rounded-xl border p-2.5 text-left transition-all",
                                        theme === themeOption.id
                                            ? "border-foreground/25 bg-foreground/10"
                                            : "border-zinc-200/70 bg-surface/50 hover:border-zinc-300 dark:border-white/10"
                                    )}
                                    title={themeOption.label}
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex min-w-0 items-center gap-2">
                                            <div className={cn("h-5 w-5 flex-shrink-0 rounded-md shadow-sm", themeOption.color)} />
                                            <span className="truncate text-xs font-medium text-foreground">{themeOption.label}</span>
                                        </div>
                                        {theme === themeOption.id && <Check size={13} className="flex-shrink-0 text-foreground" />}
                                    </div>
                                </button>
                            ))}
                        </div>

                        {filteredThemes.length === 0 && (
                            <div className="rounded-2xl border border-dashed border-zinc-300/70 px-4 py-6 text-center text-sm text-zinc-500 dark:border-white/10">
                                No themes matched &quot;{searchTerm}&quot;.
                            </div>
                        )}

                        <div className="mx-1 my-3 h-px bg-zinc-200 dark:bg-zinc-800" />

                        <div className="px-1 py-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
                            Typography
                        </div>
                        <div className="grid gap-2">
                            {fonts.map((f) => (
                                <button
                                    key={f.id}
                                    onClick={() => {
                                        setFont(f.id);
                                        setIsOpen(false);
                                    }}
                                    className={cn(
                                        "flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-sm transition-colors",
                                        font === f.id
                                            ? "border-foreground/25 bg-foreground/10 text-foreground"
                                            : "border-zinc-200/70 bg-surface/50 text-zinc-500 hover:text-foreground dark:border-white/10"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <Type size={14} className={cn("flex-shrink-0", font === f.id ? "text-foreground" : "text-zinc-400")} />
                                        <span className={f.familyClass}>{f.label}</span>
                                    </div>
                                    {font === f.id && <Check size={14} className="text-foreground" />}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
