const fs = require('fs');
const path = require('path');

const IMAGE_EXTS = new Set(['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'tiff', 'tif', 'ico', 'avif']);
const VIDEO_EXTS = new Set(['mp4', 'mov', 'avi', 'webm', 'm4v', 'mkv', 'flv', 'wmv', 'ogv']);

function scanDir(dir) {
  let items = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      items = items.concat(scanDir(fullPath));
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase().replace('.', '');
      if (IMAGE_EXTS.has(ext)) {
        items.push({ src: path.relative(projectRoot, path.join(dir, entry.name)), type: 'image', name: entry.name, folder: path.relative(projectRoot, dir) });
      } else if (VIDEO_EXTS.has(ext)) {
        items.push({ src: path.relative(projectRoot, path.join(dir, entry.name)), type: 'video', name: entry.name, folder: path.relative(projectRoot, dir) });
      }
    }
  }
  return items;
}

const projectRoot = __dirname;
let allItems = [];

// Scan root folder (skip index.html, items.json, generate.js)
const rootFiles = fs.readdirSync(projectRoot);
for (const f of rootFiles) {
  if (f === 'index.html' || f === 'items.json' || f === 'generate.js') continue;
  const fullPath = path.join(projectRoot, f);
  if (fs.statSync(fullPath).isDirectory()) {
    allItems = allItems.concat(scanDir(fullPath));
  } else {
    const ext = path.extname(f).toLowerCase().replace('.', '');
    if (IMAGE_EXTS.has(ext)) {
      allItems.push({ src: f, type: 'image', name: f, folder: '' });
    } else if (VIDEO_EXTS.has(ext)) {
      allItems.push({ src: f, type: 'video', name: f, folder: '' });
    }
  }
}

// Sort by folder, then name
allItems.sort((a, b) => a.folder.localeCompare(b.folder) || a.name.localeCompare(b.name));

fs.writeFileSync(path.join(projectRoot, 'items.json'), JSON.stringify(allItems, null, 2), 'utf8');

const images = allItems.filter(i => i.type === 'image').length;
const videos = allItems.filter(i => i.type === 'video').length;
const folders = new Set(allItems.map(i => i.folder)).size;
console.log(`Generated items.json: ${allItems.length} items (${images} photos, ${videos} videos) across ${folders} folders`);
