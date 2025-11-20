# Firestore Index Setup Guide

## Problem
Your Firestore query on the `itineraries` collection is failing with error:
```
The query requires an index
```

This happens because Firestore queries with **multiple filters + ordering** need a **composite index**.

## Quick Fix (Recommended)

### Method 1: Click the Error Link
1. When you see the error in the browser console, it will show a link like:
   ```
   https://console.firebase.google.com/v1/r/project/YOUR_PROJECT_ID/firestore/indexes?create_composite=...
   ```
2. **Click that link** - it will automatically create the index for you
3. Wait 1-2 minutes for the index to build
4. Refresh your app - the query will now work!

### Method 2: Deploy via Firebase CLI

1. **Install Firebase CLI** (if not installed):
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**:
   ```bash
   firebase login
   ```

3. **Deploy Indexes**:
   ```bash
   firebase deploy --only firestore:indexes
   ```

4. Wait for the deployment to complete (usually 1-2 minutes)

5. Check index status:
   ```bash
   firebase firestore:indexes
   ```

## Manual Method (Firebase Console)

If you prefer to create indexes manually:

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to **Firestore Database** → **Indexes** tab
4. Click **Create Index**
5. Configure the index:
   - **Collection**: `itineraries`
   - **Fields**:
     - `userId` → Ascending
     - `createdAt` → Descending
   - **Query scope**: Collection
6. Click **Create**
7. Wait for the index to build (status will change from "Building" to "Enabled")

## What Indexes Are Needed?

The `firestore.indexes.json` file in this project contains all required indexes:

### Primary Index (Critical - Fixes the error)
```json
{
  "collectionGroup": "itineraries",
  "fields": [
    { "fieldPath": "userId", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
}
```

This index is needed for the query in `lib/firestore.ts:326-343`:
```typescript
ItineraryService.queryDocuments<Itinerary>(
  COLLECTIONS.ITINERARIES,
  [where('userId', '==', userId)],
  {
    limit,
    orderBy: { field: 'createdAt', direction: 'desc' }
  }
);
```

### Additional Indexes (Optional - for destinations filtering)
These are already configured for future use:
- `destinations` collection with various field combinations
- See `firestore.indexes.json` for full list

## Why Do We Need Composite Indexes?

Firestore requires composite indexes when you:
1. Use multiple `where()` clauses, OR
2. Combine `where()` + `orderBy()` on different fields, OR
3. Use inequality operators (`>`, `<`, `!=`) with ordering

**Example from our code:**
```typescript
// This query needs an index:
where('userId', '==', userId)  // Filter by userId
orderBy('createdAt', 'desc')   // Order by createdAt
```

Without the index, Firestore cannot efficiently execute this query.

## Verify Index Status

After deployment, verify indexes are working:

```bash
firebase firestore:indexes
```

Look for status **"READY"** or **"ENABLED"** (not "BUILDING").

## Troubleshooting

### Index is still building after 5+ minutes
- Large collections take longer to index
- Check Firebase Console for progress
- Some indexes can take 10-15 minutes for large datasets

### Error: "Firebase CLI not found"
```bash
npm install -g firebase-tools
firebase login
```

### Error: "Insufficient permissions"
- Make sure you're logged in with the correct account
- Verify you have "Owner" or "Editor" role in Firebase Console
- Try: `firebase logout` then `firebase login` again

### Error: "Index already exists"
- This is fine - the index is already deployed
- Check Firebase Console to verify it's enabled

## Testing

After deploying indexes, test the Collections page:
1. Open the app
2. Navigate to "Koleksi" / "Collections" page
3. The page should load without errors
4. You should see your saved itineraries (if any exist)

## Need Help?

If you're still having issues:
1. Check the browser console for detailed error messages
2. Look for the auto-generated index creation link in the error
3. Verify your Firebase project ID in `.firebaserc`
4. Make sure you're using the correct Firebase project

## Files Modified
- ✅ `firestore.indexes.json` - Added itineraries composite index
- ✅ `lib/firestore.ts` - Query that requires the index (already exists)
- ✅ `components/CollectionsPage.tsx` - Page that triggers the query (already exists)

