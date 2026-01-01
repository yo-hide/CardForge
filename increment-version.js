const fs = require('fs');
const path = require('path');

// 1. package.json のバージョンを更新
const pkgPath = path.join(__dirname, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

// バージョン形式を X.YYY に合わせる
let versionStr = pkg.version;

// NaN になっていた場合のリカバリ、およびパッチ抽出
let major = 1;
let patch = 0;

if (versionStr && !versionStr.includes('NaN')) {
    let parts = versionStr.split('.');
    major = parseInt(parts[0]) || 1;
    patch = parseInt(parts[1]) || 0;
} else {
    // 壊れていた場合は 1.001 から再開（現在の想定）
    patch = 1;
}

// インクリメント
patch += 1;
if (patch > 999) {
    major += 1;
    patch = 0;
}

// 0埋めして 1.002 形式にする
const formattedPatch = String(patch).padStart(3, '0');
const newVersion = `${major}.${formattedPatch}`;

pkg.version = newVersion;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
console.log(`Package version updated to: ${newVersion}`);

// 2. index.html のバージョン表記を更新
const htmlPath = path.join(__dirname, 'index.html');
let html = fs.readFileSync(htmlPath, 'utf8');

const versionRegex = /<p class="version">Ver\..*?<\/p>/;
const newVersionTag = `<p class="version">Ver.${newVersion}</p>`;

if (versionRegex.test(html)) {
    html = html.replace(versionRegex, newVersionTag);
    fs.writeFileSync(htmlPath, html);
    console.log(`index.html version updated to: Ver.${newVersion}`);
} else {
    console.error('Could not find version tag in index.html');
}
