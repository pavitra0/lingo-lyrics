"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import { type Song, usePlayer } from "@/lib/contexts/PlayerContext";
import { cn } from "@/lib/utils";
import { X, Play, GripVertical, Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { MusicImage } from "@/components/Shared/MusicImage";

interface SuggestionsPopupProps {
    isOpen: boolean;
    onClose: () => void;
    songs: Song[];
}

interface DragState {
    isDragging: boolean;
    startX: number;
    startY: number;
    offsetX: number;
    offsetY: number;
}

export function SuggestionsPopup({ isOpen, onClose, songs }: SuggestionsPopupProps) {
    const { currentSong, playSong } = usePlayer();
    const popupRef = useRef<HTMLDivElement>(null);
    const dragHandleRef = useRef<HTMLDivElement>(null);

    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [hasBeenDragged, setHasBeenDragged] = useState(false);
    const dragState = useRef<DragState>({
        isDragging: false,
        startX: 0,
        startY: 0,
        offsetX: 0,
        offsetY: 0,
    });

    // Reset position when popup opens
    useEffect(() => {
        if (isOpen) {
            setPosition({ x: 0, y: 0 });
            setHasBeenDragged(false);
        }
    }, [isOpen]);

    // Clamp position within viewport
    const clampPosition = useCallback((x: number, y: number) => {
        if (!popupRef.current) return { x, y };

        const rect = popupRef.current.getBoundingClientRect();
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        const clampedX = Math.max(-rect.left + 8, Math.min(x, vw - rect.right + x - 8));
        const clampedY = Math.max(-rect.top + 8, Math.min(y, vh - rect.bottom + y - 8));

        return { x: clampedX, y: clampedY };
    }, []);

    const handlePointerDown = useCallback((e: React.PointerEvent) => {
        // Only drag from handle
        if (!dragHandleRef.current?.contains(e.target as Node)) return;

        e.preventDefault();
        e.stopPropagation();

        dragState.current = {
            isDragging: true,
            startX: e.clientX,
            startY: e.clientY,
            offsetX: position.x,
            offsetY: position.y,
        };

        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }, [position]);

    const handlePointerMove = useCallback((e: React.PointerEvent) => {
        if (!dragState.current.isDragging) return;

        e.preventDefault();

        const dx = e.clientX - dragState.current.startX;
        const dy = e.clientY - dragState.current.startY;

        const newX = dragState.current.offsetX + dx;
        const newY = dragState.current.offsetY + dy;

        const clamped = clampPosition(newX, newY);
        setPosition(clamped);
        setHasBeenDragged(true);
    }, [clampPosition]);

    const handlePointerUp = useCallback((e: React.PointerEvent) => {
        if (!dragState.current.isDragging) return;

        dragState.current.isDragging = false;
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    }, []);

    // Touch drag support for mobile
    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        if (!dragHandleRef.current?.contains(e.target as Node)) return;

        const touch = e.touches[0];
        dragState.current = {
            isDragging: true,
            startX: touch.clientX,
            startY: touch.clientY,
            offsetX: position.x,
            offsetY: position.y,
        };
    }, [position]);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (!dragState.current.isDragging) return;
        e.preventDefault();

        const touch = e.touches[0];
        const dx = touch.clientX - dragState.current.startX;
        const dy = touch.clientY - dragState.current.startY;

        const newX = dragState.current.offsetX + dx;
        const newY = dragState.current.offsetY + dy;

        const clamped = clampPosition(newX, newY);
        setPosition(clamped);
        setHasBeenDragged(true);
    }, [clampPosition]);

    const handleTouchEnd = useCallback(() => {
        dragState.current.isDragging = false;
    }, []);

    const pressableSoftClass = "transform-gpu transition duration-150 ease-out active:scale-[0.98]";

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    ref={popupRef}
                    initial={{ opacity: 0, scale: 0.9, y: 40 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 40 }}
                    transition={{ type: "spring", damping: 24, stiffness: 300 }}
                    className={cn(
                        "fixed z-[70] flex max-h-[min(70vh,600px)] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden",
                        "rounded-2xl border border-white/[0.12]",
                        "bg-zinc-950/80 shadow-[0_32px_100px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.05)] backdrop-blur-3xl",
                        hasBeenDragged ? "" : "right-4 bottom-36 md:right-6 md:bottom-32"
                    )}
                    style={hasBeenDragged ? {
                        left: `calc(50% + ${position.x}px)`,
                        top: `calc(50% + ${position.y}px)`,
                        transform: "translate(-50%, -50%)",
                    } : {
                        transform: `translate(${position.x}px, ${position.y}px)`,
                    }}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    {/* Drag Handle + Header */}
                    <div
                        ref={dragHandleRef}
                        className="flex items-center justify-between border-b border-white/[0.08] bg-white/[0.04] px-4 py-3 cursor-grab active:cursor-grabbing select-none"
                    >
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1 text-zinc-500">
                                <GripVertical size={16} />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <Sparkles size={14} className="text-purple-400" />
                                    <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                                        Similar Tracks
                                    </span>
                                </div>
                                <h3 className="text-sm font-semibold text-white/90">Related Songs</h3>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 transition hover:bg-white/10 hover:text-white active:scale-95"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* Song List */}
                    <div className="no-scrollbar flex-1 overflow-y-auto p-2">
                        {songs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.06]">
                                    <Sparkles size={20} className="text-zinc-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-zinc-400">No suggestions yet</p>
                                    <p className="mt-1 text-xs text-zinc-600">Play a song to get recommendations</p>
                                </div>
                            </div>
                        ) : (
                            songs.map((song, index) => {
                                const isCurrent = currentSong?.id === song.id;
                                return (
                                    <div
                                        key={`${song.id}-${index}`}
                                        className={cn(
                                            "group flex cursor-pointer items-center gap-3 rounded-xl p-2.5 transition hover:bg-white/[0.07]",
                                            pressableSoftClass,
                                            isCurrent && "bg-white/[0.1]"
                                        )}
                                        onClick={() => {
                                            playSong(song);
                                            onClose();
                                        }}
                                    >
                                        {/* Index / Play indicator */}
                                        <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center">
                                            {isCurrent ? (
                                                <div className="flex items-end gap-[2px]">
                                                    <span className="inline-block h-3 w-[3px] animate-pulse rounded-full bg-purple-400" style={{ animationDelay: "0ms" }} />
                                                    <span className="inline-block h-4 w-[3px] animate-pulse rounded-full bg-purple-400" style={{ animationDelay: "150ms" }} />
                                                    <span className="inline-block h-2 w-[3px] animate-pulse rounded-full bg-purple-400" style={{ animationDelay: "300ms" }} />
                                                </div>
                                            ) : (
                                                <>
                                                    <span className="text-xs font-medium text-zinc-600 group-hover:hidden">
                                                        {index + 1}
                                                    </span>
                                                    <Play size={14} fill="white" className="hidden text-white group-hover:block" />
                                                </>
                                            )}
                                        </div>

                                        {/* Cover Art */}
                                        <div className="relative h-11 w-11 flex-shrink-0 overflow-hidden rounded-lg bg-zinc-800/80">
                                            <MusicImage
                                                src={song.image}
                                                alt={song.title}
                                                fill
                                                className="object-cover"
                                                fallbackIconSize={16}
                                            />
                                        </div>

                                        {/* Song Info */}
                                        <div className="min-w-0 flex-1">
                                            <span className={cn(
                                                "block truncate text-sm font-medium",
                                                isCurrent ? "text-purple-300" : "text-white/90"
                                            )}>
                                                {song.title}
                                            </span>
                                            <span className="block truncate text-xs text-zinc-500">
                                                {song.artist}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Footer */}
                    {songs.length > 0 && (
                        <div className="border-t border-white/[0.06] bg-white/[0.02] px-4 py-2.5">
                            <p className="text-center text-[10px] font-medium text-zinc-600">
                                {songs.length} suggestion{songs.length !== 1 ? "s" : ""} • Drag to move
                            </p>
                        </div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
}
