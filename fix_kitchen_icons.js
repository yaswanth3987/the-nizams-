const fs = require('fs');
const file = 'frontend/src/pages/KitchenDisplay.jsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/if \(lower\.includes\('spicy'\)\) return <span className="text-red-500 font-bold ml-2">.*<\/span>;/, "if (lower.includes('spicy')) return <span className=\"text-red-500 font-bold ml-2\"><Flame size={16} /><\/span>;");
fs.writeFileSync(file, content, 'utf8');
console.log('Fixed KitchenDisplay.jsx spice icons.');
