const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

function copyDirectory(from, to) {
  fs.cpSync(from, to, { recursive: true, force: true });
}

copyDirectory(
  path.join(
    root,
    'scaffold-cache',
    'node_modules',
    '@quick-start',
    'create-electron',
    'template',
    'base'
  ),
  root
);

copyDirectory(
  path.join(
    root,
    'scaffold-cache',
    'node_modules',
    '@quick-start',
    'create-electron',
    'template',
    'react-ts'
  ),
  root
);
