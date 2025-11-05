import pandas as pd
import numpy as np
import re
from pathlib import Path

# Path files
BASE_DIR = Path(__file__).parent
OUTPUT_FILE = BASE_DIR / "wisata_indonesia_merged_clean.csv"

print("🚀 Memulai merge dataset wisata Indonesia...")

# 1. Load tourism_with_id.csv
print("\n📊 Loading tourism_with_id.csv...")
df1 = pd.read_csv(BASE_DIR / "tourism_with_id.csv")
print(f"   ✅ Loaded {len(df1)} rows")

# 2. Load wisata_indonesia_final.csv
print("\n📊 Loading wisata_indonesia_final.csv...")
df2 = pd.read_csv(BASE_DIR / "wisata_indonesia_final.csv")
print(f"   ✅ Loaded {len(df2)} rows")

# 3. Load wisata_indonesia_new.csv
print("\n📊 Loading wisata_indonesia_new.csv...")
df3 = pd.read_csv(BASE_DIR / "wisata_indonesia_new.csv")
print(f"   ✅ Loaded {len(df3)} rows")

# 4. Normalize df1 (tourism_with_id.csv)
print("\n🔄 Normalizing tourism_with_id.csv...")
df1_normalized = pd.DataFrame({
    'name': df1['Place_Name'].fillna(''),
    'category': df1['Category'].fillna(''),
    'latitude': pd.to_numeric(df1['Lat'], errors='coerce'),
    'longitude': pd.to_numeric(df1['Long'], errors='coerce'),
    'address': df1['City'].fillna(''),  # Will be cleaned later
    'description': df1['Description'].fillna(''),
    'descriptionClean': df1['Description'].fillna(''),
    'priceRange': df1['Price'].apply(lambda x: str(int(x)) if pd.notna(x) and x > 0 else 'Gratis'),
    'rating': pd.to_numeric(df1['Rating'], errors='coerce'),
    'timeMinutes': pd.to_numeric(df1['Time_Minutes'], errors='coerce'),
    'provinsi': df1['City'].fillna(''),
    'kotaKabupaten': df1['City'].fillna(''),
    'source': 'tourism_with_id'
})

# 5. Normalize df2 (wisata_indonesia_final.csv)
print("🔄 Normalizing wisata_indonesia_final.csv...")
df2_normalized = pd.DataFrame({
    'name': df2['nama_wisata'].fillna(''),
    'category': df2['kategori'].fillna(''),
    'latitude': pd.to_numeric(df2['latitude'], errors='coerce'),
    'longitude': pd.to_numeric(df2['longitude'], errors='coerce'),
    'address': df2['alamat'].fillna(''),
    'description': df2['deskripsi'].fillna(''),
    'descriptionClean': df2['deskripsi'].fillna(''),
    'priceRange': 'Tidak diketahui',
    'rating': np.nan,
    'timeMinutes': np.nan,
    'provinsi': df2['provinsi'].fillna(''),
    'kotaKabupaten': df2['kota_kabupaten'].fillna(''),
    'source': 'wisata_indonesia_final'
})

# 6. Normalize df3 (wisata_indonesia_new.csv)
print("🔄 Normalizing wisata_indonesia_new.csv...")
df3_normalized = pd.DataFrame({
    'name': df3['nama_wisata'].fillna(''),
    'category': df3['kategori'].fillna(''),
    'latitude': pd.to_numeric(df3['latitude'], errors='coerce'),
    'longitude': pd.to_numeric(df3['longitude'], errors='coerce'),
    'address': df3['alamat'].fillna(''),
    'description': df3['deskripsi_bersih'].fillna(''),
    'descriptionClean': df3['deskripsi_bersih'].fillna(''),
    'priceRange': 'Tidak diketahui',
    'rating': np.nan,
    'timeMinutes': np.nan,
    'provinsi': df3['provinsi'].fillna(''),
    'kotaKabupaten': df3['kota_kabupaten'].fillna(''),
    'source': 'wisata_indonesia_new'
})

