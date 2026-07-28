import { readdir, writeFile } from 'node:fs/promises';
import { extname, join, relative, resolve, sep } from 'node:path';

const root = resolve('assets/images/products');
const output = join(root, 'products-manifest.json');
const supportedExtensions = new Set(['.png', '.jpg', '.jpeg', '.webp', '.avif']);
const splitCategories = [
  'p1-5',
  'p2',
  'p2-5',
  'p3',
  'p4',
  'commercial-advertising-displays'
];
const singleCategories = [
  'p5',
  'p6',
  'product-samples',
  'restaurant-cafe-displays',
  'led-poster',
  'foldable-led-poster',
  'digital-kiosk',
  'outdoor-digital-signage',
  'ceiling-display',
  'restaurant-menu-display',
  'cube-display',
  'creative-led-display'
];

async function imagesIn(directory) {
  let entries = [];
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }

  const seen = new Set();
  return entries
    .filter(entry =>
      entry.isFile() &&
      !entry.name.startsWith('.') &&
      supportedExtensions.has(extname(entry.name).toLowerCase())
    )
    .sort((a, b) => a.name.localeCompare(b.name, undefined, {
      numeric: true,
      sensitivity: 'base'
    }))
    .map(entry => relative(root, join(directory, entry.name)).split(sep).join('/'))
    .filter(path => {
      const key = path.toLocaleLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

const products = {};
for (const id of splitCategories) {
  products[id] = {
    indoor: await imagesIn(join(root, id, 'indoor')),
    outdoor: await imagesIn(join(root, id, 'outdoor'))
  };
}
for (const id of singleCategories) {
  products[id] = { images: await imagesIn(join(root, id)) };
}

await writeFile(output, `${JSON.stringify({ products }, null, 2)}\n`, 'utf8');
console.log(`Generated ${relative(process.cwd(), output)}.`);
