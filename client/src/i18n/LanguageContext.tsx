import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  getTranslation,
  languages,
  type Language,
  type TranslationKeys,
} from "./index";

type LanguageContextType = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: TranslationKeys;
};

const LanguageContext =
  createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem("agrolynk-language");

    if (saved && saved in languages) {
      return saved as Language;
    }

    return "en";
  });

  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage);

    localStorage.setItem(
      "agrolynk-language",
      newLanguage,
    );
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t: getTranslation(language),
    }),
    [language],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error(
      "useLanguage must be used inside LanguageProvider",
    );
  }

  return context;
}