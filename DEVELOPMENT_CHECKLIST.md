# PALAPA - Development Checklist

## Phase 1: Project Setup & Environment

### 1.1 Initial Setup
- [ ] Read Next.js 15 official documentation
- [ ] Review App Router documentation
- [ ] Review TypeScript dengan Next.js best practices
- [ ] Read Tailwind CSS documentation
- [ ] Read Shadcn/ui documentation
- [ ] Create Next.js 15 project dengan TypeScript
- [ ] Setup project structure (`app/`, `components/`, `lib/`, `hooks/`, `types/`)
- [ ] Install dependencies: `tailwindcss`, `zustand`, `shadcn/ui`
- [ ] Setup Tailwind CSS configuration
- [ ] Setup TypeScript configuration
- [ ] Setup ESLint & Prettier
- [ ] Initialize Git repository
- [ ] Create `.gitignore` file
- [ ] Create README.md dengan project overview

### 1.2 Firebase Setup
- [ ] Read Firebase Firestore documentation
- [ ] Review Firestore data modeling best practices
- [ ] Read Firebase Authentication documentation
- [ ] Review Firebase Storage documentation
- [ ] Review Firebase Security Rules documentation
- [ ] Read Firebase Admin SDK documentation (Node.js)
- [ ] Review Firebase emulator documentation
- [ ] Review Firebase best practices untuk Next.js
- [x] Create Firebase project di Firebase Console
- [x] Enable Firestore Database
- [x] Enable Firebase Authentication (Email/Password, Google OAuth)
- [x] Enable Firebase Storage
- [x] Download Firebase config untuk web app
- [x] Setup Firebase Admin SDK (untuk data import)
- [x] Create `.env.local` file dengan semua API keys
- [x] Setup Firebase Security Rules untuk Firestore
- [x] Setup Firebase Security Rules untuk Storage
- [x] Test Firebase connection

### 1.3 External Services Setup
- [x] Read Google Gemini API official documentation
- [x] Review Gemini 2.5 Flash-Lite model specs
- [x] Read Gemini Embedding 001 API documentation
- [x] Read Perplexity API official documentation
- [x] Review Perplexity available models
- [x] Read FAISS official documentation
- [x] Read OSRM official documentation
- [x] Read OpenWeatherMap API documentation
- [x] Read Parlant SDK documentation
- [x] Review Parlant conversation modeling & journeys
- [x] Review Parlant tools & retrievers integration
- [x] Get Google Gemini API key
- [x] Get Perplexity API key
- [ ] Get OpenWeatherMap API key (invalid key provided)
- [x] Setup FAISS (local, no server needed)
- [ ] Setup OSRM server (deploy atau use public instance)
- [ ] Setup Parlant server (local atau cloud deployment)
- [ ] Test semua API connections
- [x] Add semua API keys ke `.env.local`

## Phase 2: Database Schema & Data Import

### 2.1 Firestore Schema Setup
- [x] Review Firestore data modeling best practices
- [ ] Review Firestore indexing documentation
- [x] Create `destinations` collection structure
- [x] Create `umkm` collection structure
- [x] Create `users` collection structure
- [x] Create `itineraries` collection structure
- [x] Setup Firestore indexes (provinsi + isCultural, category + provinsi, dll)
- [x] Create TypeScript types untuk semua collections
- [x] Setup Firestore emulator untuk local development

### 2.2 Data Import Script
- [x] Read Firebase Admin SDK Python documentation
- [x] Read FAISS Python documentation
- [x] Review batch writes best practices
- [x] Review Gemini Embedding API documentation (gemini-embedding-001)
- [x] Create Python script untuk import CSV ke Firestore
- [ ] Setup Firebase Admin SDK di Python script
- [x] Load `wisata_indonesia_merged_clean.csv`
- [x] Normalize data sesuai Firestore schema
- [x] Generate embeddings untuk semua destinasi dengan Gemini Embedding 001
- [x] Import embeddings ke FAISS index
- [x] Import destinations ke Firestore dengan batch writes (500 docs/batch)
- [x] Verify data import (check count, sample documents)
- [ ] Create manual UMKM data (20-30 UMKM Yogyakarta)
- [ ] Import UMKM data ke Firestore

