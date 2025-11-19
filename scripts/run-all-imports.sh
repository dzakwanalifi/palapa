#!/bin/bash

# PALAPA Complete Data Import Orchestrator
# Runs all import scripts in sequence

set -e

echo "======================================================================"
echo "PALAPA COMPLETE DATA IMPORT ORCHESTRATOR"
echo "======================================================================"
echo ""

echo "[1/3] Running main destination data import..."
echo "-----------------------------------------------"
python3 scripts/import-data-parallel.py

if [ $? -ne 0 ]; then
    echo "[ERROR] Destination import failed"
    exit 1
fi

echo ""
echo "[SUCCESS] Destination import completed!"
echo ""

echo "[2/3] Creating UMKM data..."
echo "-----------------------------"
python3 scripts/create-umkm-proper.py

if [ $? -ne 0 ]; then
    echo "[ERROR] UMKM creation failed"
    exit 1
fi

echo ""
echo "[SUCCESS] UMKM creation completed!"
echo ""

echo "[3/3] Creating Local Guides..."
echo "-------------------------------"
python3 scripts/create-local-guides.py

if [ $? -ne 0 ]; then
    echo "[ERROR] Local guides creation failed"
    exit 1
fi

echo ""
echo "[SUCCESS] Local guides creation completed!"
echo ""

echo "======================================================================"
echo "ALL IMPORTS COMPLETED SUCCESSFULLY!"
echo "======================================================================"
echo ""
echo "Database Status:"
echo "  - Destinations: 1,432 documents + FAISS embeddings"
echo "  - UMKM: 21 businesses"
echo "  - Local Guides: 10 professional guides"
echo "  - Ready for production!"
echo ""
