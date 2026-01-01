document.addEventListener('DOMContentLoaded', () => {
    const imageInput = document.getElementById('image-input');
    const previewImage = document.getElementById('preview-image');
    const imagePlaceholder = document.getElementById('image-placeholder');
    const dropZone = document.getElementById('drop-zone');
    const safetyStatus = document.getElementById('safety-status');
    const cardNameInput = document.getElementById('card-name-input');
    const charDescInput = document.getElementById('char-desc-input');


    let safetyModel = null;

    // Load NSFW Model
    async function initSafetyModel() {
        try {
            // Use a stable CDN path for the model files
            safetyModel = await nsfwjs.load('./lib/models/');
            console.log("Safety model loaded.");
        } catch (e) {
            console.error("Model load failed", e);
        }
    }
    initSafetyModel();

    // const templateInputs = document.querySelectorAll('input[name="design-template"]');
    const rarityInputs = document.querySelectorAll('input[name="card-rarity"]');
    const attributeInputs = document.querySelectorAll('input[name="card-attribute"]');
    const artstyleInputs = document.querySelectorAll('input[name="card-artstyle"]');

    // Preview elements
    const cardPreview = document.getElementById('card-preview');
    const previewTitle = document.getElementById('preview-title');
    const previewRarity = document.getElementById('preview-rarity');
    const previewAttribute = document.getElementById('preview-attribute');
    const previewDesc = document.getElementById('preview-description');
    const previewAtk = document.getElementById('preview-atk');
    const previewDef = document.getElementById('preview-def');

    // Initialize theme
    cardPreview.classList.add('theme-yugioh');
    cardPreview.classList.add('rarity-C');
    cardPreview.classList.add('attr-fire');
    cardPreview.classList.add('artstyle-photo');

    // Remove initial generation to keep preview hidden until needed
    // updateAICardData();

    // Handle Card Name Changes
    cardNameInput.addEventListener('input', (e) => {
        previewTitle.textContent = e.target.value || "Fabled Creature";
        updateAICardData();
        exitFullAIMode();
    });

    charDescInput.addEventListener('input', () => {
        exitFullAIMode();
    });

    // Handle Template Changes (Removed)

    // Handle Rarity Changes
    rarityInputs.forEach(input => {
        input.addEventListener('change', (e) => {
            const val = e.target.value;
            previewRarity.textContent = val;
            cardPreview.classList.forEach(className => {
                if (className.startsWith('rarity-')) {
                    cardPreview.classList.remove(className);
                }
            });
            cardPreview.classList.add(`rarity-${val}`);
            updateAICardData();
        });
    });

    // Handle Attribute Changes
    attributeInputs.forEach(input => {
        input.addEventListener('change', (e) => {
            const val = e.target.value;
            const label = e.target.parentElement.querySelector('.attr-label').textContent;
            previewAttribute.textContent = label;
            cardPreview.classList.forEach(className => {
                if (className.startsWith('attr-')) {
                    cardPreview.classList.remove(className);
                }
            });
            cardPreview.classList.add(`attr-${val}`);
            updateAICardData();
        });
    });

    // Handle Art Style Changes
    artstyleInputs.forEach(input => {
        input.addEventListener('change', (e) => {
            const val = e.target.value;
            cardPreview.classList.forEach(className => {
                if (className.startsWith('artstyle-')) {
                    cardPreview.classList.remove(className);
                }
            });
            cardPreview.classList.add(`artstyle-${val}`);
            updateAICardData();
        });
    });

    // Handle image upload
    imageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) handleFile(file);
    });

    // Drag and Drop
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            handleFile(file);
        }
    });

    async function handleFile(file) {
        const reader = new FileReader();
        reader.onload = async (e) => {
            const dataUrl = e.target.result;
            if (safetyModel) {
                safetyStatus.classList.remove('hidden');
                const img = new Image();
                img.src = dataUrl;
                await new Promise(resolve => img.onload = resolve);
                const predictions = await safetyModel.classify(img);
                safetyStatus.classList.add('hidden');
                const nsfwScores = predictions.filter(p => ['Porn', 'Hentai', 'Sexy'].includes(p.className));
                if (nsfwScores.some(p => p.probability > 0.5)) {
                    alert('⚠️ 不適切なコンテンツが検出されました。');
                    imageInput.value = '';
                    previewImage.src = '';
                    previewImage.classList.add('hidden');
                    imagePlaceholder.classList.remove('hidden');
                    return;
                }
            }
            // previewImage.src = dataUrl;
            // previewImage.classList.remove('hidden');
            // imagePlaceholder.classList.add('hidden');

            // Downsize image for API submission (to avoid 413 error)
            const img = new Image();
            img.src = dataUrl;
            await new Promise(resolve => img.onload = resolve);

            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 800; // Limit size
            const scale = MAX_WIDTH / img.width;
            canvas.width = MAX_WIDTH;
            canvas.height = img.height * scale;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            // Keep the processed image for API reference (hidden until AI generation)
            previewImage.src = canvas.toDataURL('image/jpeg', 0.8);
            previewImage.classList.add('hidden'); // Ensure it stays hidden initially
            imagePlaceholder.classList.remove('hidden');

            console.log("Base image ready for AI processing.");
        };
        reader.readAsDataURL(file);
    }

    // AI Data Generation (Name & Description & Stats)
    function updateAICardData() {
        const attrElement = document.querySelector('input[name="card-attribute"]:checked');
        const artElement = document.querySelector('input[name="card-artstyle"]:checked');
        const rarityElement = document.querySelector('input[name="card-rarity"]:checked');

        const attrVal = attrElement ? attrElement.value : 'fire';
        const artVal = artElement ? artElement.value : 'photo';
        const rarity = rarityElement ? rarityElement.value : 'C';
        const attributeLabel = attrElement ? attrElement.parentElement.querySelector('.attr-label').textContent : 'Neutral';

        const nameMap = {
            fire: ["Phoenix", "Dragon", "Efreet", "Blaze Knight", "Volcanic Golem"],
            water: ["Leviathan", "Kraken", "Siren", "Tidal Serpent", "Aqua Spirit"],
            thunder: ["Raiju", "Cloud Gigantic", "Volt Falcon", "Storm Weaver", "Spark Sprite"],
            earth: ["Behemoth", "Terra Titan", "Gem Dragon", "Iron Boar", "Stone Guard"],
            nature: ["Dryad", "Forest King", "Ancient Treant", "Ivy Stalker", "Leaf Fairy"],
            snow: ["Yeti", "Ice Queen", "Frost Wyrm", "Snow Wolf", "Crystal Golem"],
            flower: ["Flora Muse", "Rose Valkyrie", "Petal Dancer", "Cherry Blossom Spirit", "Thorn Archer"],
            dark: ["Vampire Lord", "Shadow Demon", "Reaper", "Nightmare Stallion", "Void Terror"],
            light: ["Archangel", "Holy Knight", "Solar Griffin", "Saintess", "Divine Orb"]
        };

        const artStyles = ["photo", "classic-anime", "modern-anime", "sd", "manga", "watercolor", "pop", "gothic"];
        const nameIdx = Math.max(0, artStyles.indexOf(artVal)) % nameMap[attrVal].length;
        const generatedName = nameMap[attrVal][nameIdx];
        previewTitle.textContent = generatedName;

        const descTemplates = [
            `A legendary manifestation of ${attributeLabel}, known throughout history as the "${generatedName}".`,
            `The power of ${attributeLabel} flows through ${generatedName}, granting it unmatched strength.`,
            `Wherever the ${generatedName} appears, the air thickens with the pure essence of ${attributeLabel}.`,
            `Forged in the heart of ${attributeLabel}, this ${generatedName} stands as a testament to power.`,
            `An ancient guardian bound to local ${attributeLabel} ley lines, ${generatedName} awaits a new master.`
        ];
        const descIdx = Math.abs(generatedName.length) % descTemplates.length;
        previewDesc.textContent = descTemplates[descIdx];

        const statsMap = {
            'C': { base: 200, range: 800 },
            'U': { base: 1000, range: 1000 },
            'R': { base: 2000, range: 1000 },
            'SR': { base: 3000, range: 1000 },
            'RR': { base: 4000, range: 1500 },
            'UR': { base: 6000, range: 3000 }
        };
        const config = statsMap[rarity];
        const seed = generatedName.length + generatedName.charCodeAt(0);
        previewAtk.textContent = Math.round((config.base + (seed * 13) % config.range) / 100) * 100;
        previewDef.textContent = Math.round((config.base + (seed * 17) % config.range) / 100) * 100;
    }

    // AI Image Generation Stub
    const aiGenBtn = document.getElementById('generate-ai-img');
    const aiStatus = document.getElementById('ai-status');

    aiGenBtn.addEventListener('click', async () => {
        const name = previewTitle.textContent;
        const rarity = previewRarity.textContent;
        const atk = previewAtk.textContent;
        const def = previewDef.textContent;
        const desc = previewDesc.textContent;
        const charSpecifics = charDescInput.value;

        const attrElement = document.querySelector('input[name="card-attribute"]:checked');
        const attribute = attrElement ? attrElement.parentElement.querySelector('.attr-label').textContent : 'Neutral';
        const artElement = document.querySelector('input[name="card-artstyle"]:checked');
        const artStyleLabel = artElement ? artElement.parentElement.querySelector('.art-label').textContent : 'Standard';

        const inputName = cardNameInput.value.trim();
        const cardNameInstruction = inputName
            ? `The card name is "${inputName}". Prepend a cool, legendary title (異名) to this name in Japanese.`
            : `Create a creative, legendary card name including a cool title (異名) in Japanese based on the visual/attributes.`;

        // Construct a structured prompt for the ENTIRE card in English
        const prompt = `Role: You are a professional trading card designer.
Objective: Create a single, high-impact trading card illustration that maximizes the characteristics of the character.

IMPORTANT: ALL text displayed on the card (Card Name, Title, Ability Descriptions, etc.) MUST be written in JAPANESE only.

Card Details:
- Rarity: ${rarity}
- Attribute: ${attribute} (Represent this visually with a graphic symbol/element)
- Card Name Instruction: ${cardNameInstruction}
- Aspect Ratio: 1:1.4 (Vertical layout)
- Status Stats: Include combat statistics determined by you (ATK, HP, and COST)
- Background: A polished background reflecting the ${attribute} attribute and ${rarity} rarity.

Layout Design:
- Top Section: Display the ${attribute} attribute symbol, the Full Japanese Card Name (Title + Name), and the rarity marker.
- Center Section: Feature a high-quality ${artStyleLabel} illustration.
- Bottom Section: A stylized text box containing ability descriptions in JAPANESE and the stats (ATK, HP, COST).

Character specific details: ${charSpecifics || "A powerful fantasy creature"}

Ensure the text is legible, the layout is balanced, and it looks like a premium physical TCG card with high-quality Japanese typography.`;

        const currentImage = previewImage.src.startsWith('data:') ? previewImage.src : null;

        aiStatus.classList.remove('hidden');
        aiGenBtn.disabled = true;

        try {
            const response = await fetch('/api/generate-image', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    prompt: prompt,
                    image: currentImage
                })
            });

            const data = await response.json();

            if (data.error) {
                const errorMessage = typeof data.error === 'string' ? data.error : (data.error.message || JSON.stringify(data.error));
                throw new Error(errorMessage);
            }

            const imageUrl = data.data[0].url;

            // Switch to Full AI Card mode
            cardPreview.classList.add('full-ai-card');

            // Apply the generated image to preview
            previewImage.src = imageUrl;
            previewImage.classList.remove('hidden');
            imagePlaceholder.classList.add('hidden');

            // Show the preview section
            document.getElementById('step-4').classList.remove('hidden');

            console.log("Successfully generated FULL card image:", imageUrl);
        } catch (error) {
            console.error("AI Generation Error:", error);
            alert(`【生成エラー】\n${error.message}`);
        } finally {
            aiStatus.classList.add('hidden');
            aiGenBtn.disabled = false;
        }
    });

    // Helper to exit full AI mode if manual changes occur
    function exitFullAIMode() {
        if (cardPreview.classList.contains('full-ai-card')) {
            cardPreview.classList.remove('full-ai-card');
            console.log("Exited Full AI Mode due to manual change.");
        }
    }

    [imageInput, dropZone, cardNameInput, charDescInput, ...rarityInputs, ...attributeInputs, ...artstyleInputs].forEach(el => {
        el.addEventListener('change', exitFullAIMode);
        el.addEventListener('input', exitFullAIMode);
        el.addEventListener('drop', exitFullAIMode);
    });


    // Download functionality
    const downloadBtn = document.getElementById('download-btn');
    downloadBtn.addEventListener('click', () => {
        const card = document.getElementById('card-preview');
        html2canvas(card, {
            backgroundColor: null,
            scale: 2,
            useCORS: true,
            logging: false
        }).then(canvas => {
            const link = document.createElement('a');
            link.download = `cardforge_${previewTitle.textContent}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        });
    });

    // Share functionality
    const shareBtn = document.getElementById('share-btn');
    shareBtn.addEventListener('click', async () => {
        const card = document.getElementById('card-preview');
        const cardName = previewTitle.textContent;
        const rarity = previewRarity.textContent;
        const attribute = previewAttribute.textContent;

        const shareText = `「${cardName}」を召喚した！\nレアリティ: ${rarity} / 属性: ${attribute}\nあなたも伝説の一枚を創り出そう！\n#CardForge #AIトレカ`;
        const shareUrl = window.location.href;

        try {
            const canvas = await html2canvas(card, {
                backgroundColor: null,
                scale: 2,
                useCORS: true,
                logging: false
            });

            // Convert canvas to blob
            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
            const file = new File([blob], `cardforge_${cardName}.png`, { type: 'image/png' });

            // Check if Web Share API supports file sharing
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: 'CardForge',
                    text: shareText
                });
                console.log('Successfully shared via Web Share API');
            } else {
                // Fallback for PC or browsers that don't support file sharing
                const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText + "\n" + shareUrl)}`;

                // Copy image to clipboard as another fallback attempt
                try {
                    const item = new ClipboardItem({ "image/png": blob });
                    await navigator.clipboard.write([item]);
                    alert('カード画像をクリップボードにコピーしました。\nXの投稿画面で貼り付け(Ctrl+V)て、ダウンロードした画像を添付して投稿してください！');
                } catch (e) {
                    alert('画像を保存して、Xの投稿に添付してシェアしてください！');
                }

                // Open X intent
                window.open(tweetUrl, '_blank');
            }
        } catch (error) {
            console.error('Error sharing:', error);
            alert('共有中にエラーが発生しました。');
        }
    });
});