# 7. Combine all dataframes
print("\n🔗 Combining all datasets...")
df_combined = pd.concat([df1_normalized, df2_normalized, df3_normalized], ignore_index=True)
print(f"   ✅ Combined: {len(df_combined)} rows")

# 8. Remove duplicates based on name + coordinates (within 0.001 tolerance)
print("\n🔍 Removing duplicates...")
df_combined['name_lower'] = df_combined['name'].str.lower().str.strip()
df_combined['lat_round'] = df_combined['latitude'].round(3)
df_combined['lng_round'] = df_combined['longitude'].round(3)

# Remove rows with invalid coordinates
df_combined = df_combined[
    (df_combined['latitude'].notna()) & 
    (df_combined['longitude'].notna()) &
    (df_combined['latitude'].between(-11, 6)) &
    (df_combined['longitude'].between(95, 141))
]

# Deduplicate: keep first occurrence
df_combined = df_combined.drop_duplicates(
    subset=['name_lower', 'lat_round', 'lng_round'],
    keep='first'
)

# Remove helper columns
df_combined = df_combined.drop(columns=['name_lower', 'lat_round', 'lng_round', 'source'])

print(f"   ✅ After deduplication: {len(df_combined)} rows")

# 9. Clean and fill missing values
print("\n🧹 Cleaning data...")

# Helper function to clean text
def clean_text(text):
    if pd.isna(text):
        return ''
    text = str(text)
    # Remove newlines and tabs
    text = text.replace('\n', ' ').replace('\r', ' ').replace('\t', ' ')
    # Remove multiple spaces
    text = re.sub(r'\s+', ' ', text)
    # Remove special characters yang tidak perlu (keep punctuation normal: .,;:()-/)
    text = re.sub(r'[^\w\s.,;:()\-/]', '', text)
    # Remove leading/trailing spaces
    text = text.strip()
    return text

# Clean name
df_combined['name'] = df_combined['name'].apply(lambda x: clean_text(x) if pd.notna(x) else '')

# Clean category - fix typos and normalize to lowercase
print("   Cleaning categories...")
df_combined['category'] = df_combined['category'].str.strip().str.lower()

category_fixes = {
    'wisate alam': 'wisata alam',
    'wisawi alam': 'wisata alam',
    'wisath alam': 'wisata alam',
    'wisatr alam': 'wisata alam',
    'wisaub alam': 'wisata alam',
    'wisawa alam': 'wisata alam',
    'wisata  religi': 'wisata religi',
    'cafe view': 'wisata kuliner',
    'wisata lampion': 'taman hiburan'
}
df_combined['category'] = df_combined['category'].replace(category_fixes)

# Clean description - remove unwanted characters
print("   Cleaning descriptions...")
df_combined['description'] = df_combined['description'].apply(
    lambda x: clean_text(x) if pd.notna(x) and x != '' else ''
)
df_combined['descriptionClean'] = df_combined['description'].copy()

