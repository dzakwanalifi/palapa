# NEXT STEPS - Get PALAPA Running!

**Current Status:** ✅ All Code Complete
**What's Left:** Testing & Deployment

---

## 🚀 Step 1: Start Development Server

```bash
cd "d:\Arsip Kompetisi\Budaya GO"
npm run dev
```

Then visit: **http://localhost:3000**

---

## ✅ Step 2: Test the Three Pages

### Page 1: Home (Beranda) ✨
```
Expected to see:
✅ Full-screen map in background
✅ Gradient overlay at top
✅ "Hi [Name]" greeting with gradient text
✅ Search bar for destinations
✅ Category filter chips (scrollable)
✅ Recommendation cards at bottom (scrollable)
✅ Bottom navigation with 3 tabs

Click around:
- Type in search box → should filter destinations
- Scroll category chips → pick different categories
- Scroll recommendation cards → see different recommendations
- Bottom nav → click different tabs
```

### Page 2: PalapaBot Chat (Palapa) 💬
```
Expected to see:
✅ Click "🤖 Palapa" bottom tab
✅ Full-screen chat interface appears
✅ "Always Active 🟢" status on bot
✅ Bot's initial greeting

Test the flow:
1. Type destination name (e.g., "Yogyakarta")
2. Answer number of days (e.g., "3")
3. Enter budget (e.g., "5000000")
4. Click transport option (e.g., "🚗 Mobil Pribadi")
5. Click preference option (e.g., "🏛️ Budaya & Sejarah")
6. Wait for "Generating..." message
7. See "🎉 Itinerary siap!" and auto-scroll to Beranda
```

### Page 3: Result Page (Itinerary) 🗺️
```
After PalapaBot finishes, you should see:
✅ Map with route visualization
✅ Itinerary cards at bottom
✅ Cards showing Day 1, Day 2, etc.
✅ Each card lists destinations

Test interactions:
- Click a card → expands to show description
- Scroll left/right → see other days
- Click [🔄 Ubah] → goes back to chat
- Click [▶️ Mulai Perjalanan] → starts itinerary
```

---

## 🔐 Step 3: Deploy Firebase Security Rules

**⚠️ IMPORTANT:** Without this step, the app won't read data!

1. Go to: https://console.firebase.google.com
2. Select project: **palapa-budayago**
3. Navigate to: **Firestore Database → Rules** tab
4. Copy rules from: `firestore.rules.txt` (lines 10-71)
5. Click **Publish**
6. Wait for confirmation message

---

## 🧪 Step 4: Verify Backend Integration

### Check API endpoints work:

```bash
# Get destinations
curl http://localhost:3000/api/destinations

# Search destinations
curl http://localhost:3000/api/destinations?search=temple

# Get specific destination
curl http://localhost:3000/api/destinations/[destination-id]

# Calculate route (POST)
curl -X POST http://localhost:3000/api/routing/directions \
  -H "Content-Type: application/json" \
  -d '{"coordinates":[{"lat":-7.8,"lng":110.36},{"lat":-7.79,"lng":110.37}]}'
```

### Check Firestore data:

```bash
# Verify destinations imported
node scripts/check-latest-import.js

# Or check Firebase Console directly:
# Firestore → Collections → destinations → (should see 1,432 docs)
```

---

## 🎨 Step 5: Test Responsive Design

### Mobile (375px width)
```bash
# In Chrome DevTools:
1. Press F12
2. Click "Toggle device toolbar" (Ctrl+Shift+M)
3. Select iPhone 12 Pro (390x844)
4. Test:
   - Buttons are touchable (44x44px minimum)
   - Text is readable
   - Cards scroll smoothly
   - No layout broken
```

### Tablet (768px)
```bash
# In Chrome DevTools:
1. Select iPad (768x1024)
2. Verify layout looks good at this size
```

### Desktop (1440px+)
```bash
# Just your regular browser
1. Full width test
2. Multi-monitor ready
```

---

## 🐛 Step 6: Debug Checklist

If something doesn't work, check:

### Map not loading?
```javascript
// Open DevTools Console (F12)
// Look for:
- "MapLibreGL CSS imported" ✅
- No CORS errors ❌
- No "container must be HTMLElement" errors ❌
- Firebase initialized ✅
```

### Chat not opening?
```javascript
// Check:
- Is activeTab = 'palapa' when clicking tab? ✅
- Does PalapaBotChat component render? ✅
- Are click handlers working? ✅
```

### Itinerary not generating?
```javascript
// Check:
- Is generateTripPlan action being called? ✅
- Does Gemini API key work? ✅
- Are responses from API valid? ✅
```

