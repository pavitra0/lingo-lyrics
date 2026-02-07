
import { getSongById } from "../lib/api/jiosaavn";
import { getSyncedLyrics } from "../lib/api/lyrics";

const testId = "TtuJLWrj"; // Co2 by Prateek Kuhad

async function verify() {
    console.log("Testing getSongById for ID:", testId);
    try {
        const song = await getSongById(testId);
        console.log("Fetched Song Data:", JSON.stringify(song, null, 2));

        console.log("---------------------------------------------------");
        console.log("Name:", song.name);
        console.log("Primary Artists:", song.primaryArtists);
        console.log("Duration:", song.duration);

        let artist = song.primaryArtists;
        if (!artist && typeof (song as any).artists === 'object') {
            // Mimicking the Page logic just in case, though getSongById usually handles it
            const primary = (song as any).artists.primary;
            if (Array.isArray(primary) && primary.length > 0) {
                artist = primary[0].name;
                console.log("Extracted artist manually:", artist);
            }
        }

        if (artist === "Prateek Kuhad") {
            console.log("SUCCESS: Artist identified as Prateek Kuhad.");
        } else {
            console.log("FAILURE: Artist mismatch:", artist);
        }

        console.log(`Fetching Lyrics for: '${song.name}' by '${artist}'`);
        const lyrics = await getSyncedLyrics(song.name, artist, song.album?.name, parseInt(song.duration));

        if (lyrics) {
            console.log("SUCCESS: Lyrics fetched!", lyrics.syncedLyrics ? "Has Sync" : "No Sync");
        } else {
            console.log("FAILURE: getSyncedLyrics returned null.");
        }

    } catch (e) {
        console.error("Error running verification:", e as any);
    }
}

verify();
