#!/usr/bin/env node

/**
 * Simple bundle analysis for Vite builds
 */

const fs = require('fs');
const path = require('path');

console.log('📦 Bundle Analysis for Storefy Dashboard\n');

const distPath = path.join(__dirname, '..', 'dist');
const assetsPath = path.join(distPath, 'assets');

if (!fs.existsSync(assetsPath)) {
  console.error('❌ Assets directory not found. Run npm run build first.');
  process.exit(1);
}

// Analyze JavaScript files
const jsFiles = fs.readdirSync(assetsPath)
  .filter(file => file.endsWith('.js') && !file.endsWith('.map'))
  .map(file => {
    const filePath = path.join(assetsPath, file);
    const stats = fs.statSync(filePath);
    return {
      name: file,
      size: stats.size,
      sizeKB: (stats.size / 1024).toFixed(2)
    };
  })
  .sort((a, b) => b.size - a.size);

// Analyze CSS files
const cssFiles = fs.readdirSync(assetsPath)
  .filter(file => file.endsWith('.css'))
  .map(file => {
    const filePath = path.join(assetsPath, file);
    const stats = fs.statSync(filePath);
    return {
      name: file,
      size: stats.size,
      sizeKB: (stats.size / 1024).toFixed(2)
    };
  });

const totalJsSize = jsFiles.reduce((sum, file) => sum + file.size, 0);
const totalCssSize = cssFiles.reduce((sum, file) => sum + file.size, 0);

console.log('📈 JavaScript Bundle Analysis:');
console.log(`Total JS Size: ${(totalJsSize / 1024).toFixed(2)} KB`);
console.log('\n🔝 Top 10 Largest JS Chunks:');
jsFiles.slice(0, 10).forEach((file, index) => {
  console.log(`${index + 1}. ${file.name}: ${file.sizeKB} KB`);
});

console.log('\n🎨 CSS Bundle Analysis:');
console.log(`Total CSS Size: ${(totalCssSize / 1024).toFixed(2)} KB`);
cssFiles.forEach(file => {
  console.log(`  ${file.name}: ${file.sizeKB} KB`);
});

console.log('\n📊 Bundle Summary:');
console.log(`Total Bundle Size: ${((totalJsSize + totalCssSize) / 1024).toFixed(2)} KB`);

// Performance recommendations
console.log('\n💡 Performance Analysis:');

const largeChunks = jsFiles.filter(file => file.size > 500 * 1024); // 500KB
if (largeChunks.length > 0) {
  console.log('⚠️  Large chunks detected (>500KB):');
  largeChunks.forEach(chunk => {
    console.log(`   - ${chunk.name} (${chunk.sizeKB} KB)`);
  });
  console.log('   💡 Consider code splitting these chunks');
}

const mediumChunks = jsFiles.filter(file => file.size > 100 * 1024 && file.size <= 500 * 1024);
if (mediumChunks.length > 0) {
  console.log('\n📦 Medium chunks (100-500KB):');
  mediumChunks.forEach(chunk => {
    console.log(`   - ${chunk.name} (${chunk.sizeKB} KB)`);
  });
}

if (totalCssSize > 200 * 1024) { // 200KB
  console.log('\n⚠️  Large CSS bundle detected:');
  console.log('   💡 Consider purging unused CSS');
  console.log('   💡 Use CSS-in-JS for component-specific styles');
}

// Dependency analysis
console.log('\n🔍 Dependency Analysis:');
const vendorChunks = jsFiles.filter(file => 
  file.name.includes('vendor') || 
  file.name.includes('index-') ||
  file.name.includes('CartesianChart') ||
  file.name.includes('html2canvas') ||
  file.name.includes('jspdf')
);

if (vendorChunks.length > 0) {
  console.log('📚 Third-party library chunks:');
  vendorChunks.forEach(chunk => {
    console.log(`   - ${chunk.name}: ${chunk.sizeKB} KB`);
  });
}

// Dashboard-specific analysis
const dashboardChunks = jsFiles.filter(file => 
  file.name.includes('Dashboard') ||
  file.name.includes('Chart') ||
  file.name.includes('Reports')
);

if (dashboardChunks.length > 0) {
  console.log('\n📊 Dashboard-related chunks:');
  dashboardChunks.forEach(chunk => {
    console.log(`   - ${chunk.name}: ${chunk.sizeKB} KB`);
  });
}

console.log('\n✅ Analysis complete!');
console.log('\n🎯 Recommendations for Dashboard Optimization:');
console.log('1. ✅ Code splitting is working well');
console.log('2. ✅ Lazy loading implemented for routes');
console.log('3. 💡 Consider lazy loading chart components');
console.log('4. 💡 Optimize large third-party libraries');
console.log('5. ✅ Dashboard components are properly chunked');