### 2.3 FAISS Setup
- [x] Review FAISS index creation dan management
- [x] Review embedding storage best practices
- [x] Review similarity search dengan metadata filtering
- [x] Review local storage options
- [x] Review FAISS + Node.js integration options
- [x] Setup FAISS index (local, no server needed)
- [x] Create FAISS index `destinations` dengan metadata schema
- [x] Import embeddings dengan batch insert (100-500 vectors/batch)
- [x] Setup local persistent storage untuk FAISS
- [x] Test FAISS similarity search dengan sample queries
- [x] Verify metadata filtering works

## Phase 3: Core Libraries & Utilities

### 3.1 Firebase Libraries
- [x] Review Firebase SDK documentation untuk Next.js
- [x] Review Firestore helper functions patterns
- [x] Review Firebase Auth helper functions
- [x] Create `lib/firebase.ts` - Firebase initialization
- [x] Create `lib/firestore.ts` - Firestore helper functions
- [x] Create `lib/firebase-auth.ts` - Auth helper functions
- [x] Create `lib/firebase-storage.ts` - Storage helper functions
- [x] Test semua Firebase functions

### 3.2 AI Libraries
- [x] Read Gemini API SDK documentation (Node.js)
- [x] Review prompt engineering best practices
- [x] Review rate limits dan quotas
- [x] Review streaming responses documentation
- [x] Review error handling patterns
- [x] Implement Gemini 2.5 Flash Lite client with structured JSON output
- [x] Test Gemini client with valid API key and verify functionality
- [x] Read Perplexity API SDK documentation
- [x] Review RAG pipeline best practices
- [x] Read FAISS JavaScript/TypeScript integration documentation
- [x] Read Parlant SDK documentation untuk Python/Node.js
- [x] Review Parlant journey creation patterns
- [x] Review Parlant guidelines & glossary best practices
- [x] Review Parlant custom retrievers documentation
- [x] Review Parlant tools integration patterns
- [x] Create `lib/gemini.ts` - Gemini API client
- [x] Create `lib/perplexity.ts` - Perplexity API client
- [x] Create `lib/faiss.ts` - FAISS vector search client
- [x] Create `lib/prompts.ts` - Prompt templates untuk Gemini
- [x] Create `lib/parlant/server.ts` - Parlant server setup
- [x] Create `lib/parlant/agent.ts` - Agent configuration
- [x] Create `lib/parlant/journeys.ts` - Journey definitions
- [x] Create `lib/parlant/guidelines.ts` - Cultural guidelines
- [x] Create `lib/parlant/tools.ts` - Custom tools (FAISS, Gemini, etc)
- [x] Create `lib/parlant/retrievers.ts` - Custom RAG retrievers
- [x] Implement RAG pipeline (query → FAISS → Gemini)
- [x] Implement Parlant journey untuk itinerary generation
- [x] Test Gemini API dengan sample prompts
- [x] Test Perplexity API dengan sample queries
- [x] Test FAISS semantic search
- [x] Test Parlant journey dengan sample conversations

### 3.3 Routing & Weather Libraries
- [ ] Review OSRM API endpoints documentation
- [ ] Review route calculation API
- [ ] Review distance matrix API
- [ ] Review TSP (Traveling Salesman Problem) dengan OSRM
- [ ] Review OpenWeatherMap API response format
- [ ] Review caching strategies untuk weather data
- [ ] Create `lib/routing.ts` - OSRM route optimization
- [ ] Create `lib/weather.ts` - OpenWeatherMap API client
- [ ] Implement TSP solver untuk route optimization
- [ ] Test route optimization dengan sample destinations
- [ ] Test weather API dengan sample coordinates

### 3.4 State Management
- [ ] Read Zustand official documentation
- [ ] Review store creation patterns
- [ ] Review state management best practices
- [ ] Review async actions
- [ ] Review TypeScript integration
- [ ] Setup Zustand store untuk selectedDestination
- [ ] Setup Zustand store untuk chat state
- [ ] Setup Zustand store untuk map state
- [ ] Setup Zustand store untuk user preferences
- [ ] Test state management dengan sample actions

## Phase 4: Frontend Components

