# CardForge AI画像生成プロセス解説 (ハイブリッド版)

本書では、CardForgeにおいてアップロードされた画像から「完成されたトレーディングカード」が生成されるまでの技術的なプロセスを解説します。現在は、解析にOpenAI、生成にGoogleという「ハイブリッド構成」を採用しています。

## 1. 使用している生成AI
システムの各フェーズにおいて、それぞれの強みを持つAIモデルを組み合わせています。

*   **解析（Vision）:** `OpenAI GPT-4o`
    *   アップロードされた画像を極めて詳細に分析し、その構図、色彩、被写体の特徴を、Imagen用の高品質なプロンプト（指示文）に変換します。
*   **生成（Image Generation）:** `Google Imagen 4.0`
    *   GPT-4oが作成した詳細な指示に基づき、1枚の完成された縦長カード画像をデザイン・出力します。Imagen 4.0の高品質なレイアウト能力を活用しています。

---

## 2. 画像生成のステップ

### ステップ1：画像のリサイズと最適化（フロントエンド）
ブラウザ側で画像を軽量なJPEG形式に変換し、各APIの処理に適したサイズに最適化します。

### ステップ2：高度な視覚解析（GPT-4o）
サーバーに届いた画像データを、まずOpenAIのGPT-4oがスキャンします。
「被写体のポーズ」「背景の雰囲気」「色のコントラスト」などの視覚情報を言語化し、Imagenが最高のパフォーマンスを発揮できるような指示書を作成します。

### ステップ3：構造化プロンプトの送信
解析結果をベースに、「プロのカードデザイナー」としての役割を与えた最終的な英語プロンプトを構築します。この際、**「カード内の文字はすべて日本語にすること」**および**「名前にカッコイイ異名を付けること」**というルールが適用されます。

### ステップ4：カード全体の一括生成（Imagen 4.0）
構築されたプロンプトをGoogle Imagen APIに渡し、アスペクト比 3:4 の縦長レイアウトでカードを生成します。AIは指示に従い、日本語でのタイトリング、属性マーク、イラスト、ステータスボックスを一括で描画します。

---

## 3. 実際にAIに渡されるプロンプトのサンプル

以下は、GPT-4oによって解析され、最終的にGoogle Imagenに渡されるプロンプトのイメージです。

### GPT-4o経由での最終プロンプト例
```text
Role: You are a professional trading card designer.
Objective: Create a single, high-impact trading card illustration that maximizes the characteristics of the character.

IMPORTANT: ALL text displayed on the card (Card Name, Title, Ability Descriptions, etc.) MUST be written in JAPANESE only.

Card Details:
- Rarity: SR
- Attribute: Water (Represent this visually with a graphic symbol/element)
- Card Name Instruction: The card name is "アクア・ガーディアン". Prepend a cool, legendary title (異名) to this name in Japanese.
- Aspect Ratio: 3:4 (Vertical layout)
- Status Stats: Include combat statistics determined by you (ATK, HP, and COST)
- Background: A polished background reflecting the Water attribute and SR rarity.

Layout Design:
- Top Section: Display the Water attribute symbol, the Full Japanese Card Name (Title + Name), and the rarity marker.
- Center Section: Feature a high-quality illustration.
- Bottom Section: A stylized text box containing ability descriptions in JAPANESE and the stats (ATK, HP, COST).

Character specific details: (GPT-4oによる画像解析結果) A warrior clad in translucent azure armor, standing atop a whirlpool under a starlit ocean sky.

Ensure the text is legible, the layout is balanced, and it looks like a premium physical TCG card with high-quality Japanese typography.
```

---
この「OpenAIの解析力 × Googleの描画力」のハイブリッド構成により、安定性と品質を両立したカード生成を実現しています。
