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
            // Remove all possible theme classes
            cardPreview.classList.forEach(className => {
                if (className.startsWith('theme-')) {
                    cardPreview.classList.remove(className);
                }
            });
            // Add new theme class
            cardPreview.classList.add(`theme-${e.target.value}`);
        });
    });

    // Handle Rarity Changes
    rarityInputs.forEach(input => {
        input.addEventListener('change', (e) => {
            const val = e.target.value;
            previewRarity.textContent = val;

            // Remove old rarity class
            cardPreview.classList.forEach(className => {
                if (className.startsWith('rarity-')) {
                    cardPreview.classList.remove(className);
                }
            });
            // Add new rarity class
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

            // Remove old attribute class
            cardPreview.classList.forEach(className => {
                if (className.startsWith('attr-')) {
                    cardPreview.classList.remove(className);
                }
            });
            // Add new attribute class
            cardPreview.classList.add(`attr-${val}`);
            updateAICardData();
        });
    });

    // Handle Art Style Changes
    artstyleInputs.forEach(input => {
        input.addEventListener('change', (e) => {
            const val = e.target.value;
            // Remove old artstyle class
            cardPreview.classList.forEach(className => {
                if (className.startsWith('artstyle-')) {
                    cardPreview.classList.remove(className);
                }
            });
            // Add new artstyle class
            cardPreview.classList.add(`artstyle-${val}`);
            updateAICardData();
        });
    });

    // Handle image upload
    imageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            handleFile(file);
        }
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

            // Check safety if model is loaded
            if (safetyModel) {
                safetyStatus.classList.remove('hidden');

                // Create temp image for scanning
                const img = new Image();
                img.src = dataUrl;

                await new Promise(resolve => img.onload = resolve);

                const predictions = await safetyModel.classify(img);
                safetyStatus.classList.add('hidden');

                // Detection logic: Porn, Hentai, or Sexy above certain threshold
                const nsfwScores = predictions.filter(p => ['Porn', 'Hentai', 'Sexy'].includes(p.className));
                const isUnsafe = nsfwScores.some(p => p.probability > 0.5); // 50% threshold

                if (isUnsafe) {
                    alert('⚠️ 不適切なコンテンツが検出されました。この画像は使用できません。\n公序良俗に反する画像やアダルトコンテンツの利用は禁止されています。');
                    imageInput.value = ''; // Reset input
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

    // AI Data Generation (Name & Description)
    function updateAICardData() {
        const attrElement = document.querySelector('input[name="card-attribute"]:checked');
        const artElement = document.querySelector('input[name="card-artstyle"]:checked');

        const attrVal = attrElement ? attrElement.value : 'fire';
        const artVal = artElement ? artElement.value : 'photo';
        const attributeLabel = attrElement ? attrElement.parentElement.querySelector('.attr-label').textContent : 'Neutral';

        // 1. Name Generation Logic
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

        // Pick name based on art style index for variety
        const artStyles = ["photo", "classic-anime", "modern-anime", "sd", "manga", "watercolor", "pop", "gothic"];
        const nameIdx = Math.max(0, artStyles.indexOf(artVal)) % nameMap[attrVal].length;
        const generatedName = nameMap[attrVal][nameIdx];

        previewTitle.textContent = generatedName;

        // 2. Description Generation Logic
        const descTemplates = [
            `A legendary manifestation of ${attributeLabel}, known throughout history as the "${generatedName}".`,
            `The power of ${attributeLabel} flows through ${generatedName}, granting it unmatched strength.`,
            `Wherever the ${generatedName} appears, the air thickens with the pure essence of ${attributeLabel}.`,
            `Forged in the heart of ${attributeLabel}, this ${generatedName} stands as a testament to power.`,
            `An ancient guardian bound to local ${attributeLabel} ley lines, ${generatedName} awaits a new master.`
        ];

        // Pick description based on rarity for more flavor later, currently using simple index
        const descIdx = Math.abs(generatedName.length) % descTemplates.length;
        previewDesc.textContent = descTemplates[descIdx];

        // 3. Stats Generation Logic (based on Rarity)
        const rarityElement = document.querySelector('input[name="card-rarity"]:checked');
        const rarity = rarityElement ? rarityElement.value : 'C';

        const statsMap = {
            'C': { base: 200, range: 800 },
            'U': { base: 1000, range: 1000 },
            'R': { base: 2000, range: 1000 },
            'SR': { base: 3000, range: 1000 },
            'RR': { base: 4000, range: 1500 },
            'UR': { base: 6000, range: 3000 }
        };

        const config = statsMap[rarity];
        // Use pseudo-randomness seeded by name for consistency
        const seed = generatedName.length + generatedName.charCodeAt(0);
        const generatedAtk = config.base + (seed * 13) % config.range;
        const generatedDef = config.base + (seed * 17) % config.range;

        // Round to nearest 100
        previewAtk.textContent = Math.round(generatedAtk / 100) * 100;
        previewDef.textContent = Math.round(generatedDef / 100) * 100;
    }


    // Download functionality
    const downloadBtn = document.getElementById('download-btn');
    downloadBtn.addEventListener('click', () => {
        const card = document.getElementById('card-preview');

        // Hide scrollbars or temporary adjustments if needed
        html2canvas(card, {
            backgroundColor: null,
            scale: 2, // Higher quality
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
