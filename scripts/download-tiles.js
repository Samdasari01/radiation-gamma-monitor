const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const CONFIG = {
  // India bounding box [south_lat, west_lon, north_lat, east_lon]
  bounds: [6.0, 68.0, 37.0, 98.0],

  // Zoom levels - adjust based on your needs:
  //   5-6:  Country overview        (~50 tiles)
  //   7-8:  State/region level      (~600 tiles)
  //   9-10: City/district level     (~4,300 tiles)
  //   11-12: Street/local level     (~38,000 tiles) - skip unless needed
  zoomMin: 5,
  zoomMax: 9,

  tileServer: 'https://tile.openstreetmap.org',
  outputDir: path.join(__dirname, '..', 'src', 'assets', 'offline-tiles'),
  concurrent: 6,        // parallel downloads
  delayMs: 50           // delay between batches (be nice to OSM)
};

const args = process.argv.slice(2);
function getArg(name, defaultVal) {
  const idx = args.indexOf(name);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : defaultVal;
}

CONFIG.zoomMin = parseInt(getArg('--min-zoom', CONFIG.zoomMin));
CONFIG.zoomMax = parseInt(getArg('--max-zoom', CONFIG.zoomMax));

const boundsArg = getArg('--bounds', null);
if (boundsArg) {
  const [s, w, n, e] = boundsArg.split(',').map(Number);
  CONFIG.bounds = [s, w, n, e];
}

function long2tile(lon, z) {
  return Math.floor(((lon + 180) / 360) * Math.pow(2, z));
}

function lat2tile(lat, z) {
  return Math.floor(
    ((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2) *
      Math.pow(2, z)
  );
}

function downloadTile(z, x, y) {
  return new Promise((resolve, reject) => {
    const url = `${CONFIG.tileServer}/${z}/${x}/${y}.png`;
    const tileDir = path.join(CONFIG.outputDir, String(z), String(x));

    if (!fs.existsSync(tileDir)) {
      fs.mkdirSync(tileDir, { recursive: true });
    }

    const filePath = path.join(tileDir, `${y}.png`);
    if (fs.existsSync(filePath)) {
      resolve('skip');
      return;
    }

    const protocol = url.startsWith('https') ? https : http;
    protocol.get(url, { headers: { 'User-Agent': 'RadiationMonitor/1.0' } }, (res) => {
      if (res.statusCode === 200) {
        const fileStream = fs.createWriteStream(filePath);
        res.pipe(fileStream);
        fileStream.on('finish', () => {
          fileStream.close();
          resolve('ok');
        });
      } else {
        reject(new Error(`HTTP ${res.statusCode}`));
      }
    }).on('error', (err) => reject(err));
  });
}

function getTileList() {
  const tiles = [];
  for (let z = CONFIG.zoomMin; z <= CONFIG.zoomMax; z++) {
    const xMin = long2tile(CONFIG.bounds[1], z);
    const xMax = long2tile(CONFIG.bounds[3], z);
    const yMin = lat2tile(CONFIG.bounds[2], z);
    const yMax = lat2tile(CONFIG.bounds[0], z);

    const count = (xMax - xMin + 1) * (yMax - yMin + 1);
    console.log(`  Zoom ${z}: ${xMax - xMin + 1} x ${yMax - yMin + 1} = ${count} tiles`);

    for (let x = xMin; x <= xMax; x++) {
      for (let y = yMin; y <= yMax; y++) {
        tiles.push({ z, x, y });
      }
    }
  }
  return tiles;
}

async function downloadAll() {
  console.log('='.repeat(50));
  console.log('Offline Map Tile Downloader');
  console.log('='.repeat(50));
  console.log(`Region: India (${CONFIG.bounds.join(', ')})`);
  console.log(`Zoom: ${CONFIG.zoomMin} - ${CONFIG.zoomMax}`);
  console.log(`Output: ${CONFIG.outputDir}`);
  console.log('');

  console.log('Calculating tiles...');
  const tiles = getTileList();
  console.log(`\nTotal tiles: ${tiles.length}`);

  const estMB = (tiles.length * 15 / 1024).toFixed(1);
  console.log(`Estimated size: ~${estMB} MB`);
  console.log('');

  if (tiles.length === 0) {
    console.log('No tiles to download.');
    return;
  }

  let downloaded = 0;
  let skipped = 0;
  let failed = 0;
  const startTime = Date.now();

  // Process in batches
  for (let i = 0; i < tiles.length; i += CONFIG.concurrent) {
    const batch = tiles.slice(i, i + CONFIG.concurrent);
    const results = await Promise.allSettled(
      batch.map(t => downloadTile(t.z, t.x, t.y))
    );

    results.forEach(r => {
      if (r.status === 'fulfilled') {
        if (r.value === 'skip') skipped++;
        else downloaded++;
      } else {
        failed++;
      }
    });

    const done = i + batch.length;
    const pct = ((done / tiles.length) * 100).toFixed(1);
    const elapsed = (Date.now() - startTime) / 1000;
    const rate = done / elapsed;
    const remaining = (tiles.length - done) / rate;

    process.stdout.write(
      `\r  [${pct}%] ${done}/${tiles.length} | ` +
      `+${downloaded} new, ${skipped} cached, ${failed} failed | ` +
      `${rate.toFixed(1)} tiles/s | ~${Math.ceil(remaining)}s left`
    );

    if (CONFIG.delayMs > 0) {
      await new Promise(r => setTimeout(r, CONFIG.delayMs));
    }
  }

  console.log('\n');
  console.log('='.repeat(50));
  console.log(`Done!`);
  console.log(`  New tiles:   ${downloaded}`);
  console.log(`  Cached:      ${skipped}`);
  console.log(`  Failed:      ${failed}`);
  console.log(`  Time:        ${((Date.now() - startTime) / 1000).toFixed(1)}s`);
  console.log('='.repeat(50));
}

downloadAll().catch(err => {
  console.error('\nFatal error:', err.message);
  process.exit(1);
});
