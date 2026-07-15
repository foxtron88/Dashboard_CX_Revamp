const fs = require('fs');
const data = JSON.parse(fs.readFileSync('data/cx_performance.json', 'utf8'));

let totalPengunjung = 0;
let bu = 'all'; // test with ALL
if (data && Object.keys(data).length > 0) {
  if (bu === 'all') {
    Object.keys(data).forEach(key => {
      if (key !== '_months' && data[key].interactions && data[key].interactions.pengunjung) {
        totalPengunjung += data[key].interactions.pengunjung.reduce((a, b) => a + (b || 0), 0);
      }
    });
  }
}
console.log("Total for ALL:", totalPengunjung);

totalPengunjung = 0;
bu = 'API'; // test with API
if (data && Object.keys(data).length > 0) {
  if (data[bu] && data[bu].interactions && data[bu].interactions.pengunjung) {
    totalPengunjung = data[bu].interactions.pengunjung.reduce((a, b) => a + (b || 0), 0);
  }
}
console.log("Total for API:", totalPengunjung);
