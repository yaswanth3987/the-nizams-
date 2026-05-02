const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function walk(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        if (isDirectory && f !== 'node_modules' && f !== '.git' && f !== 'dist') {
            walk(dirPath, callback);
        } else if (!isDirectory) {
            callback(path.join(dir, f));
        }
    });
}

console.log('🚀 Starting Automation: Fixing Encoding and Pound Signs...');

// 1. Fix Encodings and replace mangled characters
const targets = [
    path.join(__dirname, 'frontend', 'src'),
    path.join(__dirname, 'backend')
];

targets.forEach(target => {
    if (!fs.existsSync(target)) return;
    console.log(`\n📂 Processing: ${target}`);
    walk(target, (filePath) => {
        if (filePath.endsWith('.js') || filePath.endsWith('.jsx') || filePath.endsWith('.css') || filePath.endsWith('.html') || filePath.endsWith('.json')) {
            try {
                let content = fs.readFileSync(filePath, 'utf8');
                
                let changed = false;

                // Undo the previous mistake of literal \u00A3 strings
                if (content.includes('\\u00A3')) {
                    console.log(`  🔧 Reverting literal \\u00A3 in: ${path.relative(__dirname, filePath)}`);
                    content = content.replace(/\\u00A3/g, '£');
                    changed = true;
                }

                // Fix mangled pound signs (Â£ -> £)
                if (content.includes('Â£')) {
                    console.log(`  🔧 Fixing mangled pound sign (Â£) in: ${path.relative(__dirname, filePath)}`);
                    content = content.replace(/Â£/g, '£');
                    changed = true;
                }

                // Fix mangled emojis and symbols
                const emojiMap = {
                    'ðŸ’§': '💧',
                    'ðŸŒ±': '🌱',
                    'ðŸŒ¶ï¸ ': '🌶️',
                    'ðŸ”¥': '🔥',
                    'âœ¨': '✨',
                    'âœ“': '✓',
                    'âœ—': '✗',
                    'â†’': '→',
                    'â€¢': '•',
                    'âš ï¸ ': '⚠️',
                    'â—¦': '◦',
                    'â€”': '—',
                    'â Œ': '❌',
                    'âœ…': '✅',
                    'Ã°Å¸â€ºÂ¡Ã¯Â¸Â ': '🛡️',
                    'Ã°Å¸Å½Â¯': '🎯',
                    'Ã°Å¸â€œÅ ': '📊'
                };

                for (const [mangled, correct] of Object.entries(emojiMap)) {
                    if (content.includes(mangled)) {
                        console.log(`  🔧 Fixing mangled emoji in: ${path.relative(__dirname, filePath)}`);
                        content = content.split(mangled).join(correct);
                        changed = true;
                    }
                }

                // Fix placeholder corruption
                if (content.includes('Ã¯Â¿Â½')) {
                    console.log(`  🔧 Fixing placeholder corruption in: ${path.relative(__dirname, filePath)}`);
                    content = content.replace(/Ã¯Â¿Â½/g, '-');
                    changed = true;
                }

                if (changed || true) { // Always write to ensure UTF-8
                    fs.writeFileSync(filePath, content, 'utf8');
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
    }
}

console.log('\n✅ Automation Complete! All files normalized to UTF-8.');


