export const useTourSEO = (tourData) => {
  const { currentLang } = useSEO();
  
  if (!tourData) return null;

  // 🔥 SEO DINÂMICO BASEADO NOS DADOS DO TOUR
  const generateTourSEO = () => {
    const baseTitle = {
      pt: `${tourData.name} - Tour Exclusivo | 9 Rocks Tours`,
      en: `${tourData.name} - Exclusive Tour | 9 Rocks Tours`, 
      es: `${tourData.name} - Tour Exclusivo | 9 Rocks Tours`
    };

    const baseDescription = {
      pt: `Aventura épica: ${tourData.name}. ${tourData.shortDescription} Vagas limitadas, experiência garantida!`,
      en: `Epic adventure: ${tourData.name}. ${tourData.shortDescription} Limited spots, guaranteed experience!`,
      es: `Aventura épica: ${tourData.name}. ${tourData.shortDescription} Plazas limitadas, ¡experiencia garantizada!`
    };

    return {
      title: baseTitle[currentLang],
      description: baseDescription[currentLang],
      keywords: `${tourData.name}, ${tourData.location}, tours portugal, aventuras ${tourData.location}`,
      schema: {
        "@type": "TouristTrip",
        "name": tourData.name,
        "description": tourData.description,
        "image": tourData.images,
        "offers": {
          "@type": "Offer",
          "price": tourData.price,
          "priceCurrency": "EUR",
          "availability": "https://schema.org/InStock"
        }
      }
    };
  };

  return generateTourSEO();
}