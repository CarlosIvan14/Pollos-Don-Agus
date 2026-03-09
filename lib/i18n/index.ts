import { es } from './es';
import { en } from './en';

export type Language = 'es' | 'en';

export const translations = {
  es,
  en,
};

export const getTranslation = (lang: Language) => {
  return translations[lang] || translations.es;
};
