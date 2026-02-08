"use client";

import { useNavigation } from "@/lib/contexts/NavigationContext";
import { cn } from "@/lib/utils";
import { X, Home, Compass, Library, Heart, BookPlus, History as HistoryIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

export function Sidebar() {
    const t = useTranslations("Navigation");
    const { isMobileMenuOpen, closeMobileMenu } = useNavigation();

    return (
        <>
            {/* Mobile Overlay Backdrop */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/80 z-40 md:hidden backdrop-blur-sm"
                    onClick={closeMobileMenu}
                />
            )}

            <aside className={cn(
                "w-64 h-full bg-black flex flex-col p-4 flex-shrink-0 border-r border-white/5 transition-transform duration-300 z-50",
                "fixed inset-y-0 left-0 md:relative md:translate-x-0", // Mobile: fixed, Desktop: relative
                isMobileMenuOpen ? "translate-x-0" : "-translate-x-full" // Mobile toggle logic
            )}>
                {/* Search / Logo Area */}
                <div className="flex items-center justify-between mb-8 px-2 py-2">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-white rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                            <span className="text-black font-bold text-xs">L</span>
                        </div>
                        <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">LingoLyrics</span>
                    </div>
                    {/* Close Button (Mobile Only) */}
                    <button onClick={closeMobileMenu} className="md:hidden text-zinc-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                <nav className="flex flex-col gap-1">
                    <Link href="/" onClick={closeMobileMenu} className="flex items-center gap-4 px-4 py-3 rounded-md text-white hover:bg-[#121212] transition font-medium">
                        <Home size={24} />
                        <span>{t("home")}</span>
                    </Link>
                    <Link href="/explore" onClick={closeMobileMenu} className="flex items-center gap-4 px-4 py-3 rounded-md text-zinc-400 hover:bg-[#121212] hover:text-white transition font-medium">
                        <Compass size={24} />
                        <span>{t("explore")}</span>
                    </Link>
                    <div className="mt-6 pt-4 border-t border-white/5">
                        <div className="px-4 mb-2 text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                            <Library size={14} />
                            {t("library")}
                        </div>
                        <Link href="/vocabulary" onClick={closeMobileMenu} className="flex items-center gap-4 px-4 py-3 rounded-md text-zinc-400 hover:bg-[#121212] hover:text-white transition font-medium">
                            <BookPlus size={24} />
                            <span>{t("vocabulary")}</span>
                        </Link>
                        <Link href="/history" onClick={closeMobileMenu} className="flex items-center gap-4 px-4 py-3 rounded-md text-zinc-400 hover:bg-[#121212] hover:text-white transition font-medium">
                            <HistoryIcon size={24} />
                            <span>{t("history")}</span>
                        </Link>
                        <Link href="/favorites" onClick={closeMobileMenu} className="flex items-center gap-4 px-4 py-3 rounded-md text-zinc-400 hover:bg-[#121212] hover:text-white transition font-medium">
                            <Heart size={24} />
                            <span>{t("favorites")}</span>
                        </Link>
                    </div>
                </nav>
            </aside>
        </>
    );
}
