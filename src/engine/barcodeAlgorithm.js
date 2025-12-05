// Barcode Algorithm - Based on Skannerz Patent
// Supports UPC-A, EAN-13, EAN-8, UPC-E, and fallback for other formats

const TOTAL_MONSTERS = 126;
const BARCODE_RANGE = 1000; // 000-999 from product code digits

// Calculate how many barcode values map to each monster
// 1000 / 126 = ~7.94, so most monsters get 8 values, last 2 get 4
const STANDARD_RANGE = 8;
const LAST_MONSTERS_COUNT = 2;
const LAST_MONSTERS_RANGE = 4;

/**
 * Extract product code from ANY barcode format
 * Returns a normalized 5-digit product code string
 */
export function extractProductCode(barcodeString) {
  // Remove any spaces, dashes, or other separators
  const cleaned = barcodeString.replace(/[\s\-\.]/g, '');
  
  // Must be numeric
  if (!/^\d+$/.test(cleaned)) {
    throw new Error('Barcode must contain only digits');
  }

  let productCode;

  switch (cleaned.length) {
    case 12:
      // UPC-A: [0] + [12345] + [67890] + [1]
      //         ^      ^          ^       ^
      //       type  manufac    PRODUCT  check
      // Product code is positions 6-10 (5 digits)
      productCode = cleaned.substring(6, 11);
      break;

    case 13:
      // EAN-13: [0] + [123456] + [78901] + [2]
      //          ^       ^          ^       ^
      //       country  manufac   PRODUCT  check
      // Product code is positions 7-11 (5 digits)
      productCode = cleaned.substring(7, 12);
      break;

    case 8:
      // EAN-8: [012] + [3456] + [7]
      //          ^        ^      ^
      //       country  PRODUCT  check
      // Product code is positions 3-6 (4 digits) - pad to 5
      productCode = '0' + cleaned.substring(3, 7);
      break;

    case 6:
      // UPC-E: Compressed format, expand to UPC-A first
      productCode = expandUPCE(cleaned);
      break;

    default:
      // Fallback: Use last 5 digits (or pad if shorter)
      if (cleaned.length >= 5) {
        productCode = cleaned.slice(-5);
      } else {
        productCode = cleaned.padStart(5, '0');
      }
  }

  return productCode;
}

/**
 * Expand UPC-E (6 digits) to get product code
 * UPC-E encodes data in a compressed format
 */
function expandUPCE(upcE) {
  // UPC-E expansion rules based on last digit
  const lastDigit = upcE[5];
  let productCode;

  // Simplified expansion - extract meaningful digits
  // In practice, UPC-E encodes manufacturer + product in 6 digits
  // We'll use a simplified extraction that still gives deterministic results
  switch (lastDigit) {
    case '0':
    case '1':
    case '2':
      // Product code is digits 4-5 + last digit + 00
      productCode = upcE.substring(3, 5) + lastDigit + '00';
      break;
    case '3':
      // Product code is digit 5 + 0000
      productCode = upcE[4] + '0000';
      break;
    case '4':
      // Product code is digit 5 + 0000  
      productCode = upcE[4] + '0000';
      break;
    default:
      // 5-9: Product code is 0000 + last digit
      productCode = '0000' + lastDigit;
  }

  return productCode.substring(0, 5);
}

/**
 * Determine if barcode yields Monster or Item
 * Uses sum of all digits for better randomization across products
 * ~30% chance for Monster, ~70% chance for Item
 * (Monsters are rare and special, items are common drops!)
 */
export function getBarcodeType(productCode) {
  // Sum all digits in the product code
  const digitSum = productCode
    .split('')
    .reduce((sum, digit) => sum + parseInt(digit), 0);
  
  // Use modulo 10 to get 0-9
  // 0, 1, 2 = Monster (30%)
  // 3, 4, 5, 6, 7, 8, 9 = Item (70%)
  const result = digitSum % 10;
  return result <= 2 ? 'MONSTER' : 'ITEM';
}

/**
 * Extract the identification number from product code
 * Uses last 3 digits = range 000-999
 */
export function getIdentificationNumber(productCode) {
  const idString = productCode.substring(2, 5);
  return parseInt(idString);
}

/**
 * Map identification number (0-999) to monster ID (1-126)
 */
