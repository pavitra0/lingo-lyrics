import axios from "axios";

export const translateText = async (text: string, targetLanguage: string = "en") => {
    try {
        const { data } = await axios.post<{ translation: string }>("/api/translate", {
            text,
            target: targetLanguage,
            type: "sentence"
        });
        return data.translation || text;
    } catch (e) {
        console.error("Translation failed", e);
        return text; // Fallback to original
    }
};

export const getWordMeaning = async (word: string, context: string) => {
    try {
        const { data } = await axios.post<{ meaning: string; translation: string }>("/api/translate", {
            text: word,
            target: "en", // Always definition in English for now
            type: "word"
        });
        return {
            meaning: data.meaning || "No definition found",
            translation: data.translation || word
        };
    } catch (e) {
        console.error("Word meaning failed", e);
        return {
            meaning: "Could not fetch meaning",
            translation: word
        };
    }
};