# Clean address - extract detail and city
print("   Cleaning addresses...")
def clean_address(address, provinsi='', kotaKabupaten=''):
    if pd.isna(address) or address == '':
        return '', ''
    
    address = str(address).strip()
    
    # If address is just a city/province name, return empty detail
    city_patterns = [
        r'^(Jakarta|Bandung|Surabaya|Yogyakarta|Semarang|Medan|Makassar|Palembang|Denpasar|Bali)$',
        r'^(Jawa (Barat|Tengah|Timur))$',
        r'^(Sumatera (Utara|Selatan|Barat))$',
    ]
    
    for pattern in city_patterns:
        if re.match(pattern, address, re.IGNORECASE):
            return '', address
    
    # Extract province/city from address if found
    detail = address
    city = ''
    
    # Common patterns in Indonesian addresses
    # Pattern: "Street, District, City, Province, Indonesia"
    parts = address.split(',')
    
    if len(parts) > 1:
        # Usually last few parts contain city/province
        # Try to identify city from parts
        for i, part in enumerate(reversed(parts)):
            part = part.strip()
            if part.lower() in ['indonesia', 'id']:
                continue
            # Check if part matches known cities/provinces
            city_candidates = [
                'Jakarta', 'Bandung', 'Surabaya', 'Yogyakarta', 'Semarang',
                'Medan', 'Makassar', 'Palembang', 'Denpasar', 'Bali',
                'Jawa Barat', 'Jawa Tengah', 'Jawa Timur',
                'Sumatera Utara', 'Sumatera Selatan', 'Sumatera Barat'
            ]
            for candidate in city_candidates:
                if candidate.lower() in part.lower():
                    city = candidate
                    # Remove city and everything after from detail
                    city_idx = len(parts) - i - 1
                    detail = ','.join(parts[:city_idx]).strip()
                    detail = re.sub(r'[,;]\s*$', '', detail).strip()
                    break
            if city:
                break
    
    # If no city extracted, use provinsi/kotaKabupaten from other columns
    if not city:
        if kotaKabupaten and str(kotaKabupaten).strip() != '':
            city = str(kotaKabupaten).strip()
        elif provinsi and str(provinsi).strip() != '':
            city = str(provinsi).strip()
    
    # Clean detail
    detail = re.sub(r'[,;]\s*$', '', detail).strip()
    
    return detail, city

# Apply address cleaning
address_cleaned = df_combined.apply(
    lambda row: clean_address(row['address'], row['provinsi'], row['kotaKabupaten']),
    axis=1
)
df_combined['address'] = [a[0] for a in address_cleaned]
df_combined['addressCity'] = [a[1] for a in address_cleaned]

# Normalize provinsi
print("   Normalizing provinces...")
provinsi_mapping = {
    'jakarta': 'DKI Jakarta',
    'bandung': 'Jawa Barat',
    'yogyakarta': 'Daerah Istimewa Yogyakarta',
    'semarang': 'Jawa Tengah',
    'surabaya': 'Jawa Timur',
    'bali': 'Bali',
    'jawa barat': 'Jawa Barat',
    'jawa tengah': 'Jawa Tengah',
    'jawa timur': 'Jawa Timur',
    'sumatera utara': 'Sumatera Utara',
    'sumatera selatan': 'Sumatera Selatan',
    'sumatera barat': 'Sumatera Barat',
    'sulawesi selatan': 'Sulawesi Selatan',
    'sulawesi utara': 'Sulawesi Utara',
    'sulawesi tenggara': 'Sulawesi Tenggara',
    'sulawesi tengah': 'Sulawesi Tengah',
    'sulawesi barat': 'Sulawesi Barat',
    'kalimantan barat': 'Kalimantan Barat',
    'kalimantan timur': 'Kalimantan Timur',
    'kalimantan selatan': 'Kalimantan Selatan',
    'kalimantan tengah': 'Kalimantan Tengah',
    'kalimantan utara': 'Kalimantan Utara',
    'nusa tenggara barat': 'Nusa Tenggara Barat',
    'nusa tenggara timur': 'Nusa Tenggara Timur',
    'kepulauan bangka belitung': 'Kepulauan Bangka Belitung',
    'papua barat daya': 'Papua Barat Daya',
    'maluku': 'Maluku',
    'maluku utara': 'Maluku Utara',
    'aceh': 'Aceh',
    'riau': 'Riau',
    'jambi': 'Jambi',
    'lampung': 'Lampung',
    'banten': 'Banten',
    'daerah istimewa yogyakarta': 'Daerah Istimewa Yogyakarta',
    'dki jakarta': 'DKI Jakarta',
    '': ''
}

def normalize_provinsi(prov):
    if pd.isna(prov) or prov == '':
        return ''
    prov_lower = str(prov).strip().lower()
    return provinsi_mapping.get(prov_lower, prov.strip())

df_combined['provinsi'] = df_combined['provinsi'].apply(normalize_provinsi)

