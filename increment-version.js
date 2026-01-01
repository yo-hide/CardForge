const fs = require('fs');
const path = require('path');

// 1. package.json のバージョンを更新
const pkgPath = path.join(__dirname, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const versionParts = pkg.version.split('.').map(Number);

// 末尾のパッチバージョンをインクリメント
versionParts[2] += 1;
const newVersion = versionParts.join('.');
pkg.version = newVersion;

fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
console.log(`Package version updated to: ${newVersion}`);

// 2. index.html のバージョン表記を更新
const htmlPath = path.join(__dirname, 'index.html');
let html = fs.readFileSync(htmlPath, 'utf8');

// <p class="version">Ver.x.x.x</p> の部分を置換
const versionRegex = /<p class="version">Ver\..*?<\/p>/;
const newVersionTag = `<p class="version">Ver.${newVersion}</p>`;

if (versionRegex.test(html)) {
    html = html.replace(versionRegex, newVersionTag);
    fs.writeFileSync(htmlPath, html);
    console.log(`index.html version updated to: Ver.${newVersion}`);
} else {
    console.error('Could not find version tag in index.html');
}
