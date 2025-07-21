// Test file to verify currency formatting with commas
import { formatCurrency, formatNumber } from './lib/taxUtils';

// Test cases for currency formatting
const testCases = [
  { amount: 1000, currency: 'USD', expected: '$1,000.00' },
  { amount: 1234.56, currency: 'USD', expected: '$1,234.56' },
  { amount: 1000000, currency: 'USD', expected: '$1,000,000.00' },
  { amount: 123456789.99, currency: 'USD', expected: '$123,456,789.99' },
  { amount: 1000, currency: 'MWK', expected: 'MWK 1,000.00' },
  { amount: 5000, currency: 'EUR', expected: '€5,000.00' },
  { amount: 10000, currency: 'JPY', expected: '¥10,000' }, // JPY has 0 decimals
];

// Test cases for number formatting
const numberTestCases = [
  { num: 1000, decimals: 2, expected: '1,000.00' },
  { num: 1234567, decimals: 0, expected: '1,234,567' },
  { num: 999.99, decimals: 2, expected: '999.99' },
  { num: 1000000.123, decimals: 3, expected: '1,000,000.123' },
];

console.log('Testing Currency Formatting:');
console.log('============================');

testCases.forEach((test, index) => {
  const result = formatCurrency(test.amount, test.currency);
  const passed = result === test.expected;
  console.log(`Test ${index + 1}: ${passed ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Input: ${test.amount} ${test.currency}`);
  console.log(`  Expected: ${test.expected}`);
  console.log(`  Got: ${result}`);
  console.log('');
});

console.log('Testing Number Formatting:');
console.log('==========================');

numberTestCases.forEach((test, index) => {
  const result = formatNumber(test.num, test.decimals);
  const passed = result === test.expected;
  console.log(`Test ${index + 1}: ${passed ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Input: ${test.num} (${test.decimals} decimals)`);
  console.log(`  Expected: ${test.expected}`);
  console.log(`  Got: ${result}`);
  console.log('');
});

// Export for potential use in actual tests
export { testCases, numberTestCases };