### 4.1 UI Components (Shadcn/ui)
- [ ] Read Shadcn/ui documentation
- [ ] Review installation guide
- [ ] Review component usage
- [ ] Review customization options
- [ ] Review accessibility features
- [ ] Install Shadcn/ui components
- [ ] Create Button component
- [ ] Create Input component
- [ ] Create Card component
- [ ] Create Modal/Dialog component
- [ ] Create Select/Dropdown component
- [ ] Create Loading/Spinner component
- [ ] Create Badge component
- [ ] Create Toast/Notification component

### 4.2 Map Components
- [ ] Read MapLibre GL JS official documentation
- [ ] Review map initialization
- [ ] Review marker clustering documentation
- [ ] Review custom markers
- [ ] Review polylines untuk routes
- [ ] Review map controls (zoom, pan, etc)
- [ ] Review performance optimization
- [ ] Review OpenMapTiles integration
- [ ] Install Maplibre GL JS
- [ ] Setup OpenMapTiles style
- [ ] Create `components/map/MapView.tsx` - Main map component
- [ ] Create `components/map/MarkerCluster.tsx` - Marker clustering
- [ ] Create `components/map/DestinationMarker.tsx` - Custom marker
- [ ] Create `components/map/MapControls.tsx` - Zoom, filter controls
- [ ] Create `components/map/RoutePolyline.tsx` - Route visualization
- [ ] Implement marker click handler
- [ ] Implement map flyTo animation
- [ ] Test map dengan 1000+ markers
- [ ] Test marker clustering performance

### 4.3 Chat Components
- [ ] Read Web Speech API (SpeechRecognition) documentation
- [ ] Review browser compatibility
- [ ] Review Bahasa Indonesia support
- [ ] Review error handling untuk voice input
- [ ] Review best practices untuk voice input
- [ ] Review fallback strategies
- [ ] Read Parlant session events documentation
- [ ] Review Parlant long polling patterns
- [ ] Review Parlant status events (processing, typing, ready)
- [ ] Create `components/chat/ChatInterface.tsx` - Main chat UI
- [ ] Create `components/chat/ChatMessage.tsx` - Message display
- [ ] Create `components/chat/ChatInput.tsx` - Input dengan voice support
- [ ] Create `components/chat/VoiceInput.tsx` - Web Speech API integration
- [ ] Create `components/chat/ItineraryPreview.tsx` - Preview sebelum save
- [ ] Create `components/chat/ParlantSession.tsx` - Parlant session wrapper
- [ ] Create `components/chat/StatusIndicator.tsx` - Agent status display
- [ ] Implement chat state management
- [ ] Implement Parlant session creation & management
- [ ] Implement Parlant event handling (long polling)
- [ ] Implement status events display (processing, typing)
- [ ] Implement voice input dengan visual feedback
- [ ] Test voice input di Chrome/Edge
- [ ] Test chat dengan Parlant sessions
- [ ] Test real-time updates dengan long polling

### 4.4 Itinerary Components
- [ ] Create `components/itinerary/ItineraryCard.tsx` - Card display
- [ ] Create `components/itinerary/ItineraryDetail.tsx` - Detail view
- [ ] Create `components/itinerary/DayCard.tsx` - Per-day breakdown
- [ ] Create `components/itinerary/DestinationCard.tsx` - Destination dalam itinerary
- [ ] Create `components/itinerary/BudgetBreakdown.tsx` - Budget display
- [ ] Create `components/itinerary/WeatherCard.tsx` - Weather forecast
- [ ] Create `components/itinerary/RouteOptimization.tsx` - Route optimizer
- [ ] Implement share functionality
- [ ] Implement export to PDF
- [ ] Test itinerary display

### 4.5 Destination Components
- [ ] Create `components/destination/DestinationCard.tsx` - Card preview
- [ ] Create `components/destination/DestinationDetail.tsx` - Detail modal
- [ ] Create `components/destination/DestinationList.tsx` - List view
- [ ] Create `components/destination/FilterSidebar.tsx` - Filter UI
- [ ] Create `components/destination/SearchBar.tsx` - Search dengan Perplexity
- [ ] Implement filter by provinsi/kategori
- [ ] Implement search functionality
- [ ] Test destination components

### 4.6 UMKM Components
- [ ] Create `components/umkm/UMKMCard.tsx` - Card display
- [ ] Create `components/umkm/UMKMDetail.tsx` - Detail view
- [ ] Create `components/umkm/ContactInfo.tsx` - WhatsApp/phone links
- [ ] Implement UMKM display di map
- [ ] Test UMKM components

