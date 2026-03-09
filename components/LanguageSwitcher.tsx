'use client';

import { useLanguage } from '@/lib/useLanguage';

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-2 bg-zinc-800/50 rounded-lg border border-zinc-700 p-1">
      <button
        onClick={() => setLanguage('es')}
        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
          language === 'es'
            ? 'bg-amber-600 text-white'
            : 'text-zinc-400 hover:text-white'
        }`}
        title="Español"
      >
        🇲🇽 ES
      </button>
      <button
        onClick={() => setLanguage('en')}
        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
          language === 'en'
            ? 'bg-amber-600 text-white'
            : 'text-zinc-400 hover:text-white'
        }`}
        title="English"
      >
        🇺🇸 EN
      </button>
    </div>
  );
}
