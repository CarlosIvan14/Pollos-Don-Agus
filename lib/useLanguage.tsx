'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Language } from './i18n/index';
import { getTranslation } from './i18n/index';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: ReturnType<typeof getTranslation>;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('es');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Get language from localStorage
    const stored = localStorage.getItem('language') as Language | null;
    if (stored && (stored === 'es' || stored === 'en')) {
      setLanguageState(stored);
    }
    setMounted(true);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  const value = {
    language,
    setLanguage,
    t: getTranslation(language),
  };

  // Avoid hydration mismatch by rendering only after mount
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    // Return default values if context is not available
    return {
      language: 'es' as Language,
      setLanguage: () => {},
      t: getTranslation('es'),
    };
  }
  return context;
}
