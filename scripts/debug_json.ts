
import axios from "axios";

async function testComprehensive() {
    const BASE_URL = "https://lrclib.net/api/search";

    // We suspect "Someday, The Boy" is the key
    const queries = [
        "Someday, The Boy",
        "그때 그 아인"
    ];

    const results: Record<string, any> = {};

    for (const q of queries) {
        try {
            const encoded = encodeURIComponent(q);
            const url = `${BASE_URL}?q=${encoded}`;
            const { data } = await axios.get(url);
            results[q] = data.length;
        } catch (e) {
            results[q] = "Error: " + (e as any).message;
        }
    }
    console.log(JSON.stringify(results, null, 2));
}

testComprehensive();
