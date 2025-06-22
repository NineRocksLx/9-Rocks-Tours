import { useState, useEffect } from 'react';
import i18n from './i18n';

// Hook customizado para usar traduções em React
export const useTranslation = () => {
  const [language, setLanguage] = useState(i18n.getCurrentLanguage());

  useEffect(() => {
    const handleLanguageChange = (event) => {
      setLanguage(event.detail);
    };

    document.addEventListener('languageChanged', handleLanguageChange);
    return () => {
      document.removeEventListener('languageChanged', handleLanguageChange);
    };
  }, []);

  const t = (key, replacements = {}) => {
    return i18n.t(key, replacements);
  };

  return { t, language };
};

export default useTranslation;