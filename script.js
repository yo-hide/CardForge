document.addEventListener('DOMContentLoaded', () => {
    const imageInput = document.getElementById('image-input');
    const previewImage = document.getElementById('preview-image');
    const imagePlaceholder = document.getElementById('image-placeholder');
    const dropZone = document.getElementById('drop-zone');
    const safetyStatus = document.getElementById('safety-status');


    let safetyModel = null;

    // Load NSFW Model
    async function initSafetyModel() {
        try {
            safetyModel = await nsfwjs.load();
            console.log("Safety model loaded.");
        } catch (e) {
            console.error("Model load failed", e);
        }
    }
    initSafetyModel();

    const templateInputs = document.querySelectorAll('input[name="design-template"]');
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

    // Initial generation
    updateAICardData();

    // Handle Template Changes
    templateInputs.forEach(input => {
        input.addEventListener('change', (e) => {
            cardPreview.classList.forEach(className => {
                if (className.startsWith('theme-')) {
                    cardPreview.classList.remove(className);
                }
            });
            cardPreview.classList.add(`theme-${e.target.value}`);
        });
    });

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
            previewImage.src = dataUrl;
            previewImage.classList.remove('hidden');
            imagePlaceholder.classList.add('hidden');
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
        const attrElement = document.querySelector('input[name="card-attribute"]:checked');
        const attribute = attrElement ? attrElement.parentElement.querySelector('.attr-label').textContent : 'Neutral';
        const artElement = document.querySelector('input[name="card-artstyle"]:checked');
        const artStyleLabel = artElement ? artElement.parentElement.querySelector('.art-label').textContent : 'Standard';

        const prompt = `Fantasy TCG card illustration of ${name}, ${attribute} element, ${artStyleLabel} art style, high quality, highly detailed, masterpiece.`;

        aiStatus.classList.remove('hidden');
        aiGenBtn.disabled = true;

        try {
            const response = await fetch('/api/generate-image', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    prompt: prompt
                })
            });

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error.message);
            }

            const imageUrl = data.data[0].url;

            // Apply the generated image to preview
            previewImage.src = imageUrl;
            previewImage.classList.remove('hidden');
            imagePlaceholder.classList.add('hidden');

            // Success feedback
            console.log("Successfully generated image:", imageUrl);
        } catch (error) {
            console.error("AI Generation Error:", error);
            alert(`【生成エラー】\n${error.message}`);
        } finally {
            aiStatus.classList.add('hidden');
            aiGenBtn.disabled = false;
        }
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
            link.download = `cardforge_card.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        });
    });
});
