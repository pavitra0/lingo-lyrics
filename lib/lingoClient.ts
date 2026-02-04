// lib/lingoClient.ts

export const translateText = async (text: string, targetLanguage: string = "es") => {
    // Mock Delay
    return new Promise<string>((resolve) => {
        setTimeout(() => {
            resolve(`[${targetLanguage}] ${text}`);
        }, 200);
    });
};

export const getWordMeaning = async (word: string, context: string) => {
    // Mock Meaning
    return new Promise<{ meaning: string; translation: string }>((resolve) => {
        setTimeout(() => {
            const cleanWord = word.replace(/[^a-zA-Z]/g, "");
            resolve({
                meaning: `Mock definition for "${cleanWord}": Used to express a specific concept in the song context.`,
                translation: `Translated ${cleanWord}`
            });
        }, 300);
    });
};
