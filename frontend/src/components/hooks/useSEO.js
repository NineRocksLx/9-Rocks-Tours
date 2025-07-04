import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { SEO_CONFIG } from '../utils/seoConfig';

export const useSEO = () => {
  const location = useLocation();
  const [currentLang, setCurrentLang] = useState(SEO_CONFIG.defaultLanguage);
  const [seoData, setSeoData] = useState(null);
  const [loading, setLoading] = useState(false);

  // 🔍 DETECÇÃO INTELIGENTE DE IDIOMA
  useEffect(() => {
    const pathLang = location.pathname.split('/')[1];
    if (SEO_CONFIG.supportedLanguages.includes(pathLang)) {
      setCurrentLang(pathLang);
    } else {
      // AUTO-DETECÇÃO BASEADA NO BROWSER
      const browserLang = navigator.language.slice(0, 2);
      const detectedLang = SEO_CONFIG.supportedLanguages.includes(browserLang) 
        ? browserLang 
        : SEO_CONFIG.defaultLanguage;
      setCurrentLang(detectedLang);
    }
  }, [location]);

  // 🔗 BUSCAR DADOS SEO DO BACKEND
  const fetchSEOData = async (page = 'home') => {
    if (loading) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${SEO_CONFIG.apiUrl}/api/seo/${page}/${currentLang}`);
      if (response.ok) {
        const data = await response.json();
        setSeoData(data);
        return data;
      }
    } catch (error) {
      console.error('Erro ao buscar dados SEO:', error);
    } finally {
      setLoading(false);
    }
    return null;
  };

  return {
    currentLang,
    setCurrentLang,
    marketConfig: SEO_CONFIG.markets[currentLang],
    seoData,
    fetchSEOData,
    loading
  };
};