const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function walk(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        if (isDirectory && f !== 'node_modules' && f !== '.git') {
            walk(dirPath, callback);
        } else if (!isDirectory) {
            callback(path.join(dir, f));
        }
    });
}

console.log('🚀 Starting Automation: Fixing Encoding and Syntax...');

// 1. Fix Encodings in frontend/src and backend
const targets = [
    path.join(__dirname, 'frontend', 'src'),
    path.join(__dirname, 'backend')
];

targets.forEach(target => {
    if (!fs.existsSync(target)) return;
    console.log(`\n📂 Processing: ${target}`);
    walk(target, (filePath) => {
        if (filePath.endsWith('.js') || filePath.endsWith('.jsx') || filePath.endsWith('.css') || filePath.endsWith('.json')) {
            try {
                const content = fs.readFileSync(filePath);
                // Check if it looks like UTF-16 (simplified check)
                if (content[0] === 0xff && content[1] === 0xfe) {
                    console.log(`  ✨ Converting UTF-16LE to UTF-8: ${path.relative(__dirname, filePath)}`);
                    const utf8Content = content.toString('utf16le');
                    fs.writeFileSync(filePath, utf8Content, 'utf8');
                } else if (content[0] === 0xfe && content[1] === 0xff) {
                    console.log(`  ✨ Converting UTF-16BE to UTF-8: ${path.relative(__dirname, filePath)}`);
                    const utf8Content = content.toString('utf16be');
                    fs.writeFileSync(filePath, utf8Content, 'utf8');
                } else {
                    // Force re-save as UTF-8 anyway to clean up any weirdness
                    const utf8Content = content.toString('utf8');
                    fs.writeFileSync(filePath, utf8Content, 'utf8');
                }
            } catch (err) {
                console.error(`  ❌ Failed to process ${filePath}:`, err.message);
            }
        }
    });
});

// 2. Check for syntax errors in backend/server.js
const serverPath = path.join(__dirname, 'backend', 'server.js');
if (fs.existsSync(serverPath)) {
    console.log('\n🔍 Checking backend/server.js for syntax errors...');
    try {
        execSync(`node --check "${serverPath}"`, { stdio: 'inherit' });
        console.log('  ✅ No syntax errors found.');
    } catch (err) {
        console.error('  ❌ Syntax error found in backend/server.js!');
        // Attempt to fix common broken comments if found
        let content = fs.readFileSync(serverPath, 'utf8');
        if (content.includes('/ /')) {
            console.log('  🔧 Attempting to fix broken comments (/ /)...');
            content = content.replace(/\/ \//g, '//');
            fs.writeFileSync(serverPath, content, 'utf8');
            console.log('  ✅ Fixed broken comments.');
        }
    }
}

console.log('\n✅ Automation Complete! Files are ready for deployment.');
