import { taiwanData } from './taiwanData.js';

const expectedCounties = {
  '台北市': { count: 12, name: '台北市' },
  '新北市': { count: 29, name: '新北市' },
  '基隆市': { count: 7, name: '基隆市' },
  '新竹市': { count: 3, name: '新竹市' },
  '新竹縣': { count: 11, name: '新竹縣' },
  '桃園市': { count: 13, name: '桃園市' },
  '苗栗縣': { count: 18, name: '苗栗縣' },
  '台中市': { count: 29, name: '台中市' },
  '彰化縣': { count: 26, name: '彰化縣' },
  '南投縣': { count: 13, name: '南投縣' },
  '雲林縣': { count: 16, name: '雲林縣' },
  '嘉義市': { count: 2, name: '嘉義市' },
  '嘉義縣': { count: 16, name: '嘉義縣' },
  '台南市': { count: 37, name: '台南市' },
  '高雄市': { count: 38, name: '高雄市' },
  '屏東縣': { count: 33, name: '屏東縣' },
  '宜蘭縣': { count: 12, name: '宜蘭縣' },
  '花蓮縣': { count: 13, name: '花蓮縣' },
  '台東縣': { count: 16, name: '台東縣' },
  '澎湖縣': { count: 6, name: '澎湖縣' },
  '金門縣': { count: 6, name: '金門縣' },
  '連江縣': { count: 4, name: '連江縣' }
};

const actualCounties = {};
taiwanData.forEach(location => {
  const match = location.name.match(/^([^區市鎮鄉]+(?:市|縣))/);
  if (match) {
    const county = match[1];
    if (!actualCounties[county]) {
      actualCounties[county] = [];
    }
    actualCounties[county].push(location.name);
  }
});

console.log('=== 台灣各縣市鄉鎮驗證 ===\n');
let isOk = true;

Object.keys(expectedCounties).sort().forEach(county => {
  const expected = expectedCounties[county].count;
  const actual = actualCounties[county]?.filter(name => name !== county).length || 0;
  const status = actual === expected ? '✓' : '✗ 不符';
  console.log(`${status} ${county}: 預期${expected}個，實際${actual}個`);
  
  if (actual !== expected) {
    isOk = false;
  }
});

console.log(`\n=== 南投縣詳細清單 ===`);
console.log('目前資料:');
actualCounties['南投縣']?.filter(n => n !== '南投縣').forEach((name, idx) => {
  console.log(`  ${idx + 1}. ${name}`);
});

console.log(`\n=== 全國統計 ===`);
const totalExpected = Object.values(expectedCounties).reduce((sum, c) => sum + c.count, 0);
const totalActual = Object.values(actualCounties).reduce((sum, arr) => sum + arr.filter(n => n !== Object.keys(actualCounties).find(k => actualCounties[k][0] === n)).length, 0);
const totalDataPoints = taiwanData.length;
const totalCounties = Object.keys(expectedCounties).length;

console.log(`預期鄉鎮市總數: ${totalExpected}`);
console.log(`實際鄉鎮市總數: ${totalActual}`);
console.log(`資料筆數: ${totalDataPoints} (包括縣市本身)`);
console.log(`縣市數: ${totalCounties}`);

if (!isOk) {
  console.log('\n⚠️ 發現不符合的縣市!');
}
