export const MUSIC_PLACEHOLDER_SRC = "/placeholder-cover.svg";
const coverPaletteCache = new Map<string, CoverThemePalette>();

const THEME_OVERRIDE_KEYS = [
    "--background",
    "--foreground",
    "--primary",
    "--secondary",
    "--surface",
    "--surface-hover",
    "--accent",
] as const;

export interface CoverThemePalette {
    "--background": string;
    "--foreground": string;
    "--primary": string;
    "--secondary": string;
    "--surface": string;
    "--surface-hover": string;
    "--accent": string;
}

interface RgbColor {
    r: number;
    g: number;
    b: number;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const mix = (base: RgbColor, target: RgbColor, amount: number): RgbColor => ({
    r: Math.round(base.r + (target.r - base.r) * amount),
    g: Math.round(base.g + (target.g - base.g) * amount),
    b: Math.round(base.b + (target.b - base.b) * amount),
});

const toHex = ({ r, g, b }: RgbColor) =>
    `#${[r, g, b].map((value) => clamp(value, 0, 255).toString(16).padStart(2, "0")).join("")}`;

const getLuminance = ({ r, g, b }: RgbColor) => (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

const getSaturation = ({ r, g, b }: RgbColor) => {
    const max = Math.max(r, g, b) / 255;
    const min = Math.min(r, g, b) / 255;
    return max === 0 ? 0 : (max - min) / max;
};

export const isUnavailableMusicImage = (src?: string | null) => {
    if (!src) return true;

    const normalizedSrc = src.toLowerCase();
    return (
        normalizedSrc.includes("default_playlist") ||
        normalizedSrc.includes("default_album") ||
        normalizedSrc.includes("default_artist") ||
        normalizedSrc.includes("/img/default") ||
        normalizedSrc.includes("placeholder")
    );
};

export const resolveMusicImageSrc = (src?: string | null) =>
    isUnavailableMusicImage(src) ? MUSIC_PLACEHOLDER_SRC : src;

export const applyCoverThemePalette = (palette: CoverThemePalette) => {
    const root = document.documentElement;
    THEME_OVERRIDE_KEYS.forEach((key) => root.style.setProperty(key, palette[key]));
};

export const clearCoverThemePalette = () => {
    const root = document.documentElement;
    THEME_OVERRIDE_KEYS.forEach((key) => root.style.removeProperty(key));
};

export const extractCoverThemePalette = async (src: string): Promise<CoverThemePalette> => {
    const resolvedSrc = resolveMusicImageSrc(src);
    if (!resolvedSrc || resolvedSrc === MUSIC_PLACEHOLDER_SRC) {
        throw new Error("No real cover image available for palette extraction.");
    }

    const cachedPalette = coverPaletteCache.get(resolvedSrc);
    if (cachedPalette) {
        return cachedPalette;
    }

    const image = await loadImage(getPaletteSampleSrc(resolvedSrc));
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d", { willReadFrequently: true });

    if (!context) {
        throw new Error("Canvas context is unavailable.");
    }

    const sampleSize = 40;
    canvas.width = sampleSize;
    canvas.height = sampleSize;
    context.drawImage(image, 0, 0, sampleSize, sampleSize);

    const { data } = context.getImageData(0, 0, sampleSize, sampleSize);
    const buckets = new Map<string, { color: RgbColor; score: number; count: number }>();

    let totalWeight = 0;
    let average = { r: 0, g: 0, b: 0 };

    for (let index = 0; index < data.length; index += 4) {
        const alpha = data[index + 3];
        if (alpha < 160) continue;

        const color = { r: data[index], g: data[index + 1], b: data[index + 2] };
        const saturation = getSaturation(color);
        const luminance = getLuminance(color);
        const weight = 0.45 + saturation * 1.25 + (1 - Math.abs(luminance - 0.52));

        totalWeight += weight;
        average = {
            r: average.r + color.r * weight,
            g: average.g + color.g * weight,
            b: average.b + color.b * weight,
        };

        const quantized = {
            r: Math.round(color.r / 24) * 24,
            g: Math.round(color.g / 24) * 24,
            b: Math.round(color.b / 24) * 24,
        };
        const key = `${quantized.r}-${quantized.g}-${quantized.b}`;
        const bucketScore = weight * (0.7 + saturation) * (luminance > 0.08 && luminance < 0.9 ? 1 : 0.4);
        const current = buckets.get(key);

        if (current) {
            current.score += bucketScore;
            current.count += 1;
        } else {
            buckets.set(key, { color: quantized, score: bucketScore, count: 1 });
        }
    }

    if (totalWeight === 0 || buckets.size === 0) {
        throw new Error("Could not derive a cover palette.");
    }

    const averageColor = {
        r: Math.round(average.r / totalWeight),
        g: Math.round(average.g / totalWeight),
        b: Math.round(average.b / totalWeight),
    };

    const accentBucket = [...buckets.values()].sort((left, right) => right.score - left.score)[0];
    const accentBase = accentBucket?.color || averageColor;
    const paletteBase = mix(averageColor, accentBase, 0.35);

    const background = mix(paletteBase, { r: 0, g: 0, b: 0 }, 0.82);
    const surface = mix(paletteBase, { r: 0, g: 0, b: 0 }, 0.72);
    const surfaceHover = mix(paletteBase, { r: 255, g: 255, b: 255 }, 0.14);
    const accent = mix(accentBase, { r: 255, g: 255, b: 255 }, 0.16);
    const foreground = getLuminance(background) < 0.42 ? { r: 245, g: 245, b: 245 } : { r: 20, g: 20, b: 20 };
    const primary = mix(accent, foreground, getLuminance(accent) > 0.65 ? 0.15 : 0.05);
    const secondary = mix(foreground, background, 0.42);

    const palette = {
        "--background": toHex(background),
        "--foreground": toHex(foreground),
        "--primary": toHex(primary),
        "--secondary": toHex(secondary),
        "--surface": toHex(surface),
        "--surface-hover": toHex(surfaceHover),
        "--accent": toHex(accent),
    };

    coverPaletteCache.set(resolvedSrc, palette);
    return palette;
};

const getPaletteSampleSrc = (src: string) => {
    if (typeof window === "undefined") return src;
    if (src.startsWith("/") || src.startsWith("data:") || src.startsWith("blob:")) return src;
    if (/^https?:\/\//i.test(src)) {
        return `/_next/image?url=${encodeURIComponent(src)}&w=128&q=75`;
    }
    return src;
};

const loadImage = (src: string) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.crossOrigin = "anonymous";
        image.decoding = "async";
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error(`Failed to load image: ${src}`));
        image.src = src;
    });
