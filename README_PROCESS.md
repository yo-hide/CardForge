# CardForge AI画像生成プロセス解説 (Google AI版)

本書では、CardForgeにおいてアップロードされた画像から「完成されたトレーディングカード」が生成されるまでの技術的なプロセスを解説します。現在はGoogleのAIスタックを使用するように構成されています。

## 1. 使用している生成AI
本システムでは、Google独自の高度なAIモデルを組み合わせて使用しています。

*   **解析（Vision）:** `Gemini 1.5 Flash`
    *   アップロードされた画像を多角的に解析し、その構成、色彩、被写体の特徴、雰囲気を詳細なプロンプト用テキストに変換します。高速かつ正確な画像理解が特徴です。
*   **生成（Image Generation）:** `Imagen 4.0` (または 3.0)
    *   Geminiが生成した詳細な指示と、ユーザーが指定したカード設定（名前、属性、ステータス、配置ルール等）を統合し、1枚の完成された縦長カード画像を書き出します。

---

## 2. 画像生成のステップ

### ステップ1：画像のリサイズと最適化（フロントエンド）
ブラウザ側で画像を軽量なJPEG形式に変換し、APIのリクエスト制限内に収まるよう最適化します。

### ステップ2：視覚解析エンジン（Gemini 1.5 Flash）
サーバーに届いた画像データをGeminiがスキャンします。
「どのようなクリーチャーか？」「背景のテクスチャは？」「指定された属性とどう調和させるか？」を言語化し、画像生成用の高度な命令セットを作成します。

### ステップ3：構造化プロンプトの送信
解析結果をベースに、「プロのカードデザイナー」としての役割を与えた最終的な英語プロンプトを構築します。

### ステップ4：カード全体の一括生成（Imagen 4.0）
Google Imagen APIを呼び出し、アスペクト比 3:4 の縦長レイアウトでカードを生成します。AIは指示に従い、フレーム、タイトル、属性マーク、イラスト、ステータスボックスを一枚の絵の中に美しくレイアウトします。

---

## 3. 実際にAIに渡されるプロンプトのサンプル

以下は、システム内部で自動生成されGoogle AIに渡されるプロンプトの例です。

### Geminiによる画像解析後の最終プロンプト例
```text
Role: You are a professional trading card designer.
Objective: Create a single, high-impact trading card illustration that maximizes the characteristics of the character.

Card Details:
- Rarity: UR
- Attribute: Thunder (Represent this visually with a graphic symbol/element)
- Card Name: Raiden the Storm-Caller
- Aspect Ratio: 3:4 (Vertical layout)
- Status Stats: Include combat statistics determined by you (ATK, HP, and COST)
- Background: A polished background reflecting the Thunder attribute and UR rarity.

Layout Design:
- Top Section: Display the Thunder attribute symbol, the card name, and the rarity marker.
- Center Section: Feature a high-quality illustration of a character wreathed in electric arcs, holding a glowing staff.
- Bottom Section: A stylized text box containing ability descriptions and the stats (ATK, HP, COST).

Character specific details: (Based on uploaded image) A blue-haired mage floating in a storm-racked sky, eyes glowing with white lightning.

Ensure the text is legible, the layout is balanced, and it looks like a premium physical TCG card.
```

### プロンプトの内容解説（日本語訳）
*   **デザイナーの役割:** AIに専門家としての視点を持たせ、単なる「絵」ではなく「製品としてのカード」を意識させます。
*   **視覚的シンボル:** 属性（雷など）を言葉だけでなく、必ず図記号として描くよう指示しています。
*   **統合レイアウト:** 名前やステータス（ATK, HP, COST）をカード内の決まった位置（上段・下段）に配置するようルール化しています。

---
このプロセスにより、Googleの強力なAI基盤を活用した、世界に一枚だけのオリジナルの完成カードが生成されます。
