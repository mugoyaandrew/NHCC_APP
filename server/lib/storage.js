const fs = require('fs');
const path = require('path');

const UPLOAD_ROOT = path.join(__dirname, '..', 'uploads');

function ensureUploadRoot() {
  fs.mkdirSync(UPLOAD_ROOT, { recursive: true });
}

function publicUploadPath(filename) {
  return `/uploads/${filename}`;
}

module.exports = { UPLOAD_ROOT, ensureUploadRoot, publicUploadPath };
