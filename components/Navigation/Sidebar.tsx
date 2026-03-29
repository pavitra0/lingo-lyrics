"use client";

import { useNavigation } from "@/lib/contexts/NavigationContext";
import { useTheme } from "@/lib/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import { X, Home, Compass, Library, Heart, BookPlus, History as HistoryIcon, Terminal, Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

export function Sidebar() {
    const t = useTranslations("Navigation");
    const { isMobileMenuOpen, closeMobileMenu } = useNavigation();
    const { theme, setTheme } = useTheme();
    const isTerminal = theme === "terminal";

    return (
        <>
            {/* Mobile Overlay Backdrop */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-background/80 z-40 md:hidden backdrop-blur-sm shadow-sm"
                    onClick={closeMobileMenu}
                />
            )}

            <aside className={cn(
                "w-64 h-full bg-background flex flex-col p-4 flex-shrink-0 border-r transition-transform duration-300 z-50",
                "fixed inset-y-0 left-0 md:relative md:translate-x-0", // Mobile: fixed, Desktop: relative
                isMobileMenuOpen ? "translate-x-0" : "-translate-x-full", // Mobile toggle logic
                isTerminal ? "font-mono border-zinc-900" : "border-white/10"
            )}>
                {/* Search / Logo Area */}
                <div className="flex items-center justify-between mb-8 px-2 py-2">
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "h-8 w-8 flex items-center justify-center",
                            theme === "light" ? "bg-black text-white rounded-full shadow-sm" : "bg-foreground text-background",
                            !isTerminal && theme !== "light" && "rounded-full shadow-sm"
                        )}>
                            <span className={cn("font-bold", isTerminal ? "font-mono text-sm" : "text-xs")}>{isTerminal ? 'LL' : 'L'}</span>
                        </div>
                        <span className={cn(
                            "font-bold",
                            isTerminal ? "text-lg tracking-widest text-foreground" : "text-xl tracking-tight text-foreground/90"
                        )}>LingoLyrics</span>
                    </div>
                    {/* Close Button (Mobile Only) */}
                    <button onClick={closeMobileMenu} className={cn("md:hidden transition-colors", isTerminal ? "text-zinc-500 hover:text-foreground" : "text-zinc-400 hover:text-foreground")}>
                        <X size={isTerminal ? 20 : 24} />
                    </button>
                </div>

                <nav className="flex flex-col gap-1 flex-1">
                    <Link href="/" onClick={closeMobileMenu} className={cn(
                        "flex items-center gap-4 px-4 py-3 transition",
                        isTerminal ? "rounded text-foreground hover:bg-surface-hover text-sm border border-transparent hover:border-zinc-800" : "rounded-md text-foreground hover:bg-surface-hover font-medium"
                    )}>
                        <Home size={isTerminal ? 20 : 24} />
                        <span>{t("home")}</span>
                    </Link>
                    <Link href="/explore" onClick={closeMobileMenu} className={cn(
                        "flex items-center gap-4 px-4 py-3 transition",
                        isTerminal ? "rounded text-zinc-500 hover:bg-surface-hover hover:text-foreground text-sm border border-transparent hover:border-zinc-800" : "rounded-md text-zinc-500 dark:text-zinc-400 hover:bg-surface-hover hover:text-foreground font-medium"
                    )}>
                        <Compass size={isTerminal ? 20 : 24} />
                        <span>{t("explore")}</span>
                    </Link>
                    <div className={cn("mt-8 pt-6 border-t", isTerminal ? "border-zinc-900" : "border-white/10")}>
                        <div className={cn(
                            "px-4 mb-4 uppercase flex items-center gap-2",
                            isTerminal ? "text-xs text-zinc-500 tracking-widest" : "text-xs font-bold text-zinc-500 tracking-wider"
                        )}>
                            <Library size={isTerminal ? 12 : 14} />
                            {t("library")}
                        </div>
                        <Link href="/vocabulary" onClick={closeMobileMenu} className={cn(
                            "flex items-center gap-4 px-4 py-3 transition",
                            isTerminal ? "rounded text-zinc-500 hover:bg-surface-hover hover:text-foreground text-sm border border-transparent hover:border-zinc-800" : "rounded-md text-zinc-500 dark:text-zinc-400 hover:bg-surface-hover hover:text-foreground font-medium"
                        )}>
                            <BookPlus size={isTerminal ? 20 : 24} />
                            <span>{t("vocabulary")}</span>
                        </Link>
                        <Link href="/history" onClick={closeMobileMenu} className={cn(
                            "flex items-center gap-4 px-4 py-3 transition",
                            isTerminal ? "rounded text-zinc-500 hover:bg-surface-hover hover:text-foreground text-sm border border-transparent hover:border-zinc-800" : "rounded-md text-zinc-500 dark:text-zinc-400 hover:bg-surface-hover hover:text-foreground font-medium"
                        )}>
                            <HistoryIcon size={isTerminal ? 20 : 24} />
                            <span>{t("history")}</span>
                        </Link>
                        <Link href="/favorites" onClick={closeMobileMenu} className={cn(
                            "flex items-center gap-4 px-4 py-3 transition",
                            isTerminal ? "rounded text-zinc-500 hover:bg-surface-hover hover:text-foreground text-sm border border-transparent hover:border-zinc-800" : "rounded-md text-zinc-500 dark:text-zinc-400 hover:bg-surface-hover hover:text-foreground font-medium"
                        )}>
                            <Heart size={isTerminal ? 20 : 24} />
                            <span>{t("favorites")}</span>
                        </Link>
                    </div>
                </nav>


            </aside>
        </>
    );
}

