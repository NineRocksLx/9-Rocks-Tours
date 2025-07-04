export const SEOBreadcrumbs = ({ items }) => {
  const { currentLang } = useSEO();
  
  const breadcrumbLabels = {
    pt: { home: "Início", tours: "Tours", booking: "Reservar", about: "Sobre" },
    en: { home: "Home", tours: "Tours", booking: "Book", about: "About" },
    es: { home: "Inicio", tours: "Tours", booking: "Reservar", about: "Acerca" }
  };

  const schemaData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": breadcrumbLabels[currentLang][item.key] || item.name,
      "item": item.url || "#"
    }))
  };

  return (
    <>
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <ol className="breadcrumb-list">
          {items.map((item, index) => (
            <li key={item.key} className="breadcrumb-item">
              {index < items.length - 1 ? (
                <a href={item.url} className="breadcrumb-link">
                  {breadcrumbLabels[currentLang][item.key] || item.name}
                </a>
              ) : (
                <span className="breadcrumb-current">
                  {breadcrumbLabels[currentLang][item.key] || item.name}
                </span>
              )}
              {index < items.length - 1 && <span className="breadcrumb-separator">›</span>}
            </li>
          ))}
        </ol>
      </nav>
      
      <script type="application/ld+json">
        {JSON.stringify(schemaData)}
      </script>
    </>
  );
}