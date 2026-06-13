const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function walkSync(dir, callback) {
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    var filepath = path.join(dir, file);
    const stats = fs.statSync(filepath);
    if (stats.isDirectory()) {
      walkSync(filepath, callback);
    } else if (stats.isFile() && (filepath.endsWith('.js') || filepath.endsWith('.jsx'))) {
      callback(filepath);
    }
  });
}

// 1. Refactor charAt(0) in specific components
const refactors = [
  {
    file: 'src/components/dashboard/ClientCard.jsx',
    replace: (content) => {
      content = "import ClientAvatar from '../ClientAvatar';\n" + content;
      return content.replace(
        /<div className="w-10 h-10 rounded-full bg-cyan-100 text-primary-cyan flex items-center justify-center font-bold text-lg">[\s\S]*?\{client\.name\?\.charAt\(0\)\.toUpperCase\(\)\}[\s\S]*?<\/div>/g,
        '<ClientAvatar client={client} size="md" />'
      );
    }
  },
  {
    file: 'src/pages/Tier2Dashboard.jsx',
    replace: (content) => {
      if(!content.includes('ClientAvatar')) content = "import ClientAvatar from '../components/ClientAvatar';\n" + content;
      return content.replace(
        /<div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center text-primary-cyan font-bold text-lg">[\s\S]*?\{client\.name\.charAt\(0\)\}[\s\S]*?<\/div>/g,
        '<ClientAvatar client={client} size="md" />'
      );
    }
  },
  {
    file: 'src/pages/Tier3Dashboard.jsx',
    replace: (content) => {
      if(!content.includes('ClientAvatar')) content = "import ClientAvatar from '../components/ClientAvatar';\n" + content;
      return content.replace(
        /<div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center text-primary-cyan font-bold text-lg shrink-0">[\s\S]*?\{activeClient\?\.name\?\.charAt\(0\) \|\| 'A'\}[\s\S]*?<\/div>/g,
        '<ClientAvatar client={activeClient} size="md" className="shrink-0" />'
      );
    }
  },
  {
    file: 'src/pages/social/Social.jsx',
    replace: (content) => {
      if(!content.includes('ClientAvatar')) content = "import ClientAvatar from '../../components/ClientAvatar';\n" + content;
      return content.replace(
        /<div className="w-6 h-6 rounded-full bg-cyan-100 text-primary-cyan flex items-center justify-center text-xs font-bold shrink-0">[\s\S]*?\{activeClient\?\.name\.charAt\(0\) \|\| 'L'\}[\s\S]*?<\/div>/g,
        '<ClientAvatar client={activeClient} size="sm" />'
      );
    }
  }
];

refactors.forEach(r => {
  const f = path.join(__dirname, r.file);
  if (fs.existsSync(f)) {
    let text = fs.readFileSync(f, 'utf8');
    fs.writeFileSync(f, r.replace(text));
    console.log('Refactored ' + r.file);
  } else {
    console.log('File not found: ' + r.file);
  }
});

// 2. Refactor Clients.jsx manually for Add/Edit logic
const clientsFile = path.join(srcDir, 'pages/clients/Clients.jsx');
let cText = fs.readFileSync(clientsFile, 'utf8');

if (!cText.includes('import ClientAvatar')) {
  cText = "import ClientAvatar from '../../components/ClientAvatar';\n" + cText;
}

// Replace charAt in table row
cText = cText.replace(
  /<span className="w-7 h-7 rounded-full bg-primary-cyan\/10 text-primary-cyan text-xs font-bold flex items-center justify-center">[\s\S]*?\{c\.name\.charAt\(0\)\}[\s\S]*?<\/span>/g,
  '<ClientAvatar client={c} size="sm" className="w-7 h-7 text-xs" />'
);

// We'll update the add/edit form states manually next.
fs.writeFileSync(clientsFile, cText);
console.log('Refactored Clients.jsx UI elements.');

