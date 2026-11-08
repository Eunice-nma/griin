import { getIconData, iconToSVG } from '@iconify/utils';
import { readFileSync, writeFileSync } from 'fs';
const names = process.argv.slice(2);
const out = {};
for (const full of names) {
  const [set, name] = full.split(':');
  const json = JSON.parse(readFileSync(`node_modules/@iconify-json/${set}/icons.json`, 'utf8'));
  const data = getIconData(json, name);
  if (!data) { console.error('MISSING', full); continue; }
  const r = iconToSVG(data, { height: 'auto' });
  out[full] = { vb: r.attributes.viewBox, body: r.body };
}
writeFileSync('src/iconData.js', 'export default ' + JSON.stringify(out, null, 0) + ';\n');
console.log(Object.keys(out).length, 'icons');
