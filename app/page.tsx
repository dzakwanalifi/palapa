'use client'

import { useState, useEffect } from 'react'
import { BottomNav } from '@/components/BottomNav'
import { MapView } from '@/components/map/MapView'
import { AnimatePresence } from 'framer-motion'
import { PalapaBotChat } from '@/components/PalapaBotChat'
import { ResultPage } from '@/components/ResultPage'
import { GenericListPage } from '@/components/GenericListPage'
import { CollectionsPage } from '@/components/CollectionsPage'
import { HomeView } from '@/components/HomeView'
import { ProfilePage } from '@/components/ProfilePage'
import { SettingsPage } from '@/components/SettingsPage'
import { LoginPage } from '@/components/LoginPage'
import { getInitialDestinations, calculateTripRoute } from '@/app/actions'

export default function HomePage() {
  // Authentication State
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentUser, setCurrentUser] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Main View State: 'beranda' | 'palapa' | 'koleksi'
  const [activeTab, setActiveTab] = useState('beranda')

  // Side Menu State
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  // Side Menu Page State: null | 'umkm' | 'heritage' | 'guides' | 'settings' | 'profile'
  const [activePage, setActivePage] = useState<string | null>(null)

  const [activeCategory, setActiveCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Data State
  const [destinations, setDestinations] = useState<any[]>([])
  const [itinerary, setItinerary] = useState<any>(null)
  const [route, setRoute] = useState<any>(null)
  const [showItinerary, setShowItinerary] = useState(false)

  // Load login state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('palapa_user')
    if (saved) {
      setCurrentUser(saved)
      setIsLoggedIn(true)
    }
    setIsLoading(false)
  }, [])

  // Fetch initial data
  useEffect(() => {
    if (isLoggedIn) {
      const loadData = async () => {
        const result = await getInitialDestinations();
        if (result.success && result.data) {
          setDestinations(result.data);
        }
      };
      loadData();
    }
  }, [isLoggedIn])

  // Handle Login
  const handleLoginSuccess = (username: string) => {
    setCurrentUser(username)
    setIsLoggedIn(true)
    localStorage.setItem('palapa_user', username)
  }

  // Handle Logout
  const handleLogout = () => {
    setCurrentUser(null)
    setIsLoggedIn(false)
    localStorage.removeItem('palapa_user')
  }

  // Show login page if not logged in
  if (isLoading) {
    return null
  }

  if (!isLoggedIn) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />
  }

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

    // Update map markers - handle both object {lat, lng} and array [lng, lat] formats
    const validDestinations = allDestinations.map(d => {
      let lat, lng;

      // Check if location is an array [longitude, latitude]
      if (Array.isArray(d.location) && d.location.length === 2) {
        lng = parseFloat(d.location[0]);
        lat = parseFloat(d.location[1]);
      }
      // Check if latitude/longitude are direct properties
      else if (d.latitude && d.longitude) {
        lat = parseFloat(d.latitude);
        lng = parseFloat(d.longitude);
      }
      // Fallback to default Yogyakarta coordinates
      else {
        lat = -7.7956 + (Math.random() - 0.5) * 0.1;
        lng = 110.3695 + (Math.random() - 0.5) * 0.1;
      }

      return {
        ...d,
        latitude: lat,
        longitude: lng
      };
    });

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
    <div className="w-full h-[100dvh] overflow-hidden bg-slate-50 flex flex-col relative">

      {/* Main Content Area - Takes up space above navbar */}
      <div className="flex-1 relative overflow-hidden">

        {/* 1. Background Map Layer - Only visible in Home tab */}
        {activeTab === 'beranda' && !activePage && !showItinerary && (
          <div className="absolute inset-0 z-0">
            <MapView
              className="w-full h-full"
              center={[110.3695, -7.7956]}
              zoom={13}
              destinations={destinations}
              itineraryRoute={route}
            />
          </div>
        )}

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
            isMenuOpen={isMenuOpen}
          />
        )}

        {/* 3. Result Page (Full-screen itinerary view) */}
        <AnimatePresence>
          {activeTab === 'beranda' && showItinerary && (
            <ResultPage
              itinerary={itinerary}
              route={route}
              destinations={destinations}
              onBack={() => setShowItinerary(false)}
              onStart={() => {
                console.log('Starting itinerary...');
              }}
            />
          )}
        </AnimatePresence>

        {/* 4. Chat Interface (Palapa Bot Tab) */}
        <AnimatePresence>
          {activeTab === 'palapa' && (
            <PalapaBotChat
              onBack={() => setActiveTab('beranda')}
              onItineraryGenerated={handleItineraryGenerated}
            />
          )}
        </AnimatePresence>

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
            <ProfilePage
              onBack={() => setActivePage(null)}
              currentUser={currentUser}
              onLogout={() => {
                handleLogout()
                setActivePage(null)
              }}
            />
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

      </div>

      {/* 7. Bottom Navigation - Hidden when in Palapa chat, Collections, Result page, or other full-screen pages */}
      {activeTab !== 'palapa' && activeTab !== 'koleksi' && !activePage && !showItinerary && (
        <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
      )}

    </div>
  )
}