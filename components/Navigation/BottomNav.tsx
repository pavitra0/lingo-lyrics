"use client";

import Link from "next/link";
import { Home, Compass, Library } from "lucide-react";

export function BottomNav() {
    return (
        <nav className="fixed bottom-0 left-0 right-0 h-16 bg-black/90 backdrop-blur-xl z-50 md:hidden flex items-center justify-around border-t border-white/5 pb-safe">
            <Link href="/" className="flex flex-col items-center gap-1 text-white">
                <Home size={24} />
                <span className="text-[10px]">Home</span>
            </Link>
            <Link href="/explore" className="flex flex-col items-center gap-1 text-zinc-400 hover:text-white transition">
                <Compass size={24} />
                <span className="text-[10px]">Explore</span>
            </Link>
            <Link href="#" className="flex flex-col items-center gap-1 text-zinc-400 hover:text-white transition">
                <Library size={24} />
                <span className="text-[10px]">Library</span>
            </Link>
        </nav>
    );
}
