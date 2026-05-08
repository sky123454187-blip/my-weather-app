import { taiwanData } from './taiwanData.js';

const counties = {};
taiwanData.forEach(loc => {
  const match = loc.name.match(/^([^區市鎮鄉]+[市縣])/);
  if (match) {
    const county = match[1];
    counties[county] = (counties[county] || 0) + 1;
  }
});

console.log('=== 現有資料統計 ===\n');
let total = 0;
Object.keys(counties).sort().forEach(county => {
  console.log(`${county}: ${counties[county]} 筆`);
  total += counties[county];
});
console.log(`\n總計: ${total} 筆`);
console.log(`(包括各縣市主要名稱)\n`);

// 南投詳細
console.log('南投縣所有項目:');
taiwanData.filter(l => l.name.includes('南投')).forEach((loc, i) => {
  console.log(`  ${i + 1}. ${loc.name}`);
});
