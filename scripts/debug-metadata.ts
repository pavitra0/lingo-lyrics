import { searchSongs } from '../lib/api/jiosaavn';
import 'dotenv/config';

async function test() {
    console.log("Searching for 'Dhuranndhar'...");
    try {
        const results = await searchSongs("Dhuranndhar");
        if (results.length > 0) {
            const song = results[0];
            console.log("Song Metadata:");
            console.log("ID:", song.id);
            console.log("Title:", song.name);
            console.log("Language (Raw):", song.language);
            console.log("Has Lyrics:", song.hasLyrics);
        } else {
            console.log("No results found.");
        }
    } catch (e) {
        console.error("Error:", e as any);
    }
}

test();
