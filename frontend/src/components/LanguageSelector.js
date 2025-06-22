import React, { useState, useEffect } from 'react';
import i18n from '../utils/i18n';

const LanguageSelector = ({ className = '' }) => {
  const [currentLanguage, setCurrentLanguage] = useState(i18n.getCurrentLanguage());
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleLanguageChange = (event) => {
      setCurrentLanguage(event.detail);
      setIsOpen(false);
    };

    document.addEventListener('languageChanged', handleLanguageChange);
    return () => {
      document.removeEventListener('languageChanged', handleLanguageChange);
    };
  }, []);

  const handleLanguageChange = (lang) => {
    i18n.setLanguage(lang);
    setCurrentLanguage(lang);
    setIsOpen(false);
    // Trigger page reload to update all translations
    window.location.reload();
  };

  const getFlagEmoji = (lang) => {
    const flags = {
      'pt': '🇵🇹',
      'en': '🇬🇧',
      'es': '🇪🇸'
    };
    return flags[lang] || '🏳️';
  };

  const getLanguageName = (lang) => {
    const names = {
      'pt': 'Português',
      'en': 'English',
      'es': 'Español'
    };
    return names[lang] || lang;
  };

  return (
    <div className={`relative inline-block text-left ${className}`}>
      <div>
        <button
          type="button"
          className="inline-flex items-center justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded="true"
          aria-haspopup="true"
        >
          <span className="mr-2 text-lg">{getFlagEmoji(currentLanguage)}</span>
          <span>{getLanguageName(currentLanguage)}</span>
          <svg
            className="-mr-1 ml-2 h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
          <div className="py-1" role="menu" aria-orientation="vertical">
            {i18n.getSupportedLanguages().map((lang) => (
              <button
                key={lang}
                className={`${
                  currentLanguage === lang
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-700'
                } group flex items-center px-4 py-2 text-sm hover:bg-gray-100 hover:text-gray-900 w-full text-left`}
                role="menuitem"
                onClick={() => handleLanguageChange(lang)}
              >
                <span className="mr-3 text-lg">{getFlagEmoji(lang)}</span>
                <span>{getLanguageName(lang)}</span>
                {currentLanguage === lang && (
                  <svg
                    className="ml-auto h-4 w-4 text-green-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;