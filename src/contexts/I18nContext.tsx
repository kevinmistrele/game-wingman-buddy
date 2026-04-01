import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { translations, type Locale, type TranslationKey } from "@/lib/i18n";

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextType>({
  locale: "pt-BR",
  setLocale: () => {},
  t: (key) => key,
});

export const useI18n = () => useContext(I18nContext);

const STORAGE_KEY = "app_locale";

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return (stored === "en" || stored === "pt-BR") ? stored : "pt-BR";
  });

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    localStorage.setItem(STORAGE_KEY, l);
  };

  const t = (key: TranslationKey): string => {
    return translations[locale]?.[key] ?? translations["pt-BR"][key] ?? key;
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
};
