document.addEventListener('DOMContentLoaded', () => {
    const imageInput = document.getElementById('image-input');
    const previewImage = document.getElementById('preview-image');
    const imagePlaceholder = document.getElementById('image-placeholder');
    const dropZone = document.getElementById('drop-zone');

    // Input fields
    const nameInput = document.getElementById('card-name');
    const typeInput = document.getElementById('card-type');
    const descInput = document.getElementById('card-description');
    const atkInput = document.getElementById('card-atk');
    const defInput = document.getElementById('card-def');
    const templateInputs = document.querySelectorAll('input[name="design-template"]');
    const rarityInputs = document.querySelectorAll('input[name="card-rarity"]');
    const attributeInputs = document.querySelectorAll('input[name="card-attribute"]');

    // Preview elements
    const cardPreview = document.getElementById('card-preview');
    const previewTitle = document.getElementById('preview-title');
    const previewRarity = document.getElementById('preview-rarity');
    const previewAttribute = document.getElementById('preview-attribute');
    const previewType = document.getElementById('preview-type');
    const previewDesc = document.getElementById('preview-description');
    const previewAtk = document.getElementById('preview-atk');
    const previewDef = document.getElementById('preview-def');

    // Initialize theme
    cardPreview.classList.add('theme-yugioh');
    cardPreview.classList.add('rarity-C');
    cardPreview.classList.add('attr-fire');

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

    function handleFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            previewImage.src = e.target.result;
            previewImage.classList.remove('hidden');
            imagePlaceholder.classList.add('hidden');
        };
        reader.readAsDataURL(file);
    }

    // Real-time synchronization
    nameInput.addEventListener('input', () => {
        previewTitle.textContent = nameInput.value || 'CARD NAME';
    });

    typeInput.addEventListener('input', () => {
        previewType.textContent = typeInput.value || '種族 / タイプ';
    });

    descInput.addEventListener('input', () => {
        previewDesc.textContent = descInput.value || 'ここにカードの説明文が表示されます。';
    });

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