# Normalize kota/kabupaten
print("   Normalizing cities...")
def normalize_kota(kota):
    if pd.isna(kota) or kota == '':
        return ''
    kota = str(kota).strip()
    
    # Remove unicode characters (keep only ASCII and common Indonesian chars)
    # Remove characters outside ASCII range except spaces and hyphens
    kota = ''.join(char if ord(char) < 128 or char in [' ', '-'] else '' for char in kota)
    kota = re.sub(r'\s+', ' ', kota)  # Clean multiple spaces
    kota = kota.strip()
    
    # Remove common prefixes
    kota = re.sub(r'^(Kota|Kabupaten|Kab\.|Kota\.)\s*', '', kota, flags=re.IGNORECASE)
    kota = kota.strip()
    
    # Fix common typos/misnames
    kota_fixes = {
        'Daerah Khusus ibukota Jakarta': 'Jakarta',
        'Daerah Khusus Ibukota Jakarta': 'Jakarta',
        'DKI Jakarta': 'Jakarta',
        'Yogyakarta': 'Yogyakarta',
        'Jogja': 'Yogyakarta',
        'Jogjakarta': 'Yogyakarta'
    }
    
    for old, new in kota_fixes.items():
        if old.lower() in kota.lower():
            kota = new
            break
    
    # If just "Sulawesi" or "Sumatera", try to infer from provinsi
    if kota.lower() in ['sulawesi', 'sumatera']:
        return ''  # Will be filled from provinsi
    
    return kota

df_combined['kotaKabupaten'] = df_combined['kotaKabupaten'].apply(normalize_kota)

# Fill missing provinsi from kotaKabupaten if possible
print("   Filling missing provinsi...")
for idx, row in df_combined.iterrows():
    if pd.isna(row['provinsi']) or row['provinsi'] == '':
        if pd.notna(row['kotaKabupaten']) and row['kotaKabupaten'] != '':
            kota = str(row['kotaKabupaten']).lower()
            if 'jakarta' in kota:
                df_combined.at[idx, 'provinsi'] = 'DKI Jakarta'
            elif 'yogyakarta' in kota or 'jogja' in kota:
                df_combined.at[idx, 'provinsi'] = 'Daerah Istimewa Yogyakarta'
            elif 'bandung' in kota:
                df_combined.at[idx, 'provinsi'] = 'Jawa Barat'
            elif 'surabaya' in kota or 'malang' in kota or 'batu' in kota:
                df_combined.at[idx, 'provinsi'] = 'Jawa Timur'
            elif 'semarang' in kota or 'surakarta' in kota or 'magelang' in kota:
                df_combined.at[idx, 'provinsi'] = 'Jawa Tengah'
            elif 'denpasar' in kota or 'badung' in kota or 'gianyar' in kota:
                df_combined.at[idx, 'provinsi'] = 'Bali'
            elif 'mataram' in kota or 'lombok' in kota:
                df_combined.at[idx, 'provinsi'] = 'Nusa Tenggara Barat'
            elif 'makassar' in kota or 'kendari' in kota:
                df_combined.at[idx, 'provinsi'] = 'Sulawesi Selatan'
            elif 'samarinda' in kota or 'balikpapan' in kota:
                df_combined.at[idx, 'provinsi'] = 'Kalimantan Timur'
            elif 'palembang' in kota:
                df_combined.at[idx, 'provinsi'] = 'Sumatera Selatan'
            elif 'medan' in kota:
                df_combined.at[idx, 'provinsi'] = 'Sumatera Utara'
        
        # Also check addressCity
        if (pd.isna(row['provinsi']) or row['provinsi'] == '') and pd.notna(row['addressCity']) and row['addressCity'] != '':
            addr_city = str(row['addressCity']).lower()
            if 'jakarta' in addr_city:
                df_combined.at[idx, 'provinsi'] = 'DKI Jakarta'
            elif 'yogyakarta' in addr_city or 'jogja' in addr_city:
                df_combined.at[idx, 'provinsi'] = 'Daerah Istimewa Yogyakarta'
            elif 'jawa barat' in addr_city or 'bandung' in addr_city:
                df_combined.at[idx, 'provinsi'] = 'Jawa Barat'
            elif 'jawa timur' in addr_city or 'surabaya' in addr_city:
                df_combined.at[idx, 'provinsi'] = 'Jawa Timur'
            elif 'jawa tengah' in addr_city or 'semarang' in addr_city:
                df_combined.at[idx, 'provinsi'] = 'Jawa Tengah'
            elif 'bali' in addr_city:
                df_combined.at[idx, 'provinsi'] = 'Bali'