### Database errors?
```javascript
// Check Firestore:
1. Go to Firebase Console
2. Firestore → destination collection
3. Should see 1,432 documents
4. Each with: id, name, latitude, longitude, etc.

// Check rules:
1. Firestore → Rules tab
2. Public collections allow read ✅
3. User collections require auth ✅
```

---

## 📦 Step 7: Build for Production

```bash
# Type-check first
npm run type-check

# Build
npm run build

# Check for errors
# If successful, you'll see:
# "✓ Compiled successfully"
```

---

## 🌐 Step 8: Deploy to Firebase Hosting

```bash
# Login to Firebase (first time only)
firebase login

# Deploy
firebase deploy

# Get your live URL from the output
# Visit it to test production version
```

---

## 📋 Final Verification Checklist

Before considering "done", verify:

- [ ] Home page loads with map background
- [ ] Search bar filters destinations
- [ ] Category chips filter correctly
- [ ] Recommendation cards scroll
- [ ] PalapaBot chat opens and works
- [ ] Full chat flow completes successfully
- [ ] Itinerary generates with destinations
- [ ] Result page shows map and cards
- [ ] Cards expand/collapse on click
- [ ] Action buttons work
- [ ] All animations are smooth
- [ ] No console errors
- [ ] Responsive on mobile/tablet/desktop
- [ ] API endpoints return data
- [ ] Firestore rules deployed
- [ ] Production build succeeds
- [ ] Deployed version works

---

## 🆘 Troubleshooting

### Issue: Map shows gray/blank
**Solution:**
1. Check MapLibreGL CSS imported in layout
2. Verify zoom level (try zoom: 11)
3. Check center coordinates: [110.3695, -7.7956]
4. Look for CORS errors in console

### Issue: Chat messages not appearing
**Solution:**
1. Check PalapaBotChat component is imported
2. Verify activeTab state management
3. Check if Messages state is updating
4. Look for errors in browser console

### Issue: Itinerary won't generate
**Solution:**
1. Check Gemini API key in .env.local
2. Verify generateTripPlan action exists
3. Check network tab for API call failures
4. Look for errors in server logs

### Issue: Buttons not responding
**Solution:**
1. Check onClick handlers are defined
2. Verify no JavaScript errors in console
3. Try hard refresh (Ctrl+Shift+R)
4. Check browser developer tools for issues

### Issue: Styling looks wrong
**Solution:**
1. Clear browser cache (Ctrl+Shift+Delete)
2. Hard refresh page (Ctrl+Shift+R)
3. Check Tailwind CSS building: `npm run build`
4. Verify design-tokens.css imported

---

## 📞 Quick Reference

### Important Files
```
app/page.tsx                          ← Main app structure
components/HomeView.tsx               ← Home page
components/PalapaBotChat.tsx          ← Chat interface
components/ResultPage.tsx             ← Result/itinerary page
lib/firestore.ts                      ← Database operations
lib/gemini.ts                         ← AI integration
styles/design-tokens.css              ← Design system
.env.local                            ← Environment variables
firestore.rules.txt                   ← Security rules
```

### Important URLs
```
Development:  http://localhost:3000
Firebase:     https://console.firebase.google.com
Firestore:    https://console.firebase.google.com/project/palapa-budayago/firestore
API Endpoints: /api/destinations, /api/routing/*
```

### Important Commands
```
npm run dev               ← Start development
npm run build            ← Build for production
npm run type-check       ← Check TypeScript
firebase deploy          ← Deploy to production
node verify-all-data.js  ← Verify database
```

---

## 🎯 Success Criteria

✅ You'll know it's working when:

1. **Home Page:**
   - Map visible with destination markers
   - Search filters destinations in real-time
   - Cards scroll smoothly
   - Animations play without stuttering

2. **PalapaBot Chat:**
   - Chat opens on tab click
   - Messages exchange smoothly
   - Options appear as buttons
   - Itinerary generates successfully

3. **Result Page:**
   - Map shows with route path
   - Cards display daily itineraries
   - Cards are expandable
   - All information visible and readable

4. **Data:**
   - Firestore has 1,432 destinations
   - API endpoints return valid data
   - Images load correctly
   - Ratings and prices display

---

## 🚀 You're Ready!

All the code is in place. Now it's time to:
1. ✅ Start the dev server
2. ✅ Test each page thoroughly
3. ✅ Deploy Firestore rules
4. ✅ Build for production
5. ✅ Deploy to Firebase

**Estimated time:** 30-60 minutes

**Good luck! 🎉**

---

*Remember: If something's not working, check the console (F12) first! 99% of issues have errors logged there.*
