
import axios from "axios";

async function testComprehensive() {
    const BASE_URL = "https://lrclib.net/api/search";

    const queries = [
        "Dynamite BTS",
        "Someday, The Boy",
        "그때 그 아인",
        "Kim Feel"
    ];

    for (const q of queries) {
        console.log(`\n--- Searching: "${q}" ---`);
        try {
            const encoded = encodeURIComponent(q);
            const url = `${BASE_URL}?q=${encoded}`;
            console.log(`URL: ${url}`);

            const { data } = await axios.get(url);
            console.log(`Found ${data.length} results`);
            if (data.length > 0) {
                console.log(`Top result: ${data[0].trackName} by ${data[0].artistName}`);
            }
        } catch (e) {
            console.error("Error:", (e as any).message);
        }
    }
}

testComprehensive();
