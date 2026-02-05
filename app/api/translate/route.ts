import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { text, target, type } = await request.json(); // type: 'sentence' | 'word'

        if (!text) {
            return NextResponse.json({ error: "No text provided" }, { status: 400 });
        }

        const targetLang = target || 'en';
        // dt=t (translation), dt=bd (dictionary/meaning), dt=rm (romanization - optional)
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&dt=bd&q=${encodeURIComponent(text)}`;

        const res = await fetch(url);
        if (!res.ok) throw new Error("GTX API failed");

        const data = await res.json();

        // data[0] = Array of translated segments
        // data[0][i][0] = Translated Text
        // data[1] = Array of Dictionary entries (Part of speech, [terms...], etc.) - Only present for single words usually

        if (type === 'word') {
            const translation = data[0]?.[0]?.[0] || text;

            let meaning = "";
            // Try to extract glossary/dictionary
            if (data[1]) {
                // Format: "noun: word1, word2; verb: word3..."
                meaning = data[1].map((part: any) => {
                    const pos = part[0]; // noun, verb, etc.
                    const terms = part[1]?.slice(0, 4).join(", "); // limit to 4 terms
                    return `${pos}: ${terms}`;
                }).join("\n");
            }

            if (!meaning) {
                meaning = `Translation: ${translation}`;
            }

            return NextResponse.json({ translation, meaning });

        } else {
            // Sentence mode: Join all segments
            const translation = data[0].map((part: any) => part[0]).join("");
            return NextResponse.json({ translation });
        }

    } catch (e) {
        console.error("Translation Proxy Error:", e);
        return NextResponse.json({ error: "Translation failed" }, { status: 500 });
    }
}
