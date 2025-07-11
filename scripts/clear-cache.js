#!/usr/bin/env node

/**
 * Clear Vite cache and restart development server
 * This script helps resolve file loading issues in Vite
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🧹 Clearing Vite cache and restarting development server...\n');

// Paths to clear
const pathsToRemove = [
  'node_modules/.vite',
  'dist',
  '.vite',
  'node_modules/.cache'
];

// Function to remove directory recursively
function removeDir(dirPath) {
  if (fs.existsSync(dirPath)) {
    console.log(`🗑️  Removing ${dirPath}`);
    try {
      fs.rmSync(dirPath, { recursive: true, force: true });
      console.log(`✅ Removed ${dirPath}`);
    } catch (error) {
      console.log(`⚠️  Could not remove ${dirPath}: ${error.message}`);
    }
  } else {
    console.log(`ℹ️  ${dirPath} does not exist, skipping`);
  }
}

// Clear cache directories
console.log('Clearing cache directories:');
pathsToRemove.forEach(removeDir);

console.log('\n🔄 Reinstalling dependencies...');
try {
  execSync('npm install', { stdio: 'inherit' });
  console.log('✅ Dependencies reinstalled');
} catch (error) {
  console.error('❌ Failed to reinstall dependencies:', error.message);
  process.exit(1);
}

console.log('\n🚀 Starting development server...');
try {
  execSync('npm run dev', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Failed to start development server:', error.message);
  process.exit(1);
}
