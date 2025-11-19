# PALAPA Troubleshooting Guide

## Errors Kamu Alami

### 1️⃣ Console TypeError: `Failed to fetch`

**Penyebab:**
- API endpoint tidak accessible
- CORS blocking (jika API dari domain berbeda)
- Network connectivity issue
- API server down atau timeout

**Solusi:**
1. Buka DevTools (F12) → Network tab
2. Lihat request mana yang failed
3. Check error status code:
   - `0` atau blocked = Network/CORS issue
   - `404` = Endpoint tidak ditemukan
   - `500` = Server error
   - `401/403` = Auth/permission error

4. Cek dengan script validation:
```bash
npx ts-node scripts/validate-env.ts
```

5. Jika Firestore: buka browser console dan jalankan:
```javascript
import { getFirestore, collection, getDocs } from 'firebase/firestore';
const db = getFirestore();
const snap = await getDocs(collection(db, 'destinations'));
console.log(snap.size, 'documents found');
```

---

### 2️⃣ FirebaseError: `Missing or insufficient permissions`

**Penyebab:**
- Firestore security rules tidak allow read/write
- Tidak authenticated (untuk endpoints yang require auth)
- Rules publish failed

**Solusi Cepat (DEVELOPMENT ONLY):**

1. Buka [Firebase Console](https://console.firebase.google.com/)
2. Select project: `palapa-budayago`
3. Firestore Database → Rules tab
4. Paste ini:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```
5. Click **Publish**

**Solusi Proper (PRODUCTION):**

Use rules dari `firestore.rules.txt`:
- Copy content
- Paste ke Firebase Console Rules
- Jangan allow all - use specific permissions
- Test dengan authenticated user

---

### 3️⃣ Gemini API Error: `Invalid API Key`

**Penyebab:**
- `GEMINI_API_KEY` tidak set di `.env.local`
- API key invalid atau expired
- API quota exceeded

**Solusi:**
1. Check `.env.local` ada `GEMINI_API_KEY`:
```bash
cat .env.local | grep GEMINI
```

2. Jika kosong, ambil dari [Google AI Studio](https://aistudio.google.com/app/apikey)

3. Update `.env.local`:
```
GEMINI_API_KEY=your-key-here
```

4. Restart dev server:
```bash
npm run dev
```

---

## Scripts untuk Diagnose

### 1. Validate Environment
```bash
npx ts-node scripts/validate-env.ts
```
Output harus:
```
✅ All required configurations are set!
```

### 2. Check Firestore Data
```bash
npx ts-node scripts/check-firestore-data.ts
```
Output harus:
```
✅ destinations: 10+ documents
✅ umkm: 5+ documents
✅ local_guides: 3+ documents
```

Jika 0 documents, import data:
```bash
python scripts/import-data.py
```

### 3. Test Gemini Connection
```bash
# Create file: test-gemini.ts
import { createGeminiClient } from '@/lib/gemini';

const client = createGeminiClient();
const result = await client.test();
```

---

## Common Issues & Quick Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `Failed to fetch` | Network/CORS | Check DevTools Network, verify URLs |
| `Missing permissions` | Firestore rules | Update rules in Firebase Console |
| `GEMINI_API_KEY undefined` | Env var not set | Add key to `.env.local`, restart server |
| `No documents found` | Database empty | Run `python scripts/import-data.py` |
| `Parlant connection error` | Server not running | Optional - not critical for MVP |
| `Map not loading` | MapLibre error | Check browser console, verify tiles URL |

---

## Debugging Checklist

Before escalating issues:

- [ ] Browser console (F12) - no errors?
- [ ] Network tab - all requests succeeding?
- [ ] `.env.local` - all keys present and valid?
- [ ] Firebase Console - rules published?
- [ ] Firebase Console - collections exist with data?
- [ ] Dev server running - `npm run dev` working?
- [ ] Try hard refresh - `Ctrl+Shift+R`
- [ ] Clear browser cache - `Ctrl+Shift+Delete`

---

## Network Request Flow

```
Browser
  ↓
Next.js API Route / Server Action
  ↓
Service Layer (Firestore, Gemini, OSRM)
  ↓
External APIs / Database
```

**Debug each layer:**
1. DevTools Network tab - see request/response
2. Server console - see server-side errors
3. Browser console - see client-side errors

---

## Performance Tips

If app feels slow:

1. **Check map loading:**
   - MapView might be waiting for tiles
   - Use browser DevTools Performance tab

2. **Check data fetching:**
   - Network tab → see if requests are slow
   - Try smaller limit: `limit: 5` instead of `limit: 100`

3. **Check Firebase:**
   - Firestore composite indexes might be needed
   - Check Firebase Console → Firestore → Indexes

4. **Check Gemini:**
   - API calls might be slow due to model
   - Use faster model: `gemini-2.5-flash-lite` ✓ (already done)

---

## Getting Help

Jika stuck, provide:

1. Error message lengkap
2. Screenshot DevTools console (F12)
3. Screenshot DevTools Network tab
4. Output dari `npx ts-node scripts/validate-env.ts`
5. Output dari `npx ts-node scripts/check-firestore-data.ts`

---

## Useful Links

- [Firebase Console](https://console.firebase.google.com/)
- [Google AI Studio](https://aistudio.google.com/app/apikey)
- [Firebase Firestore Docs](https://firebase.google.com/docs/firestore)
- [Gemini API Docs](https://ai.google.dev/)
- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions)

---

Last updated: Nov 20, 2024
