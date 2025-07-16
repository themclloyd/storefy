#!/usr/bin/env node

/**
 * Production build verification script
 * Checks if the build is ready for production deployment
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying production build...\n');

const distPath = path.join(__dirname, '..', 'dist');
const srcPath = path.join(__dirname, '..', 'src');

let errors = [];
let warnings = [];

// Check if dist folder exists
if (!fs.existsSync(distPath)) {
  errors.push('❌ No dist folder found. Run "npm run build" first.');
} else {
  console.log('✅ Dist folder exists');
}

// Check for required files
const requiredFiles = ['index.html'];
requiredFiles.forEach(file => {
  const filePath = path.join(distPath, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file} exists`);
  } else {
    errors.push(`❌ Missing required file: ${file}`);
  }
});

// Check for demo/test files in source
const demoFiles = [
  'TestDemo.tsx',
  'QuickBooksDemo.tsx',
  'PinSessionDebug.tsx'
];

demoFiles.forEach(file => {
  const found = findFileRecursive(srcPath, file);
  if (found.length > 0) {
    errors.push(`❌ Demo/test file still exists: ${found.join(', ')}`);
  } else {
    console.log(`✅ Demo file removed: ${file}`);
  }
});

// Check environment variables
console.log('\n🔍 Checking environment configuration...');
const envExample = path.join(__dirname, '..', '.env.example');
if (fs.existsSync(envExample)) {
  console.log('✅ .env.example exists');
} else {
  warnings.push('⚠️  No .env.example file found');
}

// Check bundle sizes
console.log('\n📦 Checking bundle sizes...');
const jsPath = path.join(distPath, 'js');
if (fs.existsSync(jsPath)) {
  const jsFiles = fs.readdirSync(jsPath).filter(file => file.endsWith('.js'));
  const totalSize = jsFiles.reduce((sum, file) => {
    const filePath = path.join(jsPath, file);
    return sum + fs.statSync(filePath).size;
  }, 0);
  
  const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);
  console.log(`📊 Total JS bundle size: ${totalSizeMB} MB`);
  
  if (totalSize > 5 * 1024 * 1024) { // 5MB
    warnings.push(`⚠️  Large bundle size: ${totalSizeMB} MB. Consider optimization.`);
  } else {
    console.log('✅ Bundle size is reasonable');
  }
}

// Summary
console.log('\n📋 Verification Summary:');
console.log(`✅ Checks passed: ${getPassedChecks()}`);
console.log(`⚠️  Warnings: ${warnings.length}`);
console.log(`❌ Errors: ${errors.length}`);

if (warnings.length > 0) {
  console.log('\n⚠️  Warnings:');
  warnings.forEach(warning => console.log(warning));
}

if (errors.length > 0) {
  console.log('\n❌ Errors:');
  errors.forEach(error => console.log(error));
  console.log('\n🚫 Build verification failed. Please fix the errors above.');
  process.exit(1);
} else {
  console.log('\n🎉 Build verification passed! Ready for production deployment.');
}

// Helper functions
function findFileRecursive(dir, filename) {
  const found = [];
  
  function search(currentDir) {
    try {
      const files = fs.readdirSync(currentDir);
      
      files.forEach(file => {
        const filePath = path.join(currentDir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
          search(filePath);
        } else if (file === filename) {
          found.push(filePath);
        }
      });
    } catch (error) {
      // Skip directories we can't read
    }
  }
  
  search(dir);
  return found;
}

function getPassedChecks() {
  const totalChecks = 5; // Number of main checks
  const failedChecks = errors.length;
  return Math.max(0, totalChecks - failedChecks);
}
