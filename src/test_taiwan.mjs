import { taiwanData } from './taiwanData.js';

const countyMap = {};

taiwanData.forEach(location => {
  let county = location.name.match(/^[^區市鎮鄉]+(市|縣)/)?.[0];
  
  if (county) {
    if (!countyMap[county]) countyMap[county] = [];
    countyMap[county].push(location.name);
  }
});

console.log('=== 台灣各縣市鄉鎮統計 ===\n');
let totalLocations = 0;

const sortedCounties = Object.keys(countyMap).sort();
sortedCounties.forEach(county => {
  const locs = countyMap[county];
  const count = locs.filter(name => name !== county).length;
  console.log(`${county}: ${count} 個鄉鎮市`);
  totalLocations += count;
});

console.log(`\n=== 南投縣詳細清單 ===`);
if (countyMap['南投縣']) {
  countyMap['南投縣'].forEach((name, idx) => {
    if (name !== '南投縣') {
      console.log(`${idx}. ${name}`);
    }
  });
  console.log(`南投縣總計: ${countyMap['南投縣'].filter(n => n !== '南投縣').length} 個`);
}

console.log(`\n=== 全國統計 ===`);
console.log(`縣市數: ${sortedCounties.length}`);
console.log(`鄉鎮市數: ${totalLocations}`);
console.log(`全部資料: ${taiwanData.length}`);
