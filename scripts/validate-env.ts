#!/usr/bin/env node
/**
 * Environment & Configuration Validation Script
 * Checks all required APIs and databases are properly configured
 */

import fs from 'fs';
import path from 'path';

interface ValidationResult {
  name: string;
  status: 'OK' | 'MISSING' | 'INVALID' | 'WARNING';
  message: string;
  required: boolean;
}

const results: ValidationResult[] = [];

// Load .env.local
const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.existsSync(envPath)
  ? fs.readFileSync(envPath, 'utf-8')
  : '';

const envVars = new Map<string, string>();
envContent.split('\n').forEach(line => {
  if (!line.startsWith('#') && line.includes('=')) {
    const [key, value] = line.split('=');
    envVars.set(key.trim(), value?.trim() || '');
  }
});

console.log('\n╔═══════════════════════════════════════════════════════════════╗');
console.log('║        PALAPA Environment Configuration Validator              ║');
console.log('╚═══════════════════════════════════════════════════════════════╝\n');

// ============= Firebase Configuration =============
console.log('📱 Firebase Configuration:');

const firebaseVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_APP_ID'
];

firebaseVars.forEach(varName => {
  const value = envVars.get(varName);
  if (value) {
    const masked = value.substring(0, 8) + '...' + value.substring(value.length - 4);
    results.push({
      name: varName,
      status: 'OK',
      message: masked,
      required: true
    });
    console.log(`  ✅ ${varName}`);
  } else {
    results.push({
      name: varName,
      status: 'MISSING',
      message: 'Not set',
      required: true
    });
    console.log(`  ❌ ${varName} - MISSING`);
  }
});

// ============= Gemini API =============
console.log('\n🤖 Gemini API:');
const geminiKey = envVars.get('GEMINI_API_KEY');
if (geminiKey) {
  results.push({
    name: 'GEMINI_API_KEY',
    status: 'OK',
    message: geminiKey.substring(0, 8) + '...',
    required: true
  });
  console.log(`  ✅ GEMINI_API_KEY configured`);
} else {
  results.push({
    name: 'GEMINI_API_KEY',
    status: 'MISSING',
    message: 'Not set',
    required: true
  });
  console.log(`  ❌ GEMINI_API_KEY - MISSING`);
}

// ============= Perplexity API =============
console.log('\n🔮 Perplexity API:');
const perplexityKey = envVars.get('PERPLEXITY_API_KEY');
if (perplexityKey) {
  results.push({
    name: 'PERPLEXITY_API_KEY',
    status: 'OK',
    message: 'configured',
    required: false
  });
  console.log(`  ✅ PERPLEXITY_API_KEY configured`);
} else {
  results.push({
    name: 'PERPLEXITY_API_KEY',
    status: 'WARNING',
    message: 'Optional - for semantic search',
    required: false
  });
  console.log(`  ⚠️  PERPLEXITY_API_KEY - Optional`);
}

// ============= Parlant SDK =============
console.log('\n🎯 Parlant SDK:');
const parlantUrl = envVars.get('PARLANT_SERVER_URL');
if (parlantUrl) {
  results.push({
    name: 'PARLANT_SERVER_URL',
    status: 'OK',
    message: parlantUrl,
    required: false
  });
  console.log(`  ✅ PARLANT_SERVER_URL: ${parlantUrl}`);
} else {
  results.push({
    name: 'PARLANT_SERVER_URL',
    status: 'WARNING',
    message: 'Not configured - Agent features will be disabled',
    required: false
  });
  console.log(`  ⚠️  PARLANT_SERVER_URL - Not configured`);
}

// ============= FAISS Vector Store =============
console.log('\n🗂️  Vector Store (FAISS):');
const faissPath = envVars.get('FAISS_INDEX_PATH');
if (faissPath) {
  const fullPath = path.join(process.cwd(), faissPath);
  const exists = fs.existsSync(fullPath);
  if (exists) {
    results.push({
      name: 'FAISS_INDEX_PATH',
      status: 'OK',
      message: `Exists at ${faissPath}`,
      required: false
    });
    console.log(`  ✅ FAISS index found at ${faissPath}`);
  } else {
    results.push({
      name: 'FAISS_INDEX_PATH',
      status: 'WARNING',
      message: `Path configured but not found`,
      required: false
    });
    console.log(`  ⚠️  FAISS index not found - will be created on first use`);
  }
}

// ============= Summary =============
console.log('\n╔═══════════════════════════════════════════════════════════════╗');
console.log('║                    VALIDATION SUMMARY                          ║');
console.log('╚═══════════════════════════════════════════════════════════════╝\n');

const missingRequired = results.filter(r => r.status === 'MISSING' && r.required);
const warnings = results.filter(r => r.status === 'WARNING');
const ok = results.filter(r => r.status === 'OK');

console.log(`✅ OK: ${ok.length}`);
console.log(`⚠️  WARNINGS: ${warnings.length}`);
console.log(`❌ MISSING (REQUIRED): ${missingRequired.length}\n`);

if (missingRequired.length > 0) {
  console.log('❌ CRITICAL ISSUES:\n');
  missingRequired.forEach(result => {
    console.log(`   - ${result.name}`);
  });
  console.log('\n   Please set these environment variables in .env.local\n');
  process.exit(1);
}

if (warnings.length > 0) {
  console.log('⚠️  WARNINGS:\n');
  warnings.forEach(result => {
    console.log(`   - ${result.name}: ${result.message}`);
  });
  console.log('');
}

console.log('✅ All required configurations are set!\n');
console.log('📋 Next steps:');
console.log('   1. Ensure Firebase Firestore rules allow read/write');
console.log('   2. Check Firebase Authentication is enabled');
console.log('   3. Verify destination data exists in Firestore\n');

process.exit(0);