## Phase 5: API Routes

### 5.1 Destinations API
- [ ] Review Next.js API Routes documentation
- [ ] Review data fetching patterns
- [ ] Review pagination best practices
- [ ] Create `app/api/destinations/route.ts` - GET list destinations
- [ ] Create `app/api/destinations/[id]/route.ts` - GET detail destination
- [ ] Implement query parameters (provinsi, kategori, isCultural, limit, offset)
- [ ] Implement pagination
- [ ] Implement caching untuk frequently accessed data
- [ ] Test destinations API dengan berbagai queries

### 5.2 Itinerary API
- [ ] Review RAG pipeline best practices
- [ ] Review prompt engineering untuk Gemini
- [ ] Review response parsing patterns
- [ ] Review Parlant journey execution patterns
- [ ] Review Parlant tool integration
- [ ] Create `app/api/itinerary/route.ts` - POST generate itinerary
- [ ] Implement RAG pipeline (query FAISS → retrieve → inject ke Gemini)
- [ ] Implement Parlant journey untuk itinerary generation
- [ ] Implement Gemini prompt dengan cultural context
- [ ] Parse Gemini response ke structured JSON
- [ ] Save itinerary ke Firestore
- [ ] Implement response caching
- [ ] Test itinerary generation dengan berbagai scenarios

### 5.3 Vector Search API
- [ ] Review FAISS similarity search documentation
- [ ] Review metadata filtering best practices
- [ ] Create `app/api/vector-search/route.ts` - POST semantic search
- [ ] Implement FAISS similarity search dengan metadata filtering
- [ ] Implement query embedding generation
- [ ] Return destinations dengan similarity scores
- [ ] Test vector search dengan sample queries

### 5.4 Research API
- [ ] Review Perplexity API response format
- [ ] Review citations handling
- [ ] Review Parlant tool integration untuk Perplexity
- [ ] Create `app/api/research/route.ts` - POST Perplexity research
- [ ] Implement Perplexity API call
- [ ] Format response dengan citations
- [ ] Cache responses untuk frequently asked queries
- [ ] Test research API

### 5.7 Parlant Sessions API
- [ ] Review Parlant session management documentation
- [ ] Review Parlant event handling patterns
- [ ] Review long polling implementation
- [ ] Create `app/api/sessions/route.ts` - POST create session
- [ ] Create `app/api/sessions/[id]/events/route.ts` - POST/GET events
- [ ] Implement session creation dengan agent_id
- [ ] Implement message event posting
- [ ] Implement long polling untuk real-time updates
- [ ] Implement status events handling
- [ ] Test Parlant session flow end-to-end

### 5.5 Route Optimization API
- [ ] Review OSRM distance matrix API
- [ ] Review TSP solving algorithms
- [ ] Create `app/api/route-optimize/route.ts` - POST optimize route
- [ ] Implement OSRM distance matrix calculation
- [ ] Implement TSP solver (nearest neighbor + 2-opt)
- [ ] Return optimized route dengan distance & time
- [ ] Cache distance matrix untuk same destinations
- [ ] Test route optimization

### 5.6 Weather API
- [ ] Review OpenWeatherMap API response format
- [ ] Review caching strategies
- [ ] Create `app/api/weather/route.ts` - GET weather forecast
- [ ] Implement OpenWeatherMap API call
- [ ] Cache weather data (1-2 hours TTL)
- [ ] Return forecast untuk multiple destinations
- [ ] Test weather API

## Phase 6: Frontend Pages

### 6.1 Homepage
- [ ] Create `app/page.tsx` - Homepage
- [ ] Design hero section dengan CTA
- [ ] Create quick search bar
- [ ] Display featured destinations
- [ ] Add navigation to map/chat
- [ ] Test responsive design

### 6.2 Map Page
- [ ] Create `app/map/page.tsx` - Map view
- [ ] Integrate MapView component
- [ ] Add filter sidebar (provinsi, kategori, budaya)
- [ ] Add search dengan geocoder
- [ ] Implement click marker → show detail modal
- [ ] Implement map-chat integration (zoom/pan dari chat)
- [ ] Test map performance dengan 1000+ markers
- [ ] Test marker clustering
- [ ] Test map filters

