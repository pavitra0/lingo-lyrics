import { LingoDotDevEngine } from 'lingo.dev/sdk';
import 'dotenv/config';

const lingo = new LingoDotDevEngine({
    apiKey: "api_oi56qfpphild8thfunpovh49",
});

async function test() {
    console.log("Testing Lingo.dev...");
    try {
        const text = "ਨਾਲ ਰੋਂਦੇ ਜੋਗੀ ਦੇ"; // Punjabi text from screenshot
        const source = "pa"; // Punjabi code
        const target = "en";

        console.log(`Translating '${text}' from ${source} to ${target}...`);
        const res = await lingo.localizeText(text, {
            sourceLocale: source,
            targetLocale: target
        });
        console.log("Success:", res);
    } catch (e) {
        console.error("Failed:", e as any);
    }
}

test();
