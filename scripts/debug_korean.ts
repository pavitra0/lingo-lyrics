
import { getSyncedLyrics, searchLyrics } from "../lib/api/lyrics";

async function testKoreanLyrics() {
    const track = "그때 그 아인";
    const artist = "Feel Kim";

    console.log("--- Testing getSyncedLyrics ---");
    const result = await getSyncedLyrics(track, artist, undefined, undefined);
    console.log("Result:", result ? "Found" : "Not Found");
    if (result) console.log(result.name, result.artistName);

    console.log("\n--- Testing Raw Search ---");
    const searchRes = await searchLyrics(`${track} ${artist}`);
    console.log(`Found ${searchRes.length} results`);
    searchRes.forEach(s => console.log(`- ${s.name} by ${s.artistName} (ID: ${s.id})`));
}

testKoreanLyrics();