### 6.3 Chat Page
- [ ] Create `app/chat/page.tsx` - AI chat interface
- [ ] Integrate ChatInterface component
- [ ] Integrate ParlantSession component
- [ ] Implement Parlant session initialization
- [ ] Implement budget/duration input
- [ ] Implement category preferences
- [ ] Integrate Gemini API via Parlant tools untuk itinerary generation
- [ ] Implement preview itinerary sebelum save
- [ ] Implement save itinerary ke database
- [ ] Implement voice input
- [ ] Implement Parlant long polling untuk real-time updates
- [ ] Implement status indicator (processing, typing, ready)
- [ ] Implement map integration (trigger zoom/pan dari Parlant events)
- [ ] Test chat flow end-to-end dengan Parlant
- [ ] Test real-time updates

### 6.4 Itinerary Detail Page
- [ ] Create `app/itinerary/[id]/page.tsx` - Itinerary detail
- [ ] Display generated itinerary
- [ ] Display destinations dengan map route
- [ ] Display budget breakdown
- [ ] Display UMKM recommendations
- [ ] Display weather forecast
- [ ] Implement route optimization
- [ ] Implement share functionality
- [ ] Implement export to PDF
- [ ] Test itinerary detail page

### 6.5 UMKM Detail Page
- [ ] Create `app/umkm/[id]/page.tsx` - UMKM detail
- [ ] Display UMKM profile
- [ ] Display product listing
- [ ] Display location map
- [ ] Display contact info (WhatsApp, phone)
- [ ] Test UMKM detail page

## Phase 7: Advanced Features

### 7.1 Authentication
- [ ] Review Firebase Auth UI components documentation
- [ ] Review authentication flow best practices
- [ ] Setup Firebase Auth UI components
- [ ] Create login page
- [ ] Create register page
- [ ] Implement email/password auth
- [ ] Implement Google OAuth
- [ ] Create user profile page
- [ ] Implement save favorite destinations
- [ ] Implement history itineraries
- [ ] Test authentication flow

### 7.2 PWA Setup
- [ ] Review PWA with Next.js guide
- [ ] Review Workbox documentation
- [ ] Review Service Worker API
- [ ] Create `manifest.json` untuk PWA
- [ ] Create service worker untuk offline support
- [ ] Setup Workbox untuk caching
- [ ] Cache API responses
- [ ] Cache map tiles untuk offline
- [ ] Implement install prompt
- [ ] Test offline functionality
- [ ] Test PWA install

### 7.3 Performance Optimization
- [ ] Implement lazy loading untuk map markers
- [ ] Implement virtual scrolling untuk destination lists
- [ ] Optimize API calls dengan caching
- [ ] Implement debounce untuk search inputs
- [ ] Optimize bundle size
- [ ] Test performance dengan Lighthouse

### 7.4 Error Handling
- [ ] Implement error boundaries
- [ ] Handle Firebase offline mode
- [ ] Handle Gemini API failures dengan graceful degradation
- [ ] Handle map loading errors
- [ ] Implement network error retry logic
- [ ] Add error logging (Sentry atau Firebase Crashlytics)
- [ ] Test error scenarios

## Phase 8: Testing & Quality Assurance

### 8.1 Unit Testing
- [ ] Setup testing framework (Jest/Vitest)
- [ ] Test utility functions
- [ ] Test API route handlers
- [ ] Test state management (Zustand stores)
- [ ] Test component rendering

### 8.2 Integration Testing
- [ ] Test Firebase integration
- [ ] Test Gemini API integration
- [ ] Test FAISS integration
- [ ] Test Parlant integration
- [ ] Test Parlant journey execution
- [ ] Test Parlant guidelines & glossary
- [ ] Test Parlant custom retrievers
- [ ] Test Parlant tools integration
- [ ] Test Parlant session events
- [ ] Test map integration
- [ ] Test chat flow end-to-end dengan Parlant
- [ ] Test itinerary generation flow dengan Parlant

### 8.3 E2E Testing
- [ ] Test user journey: search → generate itinerary → save (dengan Parlant)
- [ ] Test Parlant journey state transitions
- [ ] Test Parlant guidelines execution
- [ ] Test map navigation
- [ ] Test voice input
- [ ] Test route optimization
- [ ] Test weather display
- [ ] Test share functionality
- [ ] Test real-time updates via Parlant sessions

