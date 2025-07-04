export const SEO_CONFIG = {
  baseUrl: "https://9rocks.pt", // ✅ CORRIGIDO - igual ao backend
  defaultLanguage: "pt",
  supportedLanguages: ["pt", "en", "es"],
  
  // 🔗 INTEGRAÇÃO COM BACKEND
  apiUrl: "http://localhost:8000", // Seu backend FastAPI
  
  // 🎯 CONFIGURAÇÕES POR MERCADO
  markets: {
    pt: {
      region: "Portugal",
      currency: "EUR",
      phone: "+351963366458",
      businessHours: "09:00-18:00 WET"
    },
    en: {
      region: "International", 
      currency: "EUR",
      phone: "+351963366458",
      businessHours: "09:00-18:00 GMT"
    },
    es: {
      region: "España",
      currency: "EUR", 
      phone: "+351963366458",
      businessHours: "09:00-18:00 CET"
    }
  },
  
  // 🖼️ ASSETS OTIMIZADOS
  images: {
    ogImage: "/images/og-9rocks-tours.jpg",
    twitterCard: "/images/twitter-9rocks-tours.jpg",
    logo: "/images/logo-9rocks-tours.png"
  }
};
