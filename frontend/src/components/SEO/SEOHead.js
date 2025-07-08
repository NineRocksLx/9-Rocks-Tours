import React from 'react';
import { Helmet } from 'react-helmet-async';
import { SEO_CONFIG } from '../../utils/seoConfig';

// Este componente agora apenas renderiza os dados SEO que recebe como props.
export const SEOHead = ({ data }) => {
  if (!data) {
    return null; // Não renderiza nada se não houver dados
  }

  const { title, description, keywords, noindex, structuredData, url, type, lang, ogImage } = data;

  // Gera as URLs alternativas para hreflang
  const alternateUrls = SEO_CONFIG.supportedLanguages.map(altLang => {
    const cleanPath = window.location.pathname.replace(/^\/(en|es)/, '');
    return {
      lang: altLang,
      url: `${SEO_CONFIG.baseUrl}${altLang !== 'pt' ? `/${altLang}` : ''}${cleanPath}`
    };
  });

  return (
    <Helmet>
      {/* META TAGS FUNDAMENTAIS */}
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      {noindex && <meta name="robots" content="noindex, follow" />}
      <link rel="canonical" href={url} />
      
      {/* HREFLANG TAGS */}
      {alternateUrls.map(({ lang, url }) => (
        <link key={lang} rel="alternate" hrefLang={lang} href={url} />
      ))}
      <link rel="alternate" hrefLang="x-default" href={SEO_CONFIG.baseUrl} />
      
      {/* OPEN GRAPH */}
      <meta property="og:type" content={type === 'tour' ? 'product' : 'website'} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={url} />
      <meta property="og:site_name" content="9 Rocks Tours" />
      <meta property="og:locale" content={lang === 'pt' ? 'pt_PT' : lang === 'en' ? 'en_US' : 'es_ES'} />
      
      {/* TWITTER CARDS */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      
      {/* SCHEMA.ORG */}
      {structuredData && structuredData.length > 0 && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
      
      {/* LANGUAGE */}
      <html lang={lang === 'pt' ? 'pt-PT' : lang === 'es' ? 'es-ES' : 'en-US'} />
    </Helmet>
  );
};