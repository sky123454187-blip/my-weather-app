import { taiwanData } from './taiwanData.js';

console.log('=== 台灣鄉鎮市完整統計 ===\n');

const counties = [
  { name: '台北市', expected: 11 },
  { name: '新北市', expected: 29 },
  { name: '基隆市', expected: 7 },
  { name: '新竹市', expected: 3 },
  { name: '新竹縣', expected: 11 },
  { name: '桃園市', expected: 13 },
  { name: '苗栗縣', expected: 18 },
  { name: '台中市', expected: 29 },
  { name: '彰化縣', expected: 26 },
  { name: '南投縣', expected: 13 },
  { name: '雲林縣', expected: 16 },
  { name: '嘉義市', expected: 2 },
  { name: '嘉義縣', expected: 16 },
  { name: '台南市', expected: 37 },
  { name: '高雄市', expected: 38 },
  { name: '屏東縣', expected: 33 },
  { name: '宜蘭縣', expected: 12 },
  { name: '花蓮縣', expected: 13 },
  { name: '台東縣', expected: 16 },
  { name: '澎湖縣', expected: 6 },
  { name: '金門縣', expected: 6 },
  { name: '連江縣', expected: 4 }
];

let totalExpected = 0;
let totalActual = 0;

counties.forEach(county => {
  const items = taiwanData.filter(loc => 
    loc.name === county.name || loc.name.startsWith(county.name)
  );
  const count = items.length - 1; // 減去縣市本身
  const status = count === county.expected ? '✓' : `✗ (差${county.expected - count})`;
  console.log(`${status} ${county.name}: ${count}/${county.expected}`);
  totalExpected += county.expected;
  totalActual += count;
});

console.log(`\n總計: ${totalActual}/${totalExpected} (還缺 ${totalExpected - totalActual} 個)`);
console.log(`全部資料筆數: ${taiwanData.length}`);
