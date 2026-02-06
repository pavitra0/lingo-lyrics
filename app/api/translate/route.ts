import { NextResponse } from 'next/server';
import { LingoDotDevEngine } from 'lingo.dev/sdk';

const lingo = new LingoDotDevEngine({
    apiKey: process.env.LINGO_API_KEY || "",
});

export async function POST(request: Request) {
    try {
        const { text, target, source, type } = await request.json(); // type: 'sentence' | 'word'

        // Debug Env
        if (!process.env.LINGO_API_KEY) {
            console.error("CRITICAL: LINGO_API_KEY is missing in process.env");
            return NextResponse.json({ error: "Server Configuration Error: API Key Missing" }, { status: 500 });
        }

        if (!text) {
            return NextResponse.json({ error: "No text provided" }, { status: 400 });
        }

        const targetLang = target || 'en';
        // Don't default to 'en', let SDK handle auto-detection or treat as unknown
        const sourceLang = source;

        // Guard: Only if BOTH are known and identical
        if (sourceLang && targetLang === sourceLang) {
            console.log("Source and target are the same, returning original text.");
            return NextResponse.json({ translation: text });
        }

        // Lingo.dev (AI) Translation
        let translation = text;
        let meaning = "";

        try {
            console.log(`Translating "${text}" from ${sourceLang || 'AUTO'} to ${targetLang}`); // Debug log
            // Lingo.dev SDK uses localizeText
            // Pass undefined for sourceLocale to trigger auto-detection (if supported) 
            // or let generic model handle it.
            translation = await lingo.localizeText(text, {
                sourceLocale: sourceLang, // Can be undefined
                targetLocale: targetLang
            });
        } catch (err) {
            console.error("Lingo.dev translation failed:", err);
            // Return the specific error message to the client for debugging
            return NextResponse.json({ error: `Lingo.dev Error: ${err instanceof Error ? err.message : String(err)}` }, { status: 500 });
        }

        if (type === 'word') {
            // For meaning, we currently don't have a specific Lingo endpoint for "dictionary".
            // We'll just return the translation.
            meaning = `Translation: ${translation}`;
            return NextResponse.json({ translation, meaning });
        } else {
            return NextResponse.json({ translation });
        }

    } catch (e) {
        console.error("Translation Proxy Error:", e);
        return NextResponse.json({ error: "Translation failed" }, { status: 500 });
    }
}
