import en from "./en";
import hi from "./hi";
import mr from "./mr";
import te from "./te";
import ta from "./ta";
import kn from "./kn";
import bn from "./bn";
import gu from "./gu";
import pa from "./pa";
import ml from "./ml";

export const languages = {
  en: "English",
  hi: "Hindi",
  mr: "Marathi",
  te: "Telugu",
  ta: "Tamil",
  kn: "Kannada",
  bn: "Bengali",
  gu: "Gujarati",
  pa: "Punjabi",
  ml: "Malayalam",
} as const;

export type Language = keyof typeof languages;

export const translations = {
  en,
  hi,
  mr,
  te,
  ta,
  kn,
  bn,
  gu,
  pa,
  ml,
} as const;

export type TranslationKeys = typeof en;

export function getTranslation(
  language: Language,
): TranslationKeys {
  return translations[language] as TranslationKeys;
}