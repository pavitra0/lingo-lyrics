"use client";

import { useRef } from "react";
import SectionHeader from "./SectionHeader";

interface HorizontalScrollProps {
    title: string;
    children: React.ReactNode;
}

export default function HorizontalScroll({ title, children }: HorizontalScrollProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: "left" | "right") => {
        if (scrollRef.current) {
            const scrollAmount = direction === "left" ? -800 : 800; // Adjust scroll distance
            scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
        }
    };

    return (
        <section className="mb-12 relative">
            <SectionHeader
                title={title}
                onScrollLeft={() => scroll("left")}
                onScrollRight={() => scroll("right")}
            />

            <div
                ref={scrollRef}
                className="flex overflow-x-auto gap-4 px-4 md:px-0 pb-4 no-scrollbar scroll-smooth snap-x snap-mandatory"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
                {children}
            </div>
        </section>
    );
}
