const fs = require('fs');
const path = require('path');

const replacements = {
    'âœ…': '✅',
    'â Œ': '❌',
    'â ³': '⏳',
    'â˜…': '★',
    'âœ✨': '✨',
    'âœ¨': '✨',
    'âœ“': '✓',
    'âœ—': '✗',
    'â†’': '→',
    'â€¢': '•',
    'âš ï¸ ': '⚠️',
    'â—¦': '◦',
    'â€”': '—',
    'Ã°Å¸â€ºÂ¡Ã¯Â¸Â ': '🛡️',
    'Ã°Å¸Â§Â¬': '🧪',
    'Ã¯Â¿Â½': ''
};

function fixFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    // Special case for CustomerMenu.jsx Sparkles icon
    if (filePath.endsWith('CustomerMenu.jsx') && content.includes('âœ¨</span>')) {
        content = content.replace(/>âœ¨<\/span>/g, '><Sparkles size={20} /></span>');
        changed = true;
    }

    for (const [mangled, correct] of Object.entries(replacements)) {
        if (content.includes(mangled)) {
            content = content.replace(new RegExp(mangled, 'g'), correct);
            changed = true;
        }
    }

    if (changed) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Fixed: ${filePath}`);
    }
}

function walk(dir) {
    fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (!fullPath.includes('node_modules') && !fullPath.includes('.git')) {
                walk(fullPath);
            }
        } else if (fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
            fixFile(fullPath);
        }
    });
}

walk('./frontend/src');
walk('./backend');
console.log('All remaining mangled characters fixed!');
