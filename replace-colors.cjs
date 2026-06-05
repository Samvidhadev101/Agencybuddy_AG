const fs = require('fs');
const path = require('path');

const replacements = [
  { from: /bg-white/g, to: 'bg-panel-white' },
  { from: /bg-\[#F3F4F6\]/g, to: 'bg-page-bg' },
  { from: /text-\[#111827\]/g, to: 'text-text-primary' },
  { from: /text-\[#6B7280\]/g, to: 'text-text-secondary' },
  { from: /text-\[#9CA3AF\]/g, to: 'text-text-muted' },
  { from: /border-\[#E5E7EB\]/g, to: 'border-border-light' },
  { from: /border-\[#D1D5DB\]/g, to: 'border-border-medium' },
  { from: /bg-\[#0D1117\]/g, to: 'bg-dark-panel' },
  { from: /bg-\[#161B22\]/g, to: 'bg-panel-white' }
];

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;
      for (const { from, to } of replacements) {
        if (from.test(content)) {
          content = content.replace(from, to);
          changed = true;
        }
      }
      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDir(path.join(__dirname, 'src'));
console.log('Done replacing colors.');
