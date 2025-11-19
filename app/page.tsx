'use client'

import { useState, useEffect } from 'react'
import { BottomNav } from '@/components/BottomNav'
import { MapView } from '@/components/map/MapView'
import { AnimatePresence } from 'framer-motion'
import { ChatOverlay } from '@/components/ChatOverlay'
import { ItineraryView } from '@/components/ItineraryView'
import { GenericListPage } from '@/components/GenericListPage'
import { CollectionsPage } from '@/components/CollectionsPage'
import { HomeView } from '@/components/HomeView'
import { ProfilePage } from '@/components/ProfilePage'
import { SettingsPage } from '@/components/SettingsPage'
import { getInitialDestinations, calculateTripRoute } from '@/app/actions'

export default function HomePage() {
  // Main View State: 'beranda' | 'palapa' | 'koleksi'
  const [activeTab, setActiveTab] = useState('beranda')

  // Side Menu Page State: null | 'umkm' | 'heritage' | 'guides' | 'settings' | 'profile'
  const [activePage, setActivePage] = useState<string | null>(null)

  const [activeCategory, setActiveCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Data State
  const [destinations, setDestinations] = useState<any[]>([])
  const [itinerary, setItinerary] = useState<any>(null)
  const [route, setRoute] = useState<any>(null)
  const [showItinerary, setShowItinerary] = useState(false)

  // Fetch initial data
  useEffect(() => {
    const loadData = async () => {
      const result = await getInitialDestinations();
      if (result.success && result.data) {
        setDestinations(result.data);
      }
    };
    loadData();
  }, []);

  // Handle Tab Change
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'beranda') {
      setActivePage(null);
    }
  };

  // Handle Side Menu Navigation
  const handleMenuNavigate = (page: string) => {
    setActivePage(page);
  };

  // Handle Itinerary Generation
  const handleItineraryGenerated = async (data: any) => {
    setItinerary(data);
    setShowItinerary(true);
    setActiveTab('beranda'); // Switch back to home to see map

    // Extract all destinations from itinerary for the map
    const allDestinations: any[] = [];
    data.days.forEach((day: any) => {
      if (day.destinations) {
        allDestinations.push(...day.destinations);
      }
    });

    // Update map markers
    const validDestinations = allDestinations.map(d => ({
      ...d,
      latitude: d.latitude || -7.7956 + (Math.random() - 0.5) * 0.1,
      longitude: d.longitude || 110.3695 + (Math.random() - 0.5) * 0.1
    }));

    setDestinations(validDestinations);

    // Calculate Route
    if (validDestinations.length > 1) {
      const routeResult = await calculateTripRoute(validDestinations.map(d => ({
        lat: d.latitude,
        lng: d.longitude,
        name: d.name
      })));

      if (routeResult.success) {
        setRoute(routeResult.data);
      }
    }
  };

  return (
    <div className="relative w-full h-[100dvh] overflow-hidden bg-slate-50 flex flex-col">

      {/* 1. Background Map Layer - Only visible in Home tab */}
      <div className="absolute inset-0 z-0">
        <MapView
          className="w-full h-full"
          center={[110.3695, -7.7956]} // Yogyakarta
          zoom={11}
          destinations={destinations}
          itineraryRoute={route}
        />
        {/* Gradient overlays */}
        <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-white/90 via-white/60 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none" />
      </div>

      {/* 2. Main UI Layer (Home Tab) */}
      {activeTab === 'beranda' && !activePage && (
        <HomeView
          destinations={destinations}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          onMenuNavigate={handleMenuNavigate}
          showItinerary={showItinerary}
        />
      )}

      {/* 3. Itinerary View Overlay (Home Tab) */}
      <AnimatePresence>
        {activeTab === 'beranda' && showItinerary && (
          <ItineraryView
            itinerary={itinerary}
            onClose={() => setShowItinerary(false)}
          />
        )}
      </AnimatePresence>

      {/* 4. Chat Overlay (Palapa Bot Tab) */}
      <div className={activeTab === 'palapa' ? 'block' : 'hidden'}>
        <ChatOverlay onItineraryGenerated={handleItineraryGenerated} />
      </div>

      {/* 5. Collections Page (Koleksi Tab) */}
      <AnimatePresence>
        {activeTab === 'koleksi' && (
          <CollectionsPage
            onBack={() => setActiveTab('beranda')}
            onSelectItinerary={(saved) => {
              console.log('Load itinerary:', saved);
              setActiveTab('beranda');
            }}
          />
        )}
      </AnimatePresence>

      {/* 6. Secondary Pages (UMKM, Heritage, Guides, Profile, Settings) */}
      <AnimatePresence>
        {activePage === 'profile' && (
          <ProfilePage onBack={() => setActivePage(null)} />
        )}
        {activePage === 'settings' && (
          <SettingsPage onBack={() => setActivePage(null)} />
        )}
        {['umkm', 'heritage', 'guides'].includes(activePage || '') && (
          <GenericListPage
            type={activePage as any}
            onBack={() => setActivePage(null)}
          />
        )}
      </AnimatePresence>

      {/* 7. Bottom Navigation */}
      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />

    </div>
  )
}