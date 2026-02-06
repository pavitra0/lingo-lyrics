import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}


export function speak(text: string, lang: string = 'en-US') {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = 0.9;
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

  return "en"; // Default fallback
}
