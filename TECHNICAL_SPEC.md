# PALAPA - Technical Specification

## Tech Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Map**: Maplibre GL JS + OpenMapTiles
- **State Management**: Zustand / React Context
- **UI Components**: Shadcn/ui atau Headless UI

### Backend
- **Runtime**: Node.js (Next.js API Routes)
- **Database**: Firebase Firestore (NoSQL)
- **Auth**: Firebase Authentication
- **Storage**: Firebase Storage (images)
- **Conversation Engine**: Parlant SDK (untuk structured conversational journeys & agent guidelines)

### AI & External Services
- **AI Model**: Google Gemini 2.5 Flash-Lite API (itinerary generation)
- **Research API**: Perplexity API (real-time search & validation)
- **Vector Store**: FAISS (semantic search & RAG untuk dataset destinasi)
- **Embeddings**: Gemini Embedding 001 API
- **Weather API**: OpenWeatherMap API atau WeatherAPI.com
- **Routing**: OSRM atau GraphHopper (open source routing engine)
- **Map Tiles**: OpenMapTiles (self-hosted atau cloud)

### Deployment
- **Frontend**: Vercel
- **Backend**: Firebase (Firestore + Storage + Auth)
- **Domain**: Custom domain (opsional)

## Firestore Collections Schema

### Collection: `destinations`
```typescript
{
  id: string (auto-generated),
  name: string,
  category: string,
  latitude: number,
  longitude: number,
  address: string,
  description: string,
  descriptionClean: string,
  priceRange: string,
  rating: number,
  timeMinutes: number,
  imageUrl: string,
  imagePath: string,
  provinsi: string,
  kotaKabupaten: string,
  isCultural: boolean,
  umkmId: string | null,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Collection: `umkm`
```typescript
{
  id: string (auto-generated),
  name: string,
  category: string, // batik, kuliner, kerajinan
  latitude: number,
  longitude: number,
  address: string,
  phone: string,
  whatsapp: string,
  verified: boolean,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Collection: `users` (extends Firebase Auth)
```typescript
{
  uid: string (from Firebase Auth),
  budgetRange: string | null,
  preferredCategories: string[],
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Collection: `itineraries`
```typescript
{
  id: string (auto-generated),
  userId: string,
  destinations: string[], // destination IDs
  totalBudget: number,
  durationDays: number,
  geminiResponse: object,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Firestore Indexes Required
```
destinations: [provinsi ASC, isCultural ASC]
destinations: [category ASC, provinsi ASC]
destinations: [provinsi ASC, kotaKabupaten ASC]
```

## API Routes

### `/api/destinations`
- `GET /api/destinations` - List semua destinasi
  - Query: `?provinsi=`, `?kategori=`, `?is_cultural=true`, `?limit=`, `?offset=`
- `GET /api/destinations/[id]` - Detail destinasi

### `/api/itinerary`
- `POST /api/itinerary` - Generate itinerary dengan Gemini
  - Body: `{ budget, duration_days, preferred_categories, provinsi }`
  - Response: `{ itinerary: [...], total_budget, gemini_response }`
  - **Note**: Menggunakan Parlant Journey untuk structured conversation flow

### `/api/sessions` (Parlant Sessions)
- `POST /api/sessions` - Create chat session dengan Parlant
  - Body: `{ agent_id, customer_id, title }`
  - Response: `{ session_id, agent_id, customer_id, creation_utc }`
- `POST /api/sessions/[id]/events` - Post message event
  - Body: `{ kind: 'message', source: 'customer', message: '...' }`
- `GET /api/sessions/[id]/events` - Get events dengan long polling
  - Query: `?min_offset=0&wait_for_data=60`
  - Response: `{ events: [...] }`

### `/api/umkm`
- `GET /api/umkm` - List UMKM
- `GET /api/umkm/[id]` - Detail UMKM

### `/api/research`
- `POST /api/research` - Research tentang destinasi/budaya dengan Perplexity
  - Body: `{ query, type: 'destination' | 'cultural' | 'general' }`
  - Response: `{ answer, citations: [...], sources: [...] }`

### `/api/vector-search`
- `POST /api/vector-search` - Semantic search destinasi dengan FAISS
  - Body: `{ query, limit: 10, filters: { provinsi?, kategori?, isCultural? } }`
  - Response: `{ destinations: [...], scores: [...] }`

### `/api/route-optimize`
- `POST /api/route-optimize` - Optimize route antar destinasi
  - Body: `{ destinations: [{ lat, lng, id }], startPoint: { lat, lng } }`
  - Response: `{ optimizedRoute: [...], totalDistance: number, estimatedTime: number }`

### `/api/weather`
- `GET /api/weather` - Get weather forecast untuk destinasi
  - Query: `?lat=&lng=&days=7`
  - Response: `{ forecast: [...], current: {...} }`

## Frontend Pages

### `/` - Homepage
- Hero section dengan CTA
- Quick search bar
- Featured destinations

### `/map` - Interactive Map
- Maplibre map dengan OpenMapTiles
- Marker clustering untuk performa
- Click marker → show detail modal
- Filter sidebar (provinsi, kategori, budaya)
- Search dengan geocoder

### `/chat` - AI Chatbot
- Chat interface untuk generate itinerary
- **Parlant Integration**: Structured conversational journeys
- Input: budget, durasi, kategori preferensi
- Gemini API integration via Parlant tools
- Preview itinerary sebelum save
- Save itinerary ke database
- **Voice Input**: Web Speech API untuk voice-to-text input
- **Interactive Map Integration**: Chat bisa trigger map zoom/pan ke destinasi
  - User tanya "mana destinasi yang bagus?"
  - AI response dengan list destinasi
  - Map otomatis zoom/pan ke destinasi yang disebutkan
  - Highlight markers untuk destinasi yang disebutkan
- **Real-time Updates**: Long polling untuk real-time agent responses

### `/itinerary/[id]` - Detail Itinerary
- Display generated itinerary
- List destinations dengan map route
- Budget breakdown
- UMKM recommendations
- Share itinerary functionality
- **Route Optimization**: Optimize urutan kunjungan dengan OSRM
- **Weather Display**: Show weather forecast untuk setiap destinasi
- **Optimized Route Visualization**: Map dengan polyline route teroptimasi

### `/umkm/[id]` - UMKM Detail
- Profile UMKM
- Product listing
- Location map
- Contact info (WhatsApp, phone)

## Features

### Core Features (MVP)

1. **Map Visualization**
   - Load destinations dari CSV → Firestore
   - Render markers dengan clustering
   - Click untuk detail modal
   - Filter by provinsi/kategori
   - Search functionality dengan Perplexity API (real-time info & validation)

2. **AI Itinerary Generation dengan Parlant**
   - **Parlant Conversation Journeys**: Structured state machine untuk itinerary generation flow
     - Initial state: Ask budget & preferences
     - Tool state: Query FAISS untuk retrieve relevant destinations
     - Chat state: Present recommendations & ask for feedback
     - Tool state: Generate itinerary dengan Gemini
     - Chat state: Show preview & confirm
     - End state: Save itinerary
   - **Parlant Guidelines**: Cultural context rules
     - Condition: "User asks about cultural destinations"
     - Action: "Prioritize budaya category, mention cultural etiquette"
   - **Parlant Tools**: Integrate dengan Gemini, FAISS, Perplexity APIs
   - **RAG (Retrieval Augmented Generation)**: Query FAISS untuk retrieve destinasi relevan → inject ke Gemini prompt sebagai context
   - Chat interface dengan real-time updates via Parlant sessions
   - Generate itinerary berdasarkan budget + preferensi
   - Return structured JSON
   - Save ke database
   
3. **Map Integration dengan Parlant**
   - Parse Parlant agent response untuk extract destination names
   - Lookup coordinates dari Firestore berdasarkan nama destinasi
   - Trigger map.flyTo() untuk smooth zoom animation ke destinasi
   - Highlight markers untuk visual feedback
   - Zustand store untuk shared state antara chat dan map component
   - Listen ke Parlant session events untuk real-time updates

4. **Cultural Context in AI (via Parlant Guidelines)**
   - **Parlant Guidelines untuk Cultural Context**:
     - Condition: "User asks about visiting Candi Borobudur"
     - Action: "Mention: Avoid visiting on Saturday mornings (Buddhist worship day)"
     - Condition: "User asks about local customs"
     - Action: "Provide tips on local language, respectful dress code, and cultural etiquette"
   - **Parlant Glossary Terms**: Domain-specific terms untuk budaya lokal
     - Term: "Candi Borobudur" dengan synonyms dan cultural notes
     - Term: "Keraton" dengan etiquette guidelines
   - Prompt engineering untuk budaya lokal
   - Etika berkunjung (contoh: Candi Borobudur hari Sabtu)
   - Bahasa daerah tips
   - Ritual tabu awareness
   - Perplexity API untuk research budaya lokal dengan citations (via Parlant tool)

5. **Vector Search & RAG (via Parlant Retrievers)**
   - **Parlant Custom Retriever**: Custom RAG retriever untuk destinations
     - Use conversation history untuk generate query
     - Query FAISS dengan metadata filtering
     - Return relevant destinations sebagai context
   - FAISS untuk semantic search destinasi wisata
   - Generate embeddings dengan Gemini Embedding 001 API
   - Store embeddings di FAISS index
   - RAG: Retrieve relevant destinations → inject ke Gemini prompt
   - Support Indonesian language untuk semantic search
   - Filter by provinsi/kategori di vector search

6. **UMKM Integration**
   - UMKM data dari manual input dulu
   - Display di map + itinerary
   - Contact info display (WhatsApp link)

7. **PWA Support**
   - Service worker untuk offline
   - Install prompt
   - Offline map caching

8. **Route Optimization**
   - Optimize urutan kunjungan destinasi berdasarkan jarak
   - Use OSRM atau GraphHopper untuk routing calculation
   - Calculate total distance & estimated time
   - Visual route di map dengan polyline
   - Support multiple optimization strategies (shortest, fastest, avoid tolls)

9. **Voice Input**
   - Web Speech API untuk voice-to-text
   - Voice chat dengan AI untuk generate itinerary
   - Support Bahasa Indonesia speech recognition
   - Visual feedback saat listening (waveform animation)
   - Fallback ke text input jika voice tidak supported

10. **Weather Integration**
    - OpenWeatherMap API untuk forecast
    - Show weather di setiap destinasi di itinerary
    - Weather-based recommendations (hindari outdoor saat hujan)
    - 7-day forecast untuk planning
    - Cache weather data untuk reduce API calls

### Advanced Features (Post-MVP)

1. **User Authentication**
   - Firebase Auth (email/password, Google OAuth)
   - Save favorite destinations
   - History itineraries

2. **Real-time Updates**
   - Firestore realtime listeners untuk live data
   - Collaborative itinerary editing

3. **Crowdsourcing**
   - User submit UMKM baru
   - Review destinations
   - Photo upload

4. **Research & Validation Feature**
   - Perplexity API untuk real-time search tentang destinasi
   - Validasi informasi destinasi dengan citations
   - Research budaya lokal dengan web context
   - FAQ/Help dengan real-time answers

5. **Export & Share**
   - Export itinerary ke PDF
   - Share via WhatsApp/social media
   - Google Calendar integration

## Parlant Journey Structure untuk Itinerary Generation

### Journey: "Generate Itinerary"
```python
# Parlant Journey Definition
journey = await agent.create_journey(
    title="Generate Itinerary",
    description="Guides user through itinerary generation process",
    conditions=["User wants to plan a trip"]
)

# State 1: Collect preferences
t0 = await journey.initial_state.transition_to(
    chat_state="Ask about budget, duration, and preferred categories"
)

# State 2: Retrieve relevant destinations
t1 = await t0.target.transition_to(
    tool_state=retrieve_destinations_from_faiss,  # Custom retriever
    condition="User provides preferences"
)

# State 3: Present recommendations
t2 = await t1.target.transition_to(
    chat_state="Present destination recommendations and ask for feedback"
)

# State 4: Generate itinerary
t3 = await t2.target.transition_to(
    tool_state=generate_itinerary_with_gemini,  # Gemini tool
    condition="User confirms destinations"
)

# State 5: Show preview
t4 = await t3.target.transition_to(
    chat_state="Show itinerary preview and ask for confirmation"
)

# State 6: Save itinerary
t5 = await t4.target.transition_to(
    tool_state=save_itinerary_to_firestore,
    condition="User confirms itinerary"
)

t6 = await t5.target.transition_to(
    chat_state="Confirm itinerary saved successfully"
)

await t6.target.transition_to(state=p.END_JOURNEY)
```

## Parlant Guidelines untuk Cultural Context

```python
# Cultural Guidelines
await agent.create_guideline(
    condition="User asks about visiting Candi Borobudur",
    action="Mention: Avoid visiting on Saturday mornings (Buddhist worship day), "
           "wear respectful clothing (long pants, no tight clothing), "
           "use respectful language when talking to guides"
)

await agent.create_guideline(
    condition="User asks about Keraton visits",
    action="Provide tips: Use Javanese honorific language (kromo inggil), "
           "dress modestly, follow guide instructions"
)

await agent.create_guideline(
    condition="User asks about UMKM recommendations",
    action="Prioritize local batik, traditional food, and handicraft shops, "
           "mention specific locations and contact info if available"
)
```

## Parlant Tools Integration

```python
@p.tool
async def retrieve_destinations_from_faiss(context: p.ToolContext) -> p.ToolResult:
    # Extract preferences from conversation
    preferences = extract_preferences(context.interaction.messages)
    
    # Query FAISS
    destinations = await faiss_client.similarity_search(
        query_text=preferences,
        metadata_filters={"provinsi": preferences.provinsi},
        limit=20
    )
    
    return p.ToolResult(data=destinations)

@p.tool
async def generate_itinerary_with_gemini(context: p.ToolContext) -> p.ToolResult:
    # Extract context from conversation
    conversation_context = extract_conversation_context(context.interaction.messages)
    
    # Retrieve relevant destinations from FAISS
    relevant_destinations = await retrieve_destinations_from_faiss(context)
    
    # Generate itinerary dengan Gemini
    itinerary = await gemini_client.generate(
        prompt=build_itinerary_prompt(conversation_context, relevant_destinations),
        schema=ItinerarySchema
    )
    
    return p.ToolResult(data=itinerary)
```

## Gemini Prompt Structure

```typescript
const systemPrompt = `
Kamu adalah asisten wisata budaya Indonesia khusus untuk aplikasi PALAPA.
Tugas kamu:
1. Buat itinerary berdasarkan budget dan preferensi user
2. Prioritaskan destinasi budaya (candi, museum, keraton, UMKM lokal)
3. Sertakan UMKM lokal (batik, kuliner tradisional, kerajinan)
4. Berikan tips budaya: etika berkunjung, bahasa daerah, ritual tabu
5. Format output: JSON dengan struktur {days: [], totalBudget: number, tips: []}

Contoh respons budaya:
- "Hindari berkunjung ke Candi Borobudur pada hari Sabtu pagi (ibadah umat Buddha)"
- "Gunakan pakaian sopan (celana panjang, tidak ketat)"
- "Gunakan bahasa Jawa halus saat berbicara dengan guide di Keraton"
`;

const userPrompt = `
Budget: Rp ${budget}
Durasi: ${duration_days} hari
Kategori: ${preferred_categories.join(', ')}
Provinsi: ${provinsi}
`;
```

## Data Import Flow

1. **CSV → Firestore**
   - Load 3 CSV files dari `dataset-wisata/`
   - Normalize schema (merge columns)
   - Import ke Firestore dengan Firebase Admin SDK (Node.js script)
   - Deduplicate berdasarkan nama + koordinat
   - Batch write untuk performa (500 docs/batch)

2. **UMKM Data**
   - Manual input dulu untuk MVP (20-30 UMKM Yogyakarta)
   - Format: CSV → Firestore (via Admin SDK)
   - Verifikasi manual

## Environment Variables

```env
# .env.local
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

FIREBASE_SERVICE_ACCOUNT_KEY= (JSON string atau path to file)

GEMINI_API_KEY=

PERPLEXITY_API_KEY=

FAISS_INDEX_PATH=./faiss_index

PARLANT_SERVER_URL= (local atau cloud endpoint, default: http://localhost:8800)
PARLANT_AGENT_ID=

OPENWEATHER_API_KEY= (atau WEATHERAPI_KEY)

OSRM_URL= (self-hosted atau public instance)

NEXT_PUBLIC_MAP_TILES_URL=
NEXT_PUBLIC_MAP_STYLE_URL=
```

## Development Timeline (14 Days)

### Week 1
- Day 1-2: Setup Next.js + Firebase + Firestore schema
- Day 3-4: Map integration (Maplibre + markers)
- Day 5-6: Gemini API + itinerary generation
- Day 7: UI polish + responsive

### Week 2
- Day 8-9: Firebase Auth + user preferences
- Day 10-11: PWA setup + offline support
- Day 12: Testing + bug fixes
- Day 13: Video demo
- Day 14: Final polish + deployment

## File Structure

```
palapa/
├── app/
│   ├── (routes)/
│   │   ├── page.tsx          # Homepage
│   │   ├── map/
│   │   │   └── page.tsx      # Map view
│   │   ├── chat/
│   │   │   └── page.tsx      # AI chat
│   │   └── itinerary/[id]/
│   │       └── page.tsx     # Itinerary detail
│   └── api/
│       ├── destinations/
│       ├── itinerary/
│       ├── umkm/
│       ├── research/
│       ├── vector-search/
│       ├── route-optimize/
│       ├── weather/
│       └── sessions/          # Parlant session management
├── components/
│   ├── map/
│   ├── chat/
│   ├── itinerary/
│   └── ui/
├── lib/
│   ├── firebase.ts
│   ├── firestore.ts
│   ├── gemini.ts
│   ├── perplexity.ts
│   ├── faiss.ts
│   ├── routing.ts
│   ├── weather.ts
│   ├── prompts.ts
│   └── parlant/
│       ├── server.ts           # Parlant server setup
│       ├── agent.ts            # Agent configuration
│       ├── journeys.ts         # Journey definitions
│       ├── guidelines.ts       # Cultural guidelines
│       ├── tools.ts            # Custom tools (FAISS, Gemini, etc)
│       └── retrievers.ts       # Custom RAG retrievers
├── hooks/
├── types/
└── public/
```

## Key Implementation Notes

1. **Map Performance**
   - Use marker clustering untuk 1000+ markers
   - Lazy load markers berdasarkan viewport
   - Cache map tiles untuk offline
   - Use GeoPoint queries untuk proximity search

2. **Chat-Map Integration dengan Parlant**
   - **Parlant Session Events**: Listen untuk agent message events
   - Parse Parlant agent response untuk extract destination names
   - Lookup coordinates dari Firestore berdasarkan nama destinasi
   - Map.flyTo({ center: [lng, lat], zoom: 15 }) untuk smooth animation
   - Marker highlighting: change color/style + popup untuk visual feedback
   - Zustand store untuk shared state antara chat dan map component
   - Map component subscribe ke Parlant session events untuk reactive updates
   - Real-time updates via Parlant long polling (`wait_for_data` parameter)

3. **Gemini API**
   - Rate limiting: max 60 requests/minute (Gemini 2.5 Flash-Lite)
   - Cache responses di Firestore untuk identical queries
   - Error handling untuk API failures dengan retry logic
   - Stream responses untuk better UX
   - Parse response untuk extract destination names → trigger map zoom/pan

4. **Firestore Best Practices**
   - Composite indexes untuk query filtering (provinsi + kategori)
   - Use batch writes untuk bulk operations (500 docs max per batch)
   - Implement pagination dengan `limit()` + `startAfter()`
   - Use `where()` + `orderBy()` untuk filtering
   - Cache frequently accessed data di client-side
   - Use Firestore emulator untuk local development
   - Set up security rules untuk data protection
   - Use GeoPoint queries untuk proximity search

5. **Firebase Auth**
   - Email/password authentication
   - Google OAuth integration
   - Custom claims untuk user roles (future)
   - Session persistence

6. **State Management (Zustand)**
   - Store untuk selectedDestination: `{ name, lat, lng }`
   - Chat component update store setelah Gemini response
   - Map component subscribe ke store, trigger flyTo() saat update
   - Debounce untuk prevent multiple rapid updates

7. **PWA**
   - Cache API responses dengan Workbox
   - Offline map tiles dengan Cache API
   - Service worker update strategy
   - Background sync untuk offline actions

8. **Data Import Script**
   - Use Firebase Admin SDK untuk server-side import
   - Batch write operations (500 docs max per batch)
   - Error handling untuk partial failures
   - Progress tracking untuk large imports

13. **Parlant Integration Best Practices**
    - **Server Setup**: Initialize Parlant server dengan Gemini NLP adapter
    - **Journey Design**: Define journeys untuk structured conversation flows
      - Use state transitions (chat_state, tool_state) untuk flow control
      - Use conditions untuk branching logic
      - Handle edge cases dengan guidelines
    - **Guidelines**: Create guidelines untuk cultural context dan behavior control
      - Use conditions untuk trigger specific actions
      - Balance specificity dengan flexibility (avoid overly rigid responses)
    - **Custom Retrievers**: Implement custom RAG retrievers untuk FAISS
      - Use conversation history untuk generate better queries
      - Combine dengan metadata filtering
    - **Tools**: Implement tools untuk external API calls (Gemini, Perplexity, FAISS, etc)
      - Tool states must be followed by chat states
      - Return ToolResult dengan data untuk context injection
    - **Sessions**: Handle session events dengan long polling untuk real-time updates
      - Use `wait_for_data` parameter untuk long polling
      - Listen untuk status events (processing, typing, ready)
    - **Glossary**: Use glossary terms untuk domain-specific vocabulary (budaya lokal)
      - Define terms dengan synonyms untuk better understanding
    - **Error Handling**: Handle Parlant errors gracefully
      - Fallback untuk manual mode jika needed
      - Human handoff support jika agent cannot handle
    - **Testing**: Test journeys dengan sample conversations
      - Verify state transitions work correctly
      - Test edge cases dan guidelines
    - **Monitoring**: Monitor Parlant session events untuk debugging
      - Log events untuk troubleshooting
      - Track journey completion rates

## Additional Technical Considerations

### Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /destinations/{document=**} {
      allow read: if true;
      allow write: if false; // Admin only
    }
    match /umkm/{document=**} {
      allow read: if true;
      allow write: if false; // Admin only
    }
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /itineraries/{document=**} {
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow update, delete: if false;
    }
  }
}
```

### Geospatial Queries
- Firestore tidak punya native geoqueries
- Gunakan GeoFirestore library untuk proximity search
- Atau filter di client-side setelah fetch berdasarkan viewport

### Gemini API Best Practices
- Cache responses di Firestore untuk identical queries
- Implement request queue jika rate limit tercapai
- Show user feedback jika request sedang di-queue
- Error handling dengan retry logic (exponential backoff)
- Stream responses untuk better UX (jika supported)

### FAISS Vector Store Setup
- FAISS digunakan langsung di code (no server needed)
- Generate embeddings dengan Gemini Embedding 001 API untuk semua destinasi
- Index structure: `{ id, embedding, metadata: { name, provinsi, kategori, isCultural, ... } }`
- Query dengan FAISS similarity search untuk find similar embeddings
- Combine dengan metadata filtering untuk filter by provinsi/kategori
- Batch insert embeddings untuk performa (100-500 vectors per batch)
- Store index di local disk untuk persistence

### Route Optimization Best Practices
- Use OSRM untuk routing calculation (free, open source)
- TSP solver: nearest neighbor untuk fast solution, 2-opt untuk better optimization
- Calculate distance matrix hanya untuk destinations yang dipilih (bukan semua)
- Cache distance matrix untuk destinations yang sama
- Visual route dengan MapLibre polyline + markers untuk waypoints
- Show estimated travel time + distance di route summary

### Voice Input Best Practices
- Web Speech API hanya support di Chrome/Edge untuk Bahasa Indonesia
- Request mic permission dengan clear explanation
- Show visual feedback saat listening (waveform, microphone icon animation)
- Auto-stop setelah 10-15 detik atau user click stop
- Handle errors: mic permission denied, no speech detected, network error
- Fallback ke text input selalu tersedia

### Weather API Best Practices
- OpenWeatherMap free tier: 60 calls/minute, cukup untuk MVP
- Cache weather data di Firestore dengan TTL (1-2 jam)
- Batch request untuk multiple destinations (jika API support)
- Fallback ke cached data jika API limit tercapai
- Show weather icon + temperature di UI
- Include weather dalam AI prompt untuk smart recommendations

### Map Performance Optimization
- Use MapLibre native clustering atau plugin
- Lazy load markers berdasarkan viewport bounds
- Limit initial data load (e.g., top 100 destinations)
- Virtual scrolling untuk large lists
- Debounce search/filter inputs

### Error Handling
- Firebase offline mode: show cached data + sync indicator
- Gemini API failures: graceful degradation dengan cached responses
- Map loading errors: fallback to static map atau simplified view
- Network errors: retry dengan exponential backoff

### Monitoring & Logging
- Log API requests (Gemini, Firestore queries)
- Track map loading performance
- Monitor Gemini API quota usage
- Error tracking (Sentry atau Firebase Crashlytics)