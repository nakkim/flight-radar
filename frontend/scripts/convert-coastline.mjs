/**
 * One-time conversion script: ne_10m_coastline.geojson -> ne_10m_coastline.fgb
 * Run with: npm run convert-coastline
 *
 * Uses ogr2ogr (part of GDAL) which creates the file with a spatial index.
 * The spatial index enables HTTP range requests so the browser fetches only
 * the portion of coastline visible in the current viewport.
 */
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { statSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const inputPath = join(__dirname, '../public/ne_10m_coastline.geojson');
const outputPath = join(__dirname, '../public/ne_10m_coastline.fgb');

console.log('Converting to FlatGeobuf with spatial index (requires ogr2ogr / GDAL)...');
execSync(`ogr2ogr -f FlatGeobuf "${outputPath}" "${inputPath}"`, { stdio: 'inherit' });

const size = statSync(outputPath).size;
console.log(`Written to ${outputPath} (${(size / 1024 / 1024).toFixed(2)} MB)`);
