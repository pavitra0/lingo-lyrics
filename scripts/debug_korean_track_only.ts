
import { searchLyrics } from "../lib/api/lyrics";

async function testTrackOnly() {
    const track = "그때 그 아인";

    console.log(`\n--- Searching Track Only: "${track}" ---`);
    const searchRes = await searchLyrics(track);
    console.log(`Found ${searchRes.length} results`);
    searchRes.forEach(s => console.log(`- "${s.trackName}" by "${s.artistName}" (ID: ${s.id})`));
}

testTrackOnly();
