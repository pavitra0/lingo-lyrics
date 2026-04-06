export const getSearchSuggestions = async (query: string): Promise<string[]> => {
    if (!query || query.trim().length === 0) return [];

    try {
        const res = await fetch(`/api/search-suggestions?q=${encodeURIComponent(query)}`, {
            cache: "no-store",
        });

        if (!res.ok) {
            throw new Error(`Suggestion API failed with status ${res.status}`);
        }

        const data = await res.json();
        return Array.isArray(data)
            ? data.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
            : [];
    } catch (error) {
        console.error("Search suggestions failed:", error);
        return [];
    }
};
