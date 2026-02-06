"use client";

import { Link } from "@/i18n/routing";
import { Home, Compass, Library, Search, Heart, BookPlus, History as HistoryIcon } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";

export function Sidebar() {
    const t = useTranslations("Navigation");
    return (
        <aside className="w-64 h-full bg-black hidden md:flex flex-col p-4 flex-shrink-0 border-r border-white/5">
            {/* Search / Logo Area */}
            <div className="flex items-center gap-3 mb-8 px-2 py-2">
                <div className="h-8 w-8 bg-white rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                    <span className="text-black font-bold text-xs">M</span>
                </div>
                <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Musify</span>
            </div>

            <nav className="flex flex-col gap-1">
                <Link href="/" className="flex items-center gap-4 px-4 py-3 rounded-md text-white hover:bg-[#121212] transition font-medium">
                    <Home size={24} />
                    <span>{t("home")}</span>
                </Link>
                <Link href="/explore" className="flex items-center gap-4 px-4 py-3 rounded-md text-zinc-400 hover:bg-[#121212] hover:text-white transition font-medium">
                    <Compass size={24} />
                    <span>{t("explore")}</span>
                </Link>
                <Link href="#" className="flex items-center gap-4 px-4 py-3 rounded-md text-zinc-400 hover:bg-[#121212] hover:text-white transition font-medium">
                    <Library size={24} />
                    <span>{t("library")}</span>
                </Link>
                <div className="mt-4 pt-4 border-t border-white/5">
                    <Link href="/vocabulary" className="flex items-center gap-4 px-4 py-3 rounded-md text-zinc-400 hover:bg-[#121212] hover:text-white transition font-medium">
                        <BookPlus size={24} />
                        <span>{t("vocabulary")}</span>
                    </Link>
                    <Link href="/history" className="flex items-center gap-4 px-4 py-3 rounded-md text-zinc-400 hover:bg-[#121212] hover:text-white transition font-medium">
                        <HistoryIcon size={24} />
                        <span>{t("history")}</span>
                    </Link>
                    <Link href="/favorites" className="flex items-center gap-4 px-4 py-3 rounded-md text-zinc-400 hover:bg-[#121212] hover:text-white transition font-medium">
                        <Heart size={24} />
                        <span>{t("favorites")}</span>
                    </Link>
                </div>
            </nav>
        </aside>
    );
}
