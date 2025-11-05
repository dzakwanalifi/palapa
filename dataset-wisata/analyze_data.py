import pandas as pd
import numpy as np

df = pd.read_csv('wisata_indonesia_merged_clean.csv')

print('=== UNIQUE VALUES ANALYSIS ===\n')

print('1. PROVINSI (unique values):')
prov_unique = df['provinsi'].value_counts()
print(f'Total unique: {df["provinsi"].nunique()}')
print(f'Top 30:\n')
for prov, count in prov_unique.head(30).items():
    print(f'  - {prov}: {count}')

print('\n2. KOTA KABUPATEN (unique values):')
kota_unique = df['kotaKabupaten'].value_counts()
print(f'Total unique: {df["kotaKabupaten"].nunique()}')
print(f'Top 40:\n')
for kota, count in kota_unique.head(40).items():
    print(f'  - {kota}: {count}')

print('\n3. ADDRESS CITY (unique values):')
addr_city_unique = df['addressCity'].value_counts()
print(f'Total unique: {df["addressCity"].nunique()}')
print(f'Top 30:\n')
for city, count in addr_city_unique.head(30).items():
    print(f'  - {city}: {count}')

print('\n4. ADDRESS (sample dengan data):')
addr_with_data = df[df['address'].notna() & (df['address'] != '')]
print(f'Total address dengan data: {len(addr_with_data)}')
print('\nSample addresses:')
for i, addr in enumerate(addr_with_data['address'].head(10), 1):
    print(f'{i}. {addr[:150]}')

print('\n5. LAT/LONG CHECK:')
print(f'Invalid lat (<-11 or >6): {((df["latitude"] < -11) | (df["latitude"] > 6)).sum()}')
print(f'Invalid lng (<95 or >141): {((df["longitude"] < 95) | (df["longitude"] > 141)).sum()}')
print(f'Missing lat: {df["latitude"].isna().sum()}')
print(f'Missing lng: {df["longitude"].isna().sum()}')
print(f'Lat range: {df["latitude"].min():.4f} to {df["latitude"].max():.4f}')
print(f'Lng range: {df["longitude"].min():.4f} to {df["longitude"].max():.4f}')

print('\n6. CATEGORY (unique values):')
cat_unique = df['category'].value_counts()
print(f'Total unique: {df["category"].nunique()}')
print(f'All categories:\n')
for cat, count in cat_unique.items():
    print(f'  - {cat}: {count}')

print('\n7. DATA QUALITY CHECK:')
print(f'Rows with missing provinsi: {(df["provinsi"].isna() | (df["provinsi"] == "")).sum()}')
print(f'Rows with missing kotaKabupaten: {(df["kotaKabupaten"].isna() | (df["kotaKabupaten"] == "")).sum()}')
print(f'Rows with missing address: {(df["address"].isna() | (df["address"] == "")).sum()}')
print(f'Rows with missing description: {(df["description"].isna() | (df["description"] == "")).sum()}')