# Validate and fix lat/long
print("   Validating lat/long...")
# Indonesia bounds: lat -11 to 6, lng 95 to 141
invalid_lat = (df_combined['latitude'] < -11) | (df_combined['latitude'] > 6)
invalid_lng = (df_combined['longitude'] < 95) | (df_combined['longitude'] > 141)

if invalid_lat.sum() > 0:
    print(f"   ⚠️  Found {invalid_lat.sum()} invalid latitudes, removing...")
    df_combined = df_combined[~invalid_lat]

if invalid_lng.sum() > 0:
    print(f"   ⚠️  Found {invalid_lng.sum()} invalid longitudes, removing...")
    df_combined = df_combined[~invalid_lng]

# Round lat/long to 6 decimal places (good precision for maps)
df_combined['latitude'] = df_combined['latitude'].round(6)
df_combined['longitude'] = df_combined['longitude'].round(6)

# Improve address quality - fill empty address with reasonable default
print("   Improving address quality...")
for idx, row in df_combined.iterrows():
    if (pd.isna(row['address']) or row['address'] == '') and pd.notna(row['name']):
        # If no address but have name, create minimal address from name
        name = str(row['name']).strip()
        if pd.notna(row['kotaKabupaten']) and str(row['kotaKabupaten']).strip() != '':
            df_combined.at[idx, 'address'] = f"{name}, {row['kotaKabupaten']}"
        elif pd.notna(row['provinsi']) and str(row['provinsi']).strip() != '':
            df_combined.at[idx, 'address'] = f"{name}, {row['provinsi']}"

# Remove imageUrl and imagePath columns if they exist
print("   Removing image columns...")
columns_to_drop = [col for col in ['imageUrl', 'imagePath'] if col in df_combined.columns]
if columns_to_drop:
    df_combined = df_combined.drop(columns=columns_to_drop)

print(f"   ✅ Cleaned: {len(df_combined)} rows")

# 10. Reorder columns
column_order = [
    'name', 'category', 'latitude', 'longitude', 'address', 'addressCity',
    'description', 'descriptionClean', 'priceRange', 'rating', 'timeMinutes',
    'provinsi', 'kotaKabupaten'
]
df_combined = df_combined[column_order]

# 11. Save to CSV
print(f"\n💾 Saving to {OUTPUT_FILE}...")
df_combined.to_csv(OUTPUT_FILE, index=False, encoding='utf-8')
print(f"   ✅ Saved successfully!")

# 12. Summary statistics
print("\n📈 Summary Statistics:")
print(f"   Total destinations: {len(df_combined)}")
print(f"   Unique categories: {df_combined['category'].nunique()}")
print(f"   Categories: {df_combined['category'].value_counts().head(10).to_dict()}")
print(f"   Provinces: {df_combined['provinsi'].nunique()}")
print(f"   Top 10 Provinces:")
for prov, count in df_combined['provinsi'].value_counts().head(10).items():
    if prov != '':
        print(f"      - {prov}: {count}")

print(f"\n   Missing data:")
print(f"      - provinsi: {df_combined['provinsi'].isna().sum() + (df_combined['provinsi'] == '').sum()}")
print(f"      - kotaKabupaten: {df_combined['kotaKabupaten'].isna().sum() + (df_combined['kotaKabupaten'] == '').sum()}")
print(f"      - address: {df_combined['address'].isna().sum() + (df_combined['address'] == '').sum()}")

print(f"\n✅ Merge completed! Output: {OUTPUT_FILE}")

