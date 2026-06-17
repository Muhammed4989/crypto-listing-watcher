const fs = require('fs');
const path = require('path');
const root = 'C:\\Users\\moham\\ruladiet-site';

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory() && e.name !== 'node_modules' && e.name !== '.git' && e.name !== 'vimeo-downloads') walk(p);
    else if (e.isFile() && e.name.endsWith('.html') && !e.name.includes('lighthouse-report')) {
      let content = fs.readFileSync(p, 'utf-8');
      const old = '<a href="javascript:void(0)" class="btn btn-primary nav-cta">\u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644</a>';
      const next = '<button type="button" class="btn btn-primary nav-cta" onclick="alert(\'\u0642\u0631\u064A\u0628\u0627\u064B\')">\u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644</button>';
      if (content.includes(old)) {
        content = content.split(old).join(next);
        fs.writeFileSync(p, content, 'utf-8');
        console.log('Fixed: ' + path.relative(root, p));
      }
    }
  }
}
walk(root);
console.log('Done');
