const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory() && !file.includes('node_modules')) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
            const content = fs.readFileSync(file, 'utf8');
            if (content.includes('Â') || content.includes('ð') || content.includes('Ÿ')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk('./frontend/src');
console.log('Files with suspected mojibake:', files);

files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    lines.forEach((line, i) => {
        if (line.includes('Â') || line.includes('ð') || line.includes('Ÿ')) {
            console.log(`${file}:${i + 1}: ${line.trim()}`);
        }
    });
});
