import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const PUBLIC_DIR = path.resolve('public');
const files = fs.readdirSync(PUBLIC_DIR);

const processImages = async () => {
    console.log('Starting image compression...');
    
    for (const file of files) {
        if (!file.toLowerCase().endsWith('.jpeg') && !file.toLowerCase().endsWith('.jpg')) continue;
        
        const inputPath = path.join(PUBLIC_DIR, file);
        // Create safe filename: lowercase, spaces to hyphens, remove special chars
        const safeName = file.replace(/\.(jpeg|jpg)$/i, '')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
        
        const outputPath = path.join(PUBLIC_DIR, `${safeName}.webp`);
        
        try {
            await sharp(inputPath)
                .resize(600, 600, { fit: 'cover', position: 'center' })
                .webp({ quality: 80 })
                .toFile(outputPath);
                
            console.log(`Converted: ${file} -> ${safeName}.webp`);
            
            // Delete original
            fs.unlinkSync(inputPath);
        } catch (err) {
            console.error(`Error processing ${file}:`, err);
        }
    }
    
    console.log('Done!');
};

processImages();
