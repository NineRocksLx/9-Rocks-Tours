import React from 'react';
import { useSEO } from '../../hooks/useSEO';

export const LanguageSwitcher = () => {
  const { currentLang } = useSEO();
  
  const languages = {
    pt: { name: "Português", flag: "🇵🇹", cta: "Versão PT" },
    en: { name: "English", flag: "🇬🇧", cta: "English Version" },
    es: { name: "Español", flag: "🇪🇸", cta: "Versión ES" }
  };

  const handleLanguageChange = (newLang) => {
    // 🔄 REDIRECIONAMENTO INTELIGENTE
    const currentPath = window.location.pathname;
    const pathWithoutLang = currentPath.replace(/^\/(pt|en|es)/, '');
    const newPath = newLang === 'pt' ? pathWithoutLang || '/' : `/${newLang}${pathWithoutLang}`;
    
    window.location.href = newPath;
  };

  return (
    <div className="language-switcher relative">
      <div className="current-language flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
        <span className="flag text-lg">{languages[currentLang].flag}</span>
        <span className="name font-medium">{languages[currentLang].name}</span>
        <svg className="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </div>
      
      <div className="language-dropdown absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
        {Object.entries(languages).map(([code, lang]) => (
          <button
            key={code}
            onClick={() => handleLanguageChange(code)}
            className={`language-option flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${code === currentLang ? 'bg-blue-50 text-blue-600' : ''}`}
            title={lang.cta}
          >
            <span className="flag text-lg">{lang.flag}</span>
            <span className="name">{lang.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};