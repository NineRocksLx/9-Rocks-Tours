import React, { useState } from 'react';
import TourOverview from './TourOverview';
import TourItinerary from './TourItinerary';
import TourTripDetails from './TourTripDetails'; // só se necessário
import TourAccommodation from './TourAccommodation';
import TourPricingDates from './TourPricingDates';


const TourDetails = ({ tour }) => {
  const [activeTab, setActiveTab] = useState('Overview');

  const tabs = ['Overview', 'Itinerary', 'Trip Details', 'Accommodation', 'Pricing & Tour Dates'];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Overview':
        return <TourOverview tour={tour} />;
      case 'Itinerary':
        return <TourItinerary itinerary={tour.itinerary} />;
      case 'Trip Details':
        return <TourTripDetails details={tour.details} />;
      case 'Accommodation':
        return <TourAccommodation accommodation={tour.accommodation} />;
      case 'Pricing & Tour Dates':
        return <TourPricingDates pricing={tour.pricing} dates={tour.dates} />;
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6">{tour.name}</h1>

      <nav className="border-b mb-6">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`px-4 py-2 ${
              activeTab === tab
                ? 'border-b-2 border-indigo-600 text-indigo-600'
                : 'text-gray-600'
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </nav>

      <section>
        {renderTabContent()}
      </section>
    </div>
  );
};

export default TourDetails;
