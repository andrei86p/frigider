document.addEventListener('DOMContentLoaded', () => {
    // --- Elements ---
    const els = {
        main: document.getElementById('main-content'),
        addBtn: document.getElementById('add-btn'),
        modal: document.getElementById('add-modal'),
        closeModal: document.getElementById('close-modal'),
        form: document.getElementById('product-form'),
        catSelect: document.getElementById('category-input'),
        barcodeInput: document.getElementById('barcode-input'),
        
        // Scanner
        scanTrigger: document.getElementById('scan-trigger'),
        scannerOverlay: document.getElementById('scanner-overlay'),
        closeScanner: document.getElementById('close-scanner'),
        
        // Camera
        takePhotoBtn: document.getElementById('take-photo-btn'),
        cameraOverlay: document.getElementById('camera-overlay'),
        video: document.getElementById('camera-feed'),
        captureBtn: document.getElementById('capture-btn'),
        closeCamera: document.getElementById('close-camera'),
        canvas: document.getElementById('camera-canvas'),
        photoPreview: document.getElementById('photo-preview'),
        photoImg: document.getElementById('photo-img'),
        photoBase64: document.getElementById('photo-base64'),
        
        // Category
        newCatBtn: document.getElementById('new-cat-btn'),
        catModal: document.getElementById('cat-modal'),
        newCatInput: document.getElementById('new-cat-input'),
        saveCatBtn: document.getElementById('save-cat-btn'),

        // Lightbox
        lightbox: document.getElementById('lightbox'),
        lightboxImg: document.getElementById('lightbox-img')
    };

    let scanner = null;
    let cameraStream = null;

    // --- RENDER ---
    function render() {
        const products = db.getAll();
        const categories = db.getCategories();
        
        // Sort products by category
        const grouped = {};
        categories.forEach(c => grouped[c] = []);
        products.forEach(p => {
            const c = p.category || 'General';
            if (!grouped[c]) grouped[c] = [];
            grouped[c].push(p);
        });

        els.main.innerHTML = '';
        
        // Build list
        let hasItems = false;
        categories.forEach(cat => {
            const items = grouped[cat];
            if (items && items.length > 0) {
                hasItems = true;
                const section = document.createElement('div');
                section.className = 'category-section';
                
                const title = document.createElement('div');
                title.className = 'category-title';
                title.textContent = cat;
                section.appendChild(title);

                const listContainer = document.createElement('div');
                listContainer.className = 'product-list-container';

                items.forEach(p => {
                    const el = document.createElement('div');
                    el.className = 'product-item';
                    const img = p.photo || 'icon.svg'; // Fallback
                    el.innerHTML = `
                        <img src="${img}" class="product-thumb" onclick="openLightbox('${img}')">
                        <div class="product-info">
                            <div class="product-title">${p.name}</div>
                            <small style="color:var(--text-muted)">${p.barcode || 'No Code'}</small>
                        </div>
                        <div class="product-qty-ctrl">
                            <button class="btn-qty" onclick="window.updateStock('${p.id}', -1)">-</button>
                            <span class="qty-val">${p.qty}</span>
                            <button class="btn-qty" onclick="window.updateStock('${p.id}', 1)">+</button>
                        </div>
                    `;
                    listContainer.appendChild(el);
                });
                section.appendChild(listContainer);
                els.main.appendChild(section);
            }
        });

        if (!hasItems) {
            els.main.innerHTML = `<div style="text-align:center; padding:4rem; color: #64748b;">
                <h3>Empty Fridge</h3><p>Tap + to start</p>
            </div>`;
        }

        // Update Category Select
        els.catSelect.innerHTML = categories.map(c => `<option value="${c}">${c}</option>`).join('');
    }

    // --- LOGIC ---
    window.updateStock = (id, d) => {
        db.updateQty(id, d);
        render();
    };

    window.openLightbox = (src) => {
        if (!src || src.includes('icon.svg')) return;
        els.lightboxImg.src = src;
        els.lightbox.classList.add('active');
    };

    // --- MODALS ---
    els.addBtn.addEventListener('click', () => {
        els.modal.classList.add('active');
        els.form.reset();
        els.photoPreview.style.display = 'none';
        els.photoBase64.value = '';
        render(); // Refresh select
    });
    els.closeModal.addEventListener('click', () => els.modal.classList.remove('active'));

    // --- CATEGORY ---
    els.newCatBtn.addEventListener('click', () => els.catModal.classList.add('active'));
    els.saveCatBtn.addEventListener('click', () => {
        const name = els.newCatInput.value.trim();
        if (name) {
            db.addCategory(name);
            els.catModal.classList.remove('active');
            render();
        }
    });

    // --- SCANNER ---
    els.scanTrigger.addEventListener('click', () => {
        els.scannerOverlay.classList.remove('hidden');
        if (!scanner) {
            scanner = new Html5Qrcode("reader");
        }
        const config = { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 };
        scanner.start({ facingMode: "environment" }, config, (decoded) => {
            els.barcodeInput.value = decoded;
            stopScanner();
            // Try to find if exists
            const existing = db.findByBarcode(decoded);
            if(existing) {
                alert(`Found: ${existing.name}. Increasing Stock.`);
                window.updateStock(existing.id, 1);
                stopScanner();
                els.modal.classList.remove('active');
            }
        }).catch(err => console.error(err));
    });

    els.closeScanner.addEventListener('click', stopScanner);
    function stopScanner() {
        if(scanner) scanner.stop().then(() => els.scannerOverlay.classList.add('hidden')).catch(console.error);
        else els.scannerOverlay.classList.add('hidden');
    }

    // --- CAMERA PHOTO ---
    els.takePhotoBtn.addEventListener('click', async () => {
        try {
            cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            els.video.srcObject = cameraStream;
            els.cameraOverlay.classList.remove('hidden');
        } catch (e) {
            alert('Camera access denied or error: ' + e);
        }
    });

    els.closeCamera.addEventListener('click', stopCamera);
    function stopCamera() {
        if (cameraStream) {
            cameraStream.getTracks().forEach(t => t.stop());
            cameraStream = null;
        }
        els.cameraOverlay.classList.add('hidden');
    }

    els.captureBtn.addEventListener('click', () => {
        const v = els.video;
        const w = v.videoWidth;
        const h = v.videoHeight;
        // Set canvas size (downscale for storage efficiency)
        const maxDim = 800;
        const scale = Math.min(maxDim/w, maxDim/h, 1);
        els.canvas.width = w * scale;
        els.canvas.height = h * scale;
        
        const ctx = els.canvas.getContext('2d');
        ctx.drawImage(v, 0, 0, els.canvas.width, els.canvas.height);
        
        const dataUrl = els.canvas.toDataURL('image/jpeg', 0.7); // 70% quality
        els.photoBase64.value = dataUrl;
        els.photoImg.src = dataUrl;
        els.photoPreview.style.display = 'block';
        stopCamera();
    });

    // --- FORM SUBMIT ---
    els.form.addEventListener('submit', (e) => {
        e.preventDefault();
        const data = {
            barcode: els.barcodeInput.value,
            name: document.getElementById('name-input').value,
            category: els.catSelect.value,
            qty: parseInt(document.getElementById('qty-input').value),
            photo: els.photoBase64.value
        };
        db.add(data);
        els.modal.classList.remove('active');
        render();
    });

    render();
});
