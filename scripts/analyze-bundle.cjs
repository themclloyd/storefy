#!/usr/bin/env node

/**
 * Bundle analysis script for Storefy
 * Analyzes the production build and provides insights
 */

const fs = require('fs');
const path = require('path');

console.log('📊 Analyzing Storefy bundle...\n');

const distPath = path.join(__dirname, '..', 'dist');

if (!fs.existsSync(distPath)) {
  console.error('❌ No dist folder found. Run "npm run build" first.');
  process.exit(1);
}

// Analyze JavaScript files
const jsPath = path.join(distPath, 'js');
const jsFiles = fs.readdirSync(jsPath).filter(file => file.endsWith('.js'));

let totalJsSize = 0;
const jsAnalysis = jsFiles.map(file => {
  const filePath = path.join(jsPath, file);
  const stats = fs.statSync(filePath);
  totalJsSize += stats.size;
  
  return {
    name: file,
    size: stats.size,
    sizeKB: (stats.size / 1024).toFixed(2)
  };
}).sort((a, b) => b.size - a.size);

// Analyze CSS files
const cssFiles = fs.readdirSync(distPath)
  .filter(file => file.endsWith('.css'))
  .map(file => {
    const filePath = path.join(distPath, file);
    const stats = fs.statSync(filePath);
    return {
      name: file,
      size: stats.size,
      sizeKB: (stats.size / 1024).toFixed(2)
    };
  });

const totalCssSize = cssFiles.reduce((sum, file) => sum + file.size, 0);

console.log('📦 JavaScript Bundle Analysis:');
console.log(`Total JS Size: ${(totalJsSize / 1024).toFixed(2)} KB`);
console.log('\nLargest JS chunks:');
jsAnalysis.slice(0, 10).forEach(file => {
  console.log(`  ${file.name}: ${file.sizeKB} KB`);
});

console.log('\n🎨 CSS Bundle Analysis:');
console.log(`Total CSS Size: ${(totalCssSize / 1024).toFixed(2)} KB`);
cssFiles.forEach(file => {
  console.log(`  ${file.name}: ${file.sizeKB} KB`);
});

console.log('\n📈 Bundle Summary:');
console.log(`Total Bundle Size: ${((totalJsSize + totalCssSize) / 1024).toFixed(2)} KB`);

// Performance recommendations
console.log('\n💡 Performance Recommendations:');

if (totalJsSize > 2 * 1024 * 1024) { // 2MB
  console.log('⚠️  Large JS bundle detected. Consider:');
  console.log('   - Implementing more aggressive code splitting');
  console.log('   - Lazy loading non-critical components');
  console.log('   - Removing unused dependencies');
}

const largeChunks = jsAnalysis.filter(file => file.size > 500 * 1024); // 500KB
if (largeChunks.length > 0) {
  console.log('⚠️  Large chunks detected:');
  largeChunks.forEach(chunk => {
    console.log(`   - ${chunk.name} (${chunk.sizeKB} KB)`);
  });
  console.log('   Consider splitting these further.');
}

if (totalCssSize > 200 * 1024) { // 200KB
  console.log('⚠️  Large CSS bundle. Consider:');
  console.log('   - Purging unused CSS');
  console.log('   - Using CSS-in-JS for component-specific styles');
}

console.log('\n✅ Analysis complete!');
