export const getSearchSuggestions = async (query: string): Promise<string[]> => {
    if (!query || query.trim().length === 0) return [];

    try {
        // Primary: Invidious API
        const res = await fetch(`https://inv.vern.cc/api/v1/search/suggestions?q=${encodeURIComponent(query)}`);
        if (!res.ok) throw new Error("Invidious API failed");

        const data = await res.json();
        // Format: { "query": "...", "suggestions": ["...", "..."] }
        return data.suggestions;

    } catch (error) {
        console.warn("Primary suggestion API failed, switching to fallback:", error);

        try {
            // Fallback: Google Suggest
            // Note: This often requires a proxy due to CORS in browser, 
            // but Next.js Server Actions or API routes are better. 
            // Since this is a client component, direct fetch might block CORS.
            // Let's try direct fetch since 'inv.vern.cc' likely allows CORS.
            // Google usually blocks CORS. 
            // Alternative: DuckDuckGo? 'https://duckduckgo.com/ac/?q='

            const res = await fetch(`https://duckduckgo.com/ac/?q=${encodeURIComponent(query)}&type=list`);
            if (!res.ok) throw new Error("Fallback API failed");
            const data = await res.json();
            // DDG returns: [ { phrase: "..." }, ... ]
            return data.map((item: any) => item.phrase);

        } catch (fallbackError) {
            console.error("All suggestion APIs failed:", fallbackError);
            return [];
        }
    }
};
