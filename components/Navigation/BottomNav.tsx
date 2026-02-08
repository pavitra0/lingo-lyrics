"use client";

import { useNavigation } from "@/lib/contexts/NavigationContext";
import { Menu, Home, Compass, Library } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

export function BottomNav() {
    const t = useTranslations("Navigation");
    const { toggleMobileMenu } = useNavigation();

    return (
        <nav className="fixed bottom-0 left-0 right-0 h-16 bg-black/90 backdrop-blur-xl z-50 md:hidden flex items-center justify-around border-t border-white/5 pb-safe">
            <Link href="/" className="flex flex-col items-center gap-1 text-white">
                <Home size={24} />
                <span className="text-[10px]">{t("home")}</span>
            </Link>
            <Link href="/explore" className="flex flex-col items-center gap-1 text-zinc-400 hover:text-white transition">
                <Compass size={24} />
                <span className="text-[10px]">{t("explore")}</span>
            </Link>
            {/* <Link href="#" className="flex flex-col items-center gap-1 text-zinc-400 hover:text-white transition">
                <Library size={24} />
                <span className="text-[10px]">{t("library")}</span>
            </Link> */}
            <button onClick={toggleMobileMenu} className="flex flex-col items-center gap-1 text-zinc-400 hover:text-white transition">
                <Menu size={24} />
                <span className="text-[10px]">Menu</span>
            </button>
        </nav>
    );
}
