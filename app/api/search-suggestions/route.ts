import { NextResponse } from "next/server";

type SuggestionPayload =
    | string[]
    | {
        suggestions?: unknown;
        data?: unknown;
        results?: unknown;
        items?: unknown;
    };

const isSuggestionRecord = (value: unknown): value is Exclude<SuggestionPayload, string[]> => {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
};

const pickSuggestionText = (value: unknown): string | null => {
    if (typeof value === "string") {
        return value.trim() || null;
    }

    if (value && typeof value === "object") {
        const item = value as Record<string, unknown>;
        const candidate =
            item.query ??
            item.text ??
            item.title ??
            item.label ??
            item.suggestion ??
            item.name;

        return typeof candidate === "string" && candidate.trim().length > 0
            ? candidate.trim()
            : null;
    }

    return null;
};

const normalizeSuggestions = (payload: unknown): string[] => {
    const record = isSuggestionRecord(payload) ? payload : null;
    const source = Array.isArray(payload)
        ? payload
        : Array.isArray(record?.suggestions)
            ? record.suggestions
            : Array.isArray(record?.data)
                ? record.data
                : Array.isArray(record?.results)
                    ? record.results
                    : Array.isArray(record?.items)
                        ? record.items
                        : [];

    return source
        .map(pickSuggestionText)
        .filter((item): item is string => Boolean(item));
};

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim() || "";

    if (!query) {
        return NextResponse.json([]);
    }

    try {
        const upstream = await fetch(
            `https://ytify.pp.ua/search-suggestions?q=${encodeURIComponent(query)}&music=true`,
            {
                cache: "no-store",
                headers: {
                    Accept: "application/json",
                },
            }
        );

        if (!upstream.ok) {
            console.error("Suggestion proxy upstream error:", upstream.status, upstream.statusText);
            return NextResponse.json([]);
        }

        const data = (await upstream.json()) as SuggestionPayload;
        return NextResponse.json(normalizeSuggestions(data));
    } catch (error) {
        console.error("Suggestion proxy failed:", error);
        return NextResponse.json([]);
    }
}
