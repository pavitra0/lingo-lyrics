import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}


const LOCALE_MAP: Record<string, string> = {
  "hi": "hi-IN",
  "pa": "pa-IN",
  "gu": "gu-IN",
  "bn": "bn-IN",
  "ta": "ta-IN",
  "te": "te-IN",
  "kn": "kn-IN",
  "ml": "ml-IN",
  "ja": "ja-JP",
  "ko": "ko-KR",
  "zh": "zh-CN",
  "es": "es-ES",
  "fr": "fr-FR",
  "de": "de-DE",
  "en": "en-US",
};

export function speak(text: string, lang?: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;

  window.speechSynthesis.cancel();

  // 1. Detect language if not provided or default
  let detectedCode = lang;
  if (!detectedCode || detectedCode === 'en-US') {
    detectedCode = detectLanguage(text);
  }

  // 2. Map to BCP 47 tag
  const locale = LOCALE_MAP[detectedCode] || "en-US";

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = locale;
  utterance.rate = 0.9;

  // 3. Try to set voice explicitly (helps on some browsers)
  const voices = window.speechSynthesis.getVoices();
  const voice = voices.find(v => v.lang === locale || v.lang.startsWith(detectedCode));
  if (voice) utterance.voice = voice;

  window.speechSynthesis.speak(utterance);
}

// Simple Unicode script detection for Indian languages
export function detectLanguage(text: string): string {
  if (!text) return "en";

  // Sample first 100 chars
  const sample = text.slice(0, 100);

  // Hindi / Marathi (Devanagari)
  if (/[\u0900-\u097F]/.test(sample)) return "hi";

  // Punjabi (Gurmukhi)
  if (/[\u0A00-\u0A7F]/.test(sample)) return "pa";

  // Gujarati
  if (/[\u0A80-\u0AFF]/.test(sample)) return "gu";

  // Bengali
  if (/[\u0980-\u09FF]/.test(sample)) return "bn";

  // Tamil
  if (/[\u0B80-\u0BFF]/.test(sample)) return "ta";

  // Telugu
  if (/[\u0C00-\u0C7F]/.test(sample)) return "te";

  // Kannada
  if (/[\u0C80-\u0CFF]/.test(sample)) return "kn";

  // Malayalam
  if (/[\u0D00-\u0D7F]/.test(sample)) return "ml";

  // Japanese (Hiragana/Katakana/Kanji)
  if (/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(sample)) return "ja";

  // Korean (Hangul)
  if (/[\uAC00-\uD7AF]/.test(sample)) return "ko";

  // Chinese (Han)
  if (/[\u4E00-\u9FFF]/.test(sample)) return "zh";

  return "en"; // Default fallback
}
