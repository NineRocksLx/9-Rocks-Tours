import { useState, useEffect, useCallback, useMemo } from 'react';
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

  // ✅ useCallback garante que a função 't' tem uma referência estável,
  // que só muda se a língua (language) mudar.
  const t = useCallback((key, replacements = {}) => {
    return i18n.t(key, replacements);
  }, [language]); // Adicionamos 'language' como dependência para garantir que a tradução é reavaliada na troca de idioma

  const getCurrentLanguage = useCallback(() => {
    return language;
  }, [language]);

  // ✅ useMemo garante que o objeto retornado só é recriado quando necessário,
  // quebrando o ciclo de renderização infinito.
  return useMemo(() => ({
    t,
    language,
    getCurrentLanguage
  }), [t, language, getCurrentLanguage]);
};

export default useTranslation;