### 8.4 Performance Testing
- [ ] Test dengan 1000+ destinations
- [ ] Test map rendering performance
- [ ] Test API response times
- [ ] Test bundle size
- [ ] Run Lighthouse audit

### 8.5 Browser Compatibility
- [ ] Test di Chrome
- [ ] Test di Edge
- [ ] Test di Firefox
- [ ] Test di Safari (voice input limitations)
- [ ] Test di mobile browsers

## Phase 9: Deployment

### 9.1 Vercel Deployment
- [ ] Connect GitHub repository ke Vercel
- [ ] Setup environment variables di Vercel
- [ ] Configure build settings
- [ ] Deploy frontend
- [ ] Test production build
- [ ] Setup custom domain (optional)

### 9.2 Firebase Deployment
- [ ] Deploy Firestore Security Rules
- [ ] Deploy Firebase Storage Rules
- [ ] Deploy Firebase Functions (jika ada)
- [ ] Verify security rules
- [ ] Test production Firebase

### 9.3 External Services
- [ ] Verify FAISS production setup
- [ ] Verify OSRM production setup
- [ ] Verify Parlant server production setup
- [ ] Test semua APIs di production
- [ ] Monitor API quotas
- [ ] Monitor Parlant session usage

### 9.4 Monitoring & Analytics
- [ ] Setup Firebase Analytics
- [ ] Setup error tracking (Sentry/Crashlytics)
- [ ] Monitor API usage (Gemini, Perplexity, Weather)
- [ ] Monitor Firestore reads/writes
- [ ] Setup uptime monitoring

## Phase 10: Documentation & Final Polish

### 10.1 Documentation
- [ ] Update README.md dengan setup instructions
- [ ] Create API documentation
- [ ] Create component documentation
- [ ] Document environment variables
- [ ] Create deployment guide

### 10.2 Code Quality
- [ ] Run linter dan fix semua errors
- [ ] Format semua code dengan Prettier
- [ ] Review code untuk best practices
- [ ] Remove console.logs
- [ ] Add code comments untuk complex logic

### 10.3 UI/UX Polish
- [ ] Review semua pages untuk consistency
- [ ] Test responsive design di berbagai screen sizes
- [ ] Add loading states untuk semua async operations
- [ ] Add error messages yang user-friendly
- [ ] Add success feedback untuk user actions
- [ ] Polish animations dan transitions

### 10.4 Final Testing
- [ ] Run semua tests
- [ ] Manual testing semua features
- [ ] Test dengan real data
- [ ] Test dengan edge cases
- [ ] Performance testing final

### 10.5 Demo Preparation
- [ ] Create demo video script
- [ ] Record demo video
- [ ] Prepare presentation slides
- [ ] Prepare demo data
- [ ] Test demo flow

## Phase 11: Post-MVP (Optional)

### 11.1 Additional Features
- [ ] Implement user reviews & ratings
- [ ] Implement photo upload untuk destinations
- [ ] Implement social sharing (WhatsApp, Instagram)
- [ ] Implement Google Calendar integration
- [ ] Implement PDF export
- [ ] Implement group itinerary collaboration

### 11.2 Enhancements
- [ ] Add more UMKM data
- [ ] Implement advanced filtering
- [ ] Add more language support
- [ ] Improve AI responses dengan fine-tuning
- [ ] Add more destination categories

---

**Total Checklist Items: ~310+ tasks**

**Estimated Timeline: 14 days (sesuai technical spec)**

**Priority Order:**
1. Phase 1-2: Setup & Data (Day 1-2)
2. Phase 3-4: Core Libraries & Components (Day 3-6)
3. Phase 5-6: API Routes & Pages (Day 7-10)
4. Phase 7-8: Advanced Features & Testing (Day 11-12)
5. Phase 9-10: Deployment & Polish (Day 13-14)

**Note:**
- Dokumentasi research sudah integrated di setiap phase sebelum praktik implementation
- Baca dokumentasi sebelum mulai implement untuk avoid common mistakes
- Bookmark important documentation pages untuk quick reference
- **Parlant Integration**: Setup Parlant server di awal, kemudian implement journeys & tools secara bertahap

