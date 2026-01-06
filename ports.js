const fs = require('fs');

let p = [];
for(let i = 4000; i <= 4999; i++) {
    p.push({
    node: process.argv0[2] || 'FREE01',
    port: i,
    isUsed: false
});
}

fs.writeFileSync('./ports.json', JSON.stringify(p));