export function mapToMonsterId(identificationNumber) {
  if (identificationNumber < 0 || identificationNumber >= BARCODE_RANGE) {
    // Wrap around if somehow out of range
    identificationNumber = identificationNumber % BARCODE_RANGE;
  }

  // First 124 monsters get 8 values each (0-991)
  const standardMonstersRange = (TOTAL_MONSTERS - LAST_MONSTERS_COUNT) * STANDARD_RANGE;
  
  if (identificationNumber < standardMonstersRange) {
    return Math.floor(identificationNumber / STANDARD_RANGE) + 1;
  } else {
    // Last 2 monsters (125-126) get 4 values each (992-999)
    const offsetFromStandard = identificationNumber - standardMonstersRange;
    const monsterId = Math.floor(offsetFromStandard / LAST_MONSTERS_RANGE) + (TOTAL_MONSTERS - LAST_MONSTERS_COUNT + 1);
    return Math.min(monsterId, TOTAL_MONSTERS);
  }
}

/**
 * Map identification number (0-999) to item ID (1-24)
 */
export function mapToItemId(identificationNumber) {
  const TOTAL_ITEMS = 24;
  const valuesPerItem = Math.floor(BARCODE_RANGE / TOTAL_ITEMS);
  const itemId = Math.floor(identificationNumber / valuesPerItem) + 1;
  return Math.min(itemId, TOTAL_ITEMS);
}

/**
 * Main entry point: Convert barcode to Monster ID or Item ID
 * Now accepts UPC-A, EAN-13, EAN-8, UPC-E, and other formats!
 */
export function processBarcode(barcodeString) {
  try {
    const productCode = extractProductCode(barcodeString);
    const type = getBarcodeType(productCode);
    const idNumber = getIdentificationNumber(productCode);

    if (type === 'MONSTER') {
      const monsterId = mapToMonsterId(idNumber);
      return {
        type: 'MONSTER',
        id: monsterId,
        barcode: barcodeString,
        debugInfo: {
          productCode,
          idNumber,
          monsterId,
          format: detectFormat(barcodeString)
        }
      };
    } else {
      const itemId = mapToItemId(idNumber);
      return {
        type: 'ITEM',
        id: itemId,
        barcode: barcodeString,
        debugInfo: {
          productCode,
          idNumber,
          itemId,
          format: detectFormat(barcodeString)
        }
      };
    }
  } catch (error) {
    return {
      type: 'ERROR',
      error: error.message,
      barcode: barcodeString
    };
  }
}

/**
 * Detect barcode format for debugging
 */
function detectFormat(barcodeString) {
  const cleaned = barcodeString.replace(/[\s\-\.]/g, '');
  switch (cleaned.length) {
    case 12: return 'UPC-A';
    case 13: return 'EAN-13';
    case 8: return 'EAN-8';
    case 6: return 'UPC-E';
    default: return `Other (${cleaned.length} digits)`;
  }
}

/**
 * Test function to verify algorithm works with different formats
 */
export function testAlgorithm() {
  const tests = [
    // UPC-A (12 digits)
    { barcode: '012345000001', expected: { type: 'MONSTER' }, desc: 'UPC-A standard' },
    { barcode: '026825008908', expected: { type: 'MONSTER' }, desc: 'UPC-A (pasta sauce)' },
    
    // EAN-13 (13 digits)
    { barcode: '0012345678905', expected: { type: 'MONSTER' }, desc: 'EAN-13' },
    
    // EAN-8 (8 digits) - Your Trader Joe's barcode!
    { barcode: '00822633', expected: { type: 'MONSTER' }, desc: 'EAN-8 (TJs item)' },
    
    // UPC-E (6 digits)
    { barcode: '123456', expected: { type: 'MONSTER' }, desc: 'UPC-E compressed' },
  ];

  console.log('Testing barcode algorithm with multiple formats...\n');
  tests.forEach((test, i) => {
    const result = processBarcode(test.barcode);
    const pass = result.type === test.expected.type;
    console.log(`Test ${i + 1} (${test.desc}): ${pass ? '✓' : '✗'}`);
    console.log(`  Barcode: ${test.barcode}`);
    console.log(`  Format: ${result.debugInfo?.format}`);
    console.log(`  Product Code: ${result.debugInfo?.productCode}`);
    console.log(`  Result: ${result.type} #${result.id}\n`);
  });
}