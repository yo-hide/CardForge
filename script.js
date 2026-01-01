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

    const nameInput = document.getElementById('card-name');
    const atkInput = document.getElementById('card-atk');
    const defInput = document.getElementById('card-def');
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
            updateAIDescription();
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

    // Real-time synchronization
    nameInput.addEventListener('input', () => {
        previewTitle.textContent = nameInput.value || 'CARD NAME';
        updateAIDescription();
    });

    function updateAIDescription() {
        const name = nameInput.value || 'This creature';
        const attrElement = document.querySelector('input[name="card-attribute"]:checked');
        const attribute = attrElement ? attrElement.parentElement.querySelector('.attr-label').textContent : 'Neutral';

        const templates = [
            `A legendary manifestation of ${attribute}, known throughout history as "${name}".`,
            `The power of ${attribute} flows through ${name}, granting it unmatched strength.`,
            `Wherever ${name} appears, the air thickens with the essence of ${attribute}.`,
            `Forged in the heart of ${attribute}, ${name} stands as a testament to pure power.`,
            `An ancient guardian bound to the element of ${attribute}, ${name} awaits its next master.`
        ];

        // Pseudo-random but consistent based on name length
        const index = name.length % templates.length;
        previewDesc.textContent = templates[index];
    }

    atkInput.addEventListener('input', () => {
        previewAtk.textContent = atkInput.value || '0';
    });

    defInput.addEventListener('input', () => {
        previewDef.textContent = defInput.value || '0';
    });

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
            link.download = `${nameInput.value || 'card'}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        });
    });
});
