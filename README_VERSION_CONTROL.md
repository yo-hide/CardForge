# CardForge バージョン管理システム（簡易版）

本プロジェクトで採用している、`package.json` と `index.html` のバージョンを同期させ、自動インクリメントを行う軽量な仕組みの解説です。他のプロジェクトで流用する際のガイドとしてご利用ください。

## 概要

独自の `increment-version.js` スクリプトを実行することで、以下の2点を自動化します。
1. `package.json` の `version` フィールドを更新（パッチ番号を3桁の連番、999で繰り上がり）。
2. `index.html` 内のバージョン表示テキスト（例：`Ver.1.001`）を同期して書き換え。

---

## 導入方法

### 1. バージョン更新スクリプトの作成
プロジェクトのルートディレクトリに `increment-version.js` を作成します。

```javascript
// increment-version.js (抜粋)
const fs = require('fs');
const path = require('path');

const packageJsonPath = path.join(__dirname, 'package.json');
const htmlPath = path.join(__dirname, 'index.html');

// package.jsonの読み込み
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
let version = packageJson.version; // 例: "1.005"

// バージョン更新ロジック (000〜999の3桁パッチ管理)
let [major, patch] = version.split('.').map(Number);
patch++;
if (patch > 999) {
    major++;
    patch = 0;
}
const newVersion = `${major}.${patch.toString().padStart(3, '0')}`;

// package.json の更新
packageJson.version = newVersion;
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

// index.html の更新
let htmlContent = fs.readFileSync(htmlPath, 'utf8');
const versionRegex = /Ver\.\d+\.\d{3}/g;
htmlContent = htmlContent.replace(versionRegex, `Ver.${newVersion}`);
fs.writeFileSync(htmlPath, htmlContent);

console.log(`Updated to: ${newVersion}`);
```

### 2. package.json へのコマンド登録
`scripts` セクションにコマンドを追加します。

```json
{
  "scripts": {
    "version-up": "node increment-version.js"
  }
}
```

### 3. index.html への記述
HTML内のバージョンを表示したい箇所に、正規表現で置換可能な形式で記述しておきます。

```html
<p class="version">Ver.1.000</p>
```

---

## 運用ワークフロー

1. **開発・修正を行う**
2. **コマンドを実行してバージョンを上げる**
   ```bash
   npm run version-up
   ```
3. **ギットへのコミット（推奨）**
   コミットメッセージの冒頭にバージョン番号を付与します。
   例: `git commit -m "[v1.006] ○○の修正"`

## この仕組みのメリット
- **ビルドツール不要**: Node.js標準機能だけで動作するため、環境構築が容易です。
- **視認性**: `index.html` に直接書き込まれるため、デプロイ後のサイトから現在どのバージョンが動いているかが一目でわかります。
- **連動性**: アプリのバージョン管理（package.json）と表示上のバージョンが乖離するミスを防げます。
