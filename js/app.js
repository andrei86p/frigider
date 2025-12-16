document.addEventListener('DOMContentLoaded', () => {
    // --- Elements ---
    const els = {
        home: document.getElementById('home-view'),
        list: document.getElementById('list-view'),
        listContainer: document.getElementById('product-list-container'),
        
        // Buttons
        homeAdd: document.getElementById('home-add-btn'),
        homeConsume: document.getElementById('home-consume-btn'),
        homeList: document.getElementById('home-list-btn'),
        backToHome: document.getElementById('back-to-home'),
        fabAdd: document.getElementById('fab-add-btn'),

        // Modals
        addModal: document.getElementById('add-modal'),
        closeModal: document.getElementById('close-modal'),
        catModal: document.getElementById('cat-modal'),
        
        // Form
        form: document.getElementById('product-form'),
        catSelect: document.getElementById('category-input'),
        barcodeInput: document.getElementById('barcode-input'),
        nameInput: document.getElementById('name-input'),
        qtyInput: document.getElementById('qty-input'),
        
        // Cameras
        scannerOverlay: document.getElementById('scanner-overlay'),
        scanTrigger: document.getElementById('scan-trigger'),
        closeScanner: document.getElementById('close-scanner'),
        
        cameraOverlay: document.getElementById('camera-overlay'),
        takePhoto: document.getElementById('take-photo-btn'),
        closeCamera: document.getElementById('close-camera'),
        captureBtn: document.getElementById('capture-btn'),
        video: document.getElementById('camera-feed'),
        canvas: document.getElementById('camera-canvas'),
        
        // Photo preview
        photoPreview: document.getElementById('photo-preview'),
        photoImg: document.getElementById('photo-img'),
        photoBase64: document.getElementById('photo-base64'),
        
        // Lightbox
        lightbox: document.getElementById('lightbox'),
        lightboxImg: document.getElementById('lightbox-img'),

        // Cat
        newCatBtn: document.getElementById('new-cat-btn'),
        saveCatBtn: document.getElementById('save-cat-btn'),
        newCatInput: document.getElementById('new-cat-input')
    };

    let scanner = null;
    let cameraStream = null;
    let scanMode = 'add'; // 'add' or 'consume'

    // --- NAVIGATION ---
    function showHome() {
        els.home.classList.add('active');
        els.list.classList.remove('active');
    }
    function showList() {
        renderList();
        els.home.classList.remove('active');
        els.list.classList.add('active');
    }

    els.homeList.addEventListener('click', showList);
    els.backToHome.addEventListener('click', showHome);
    
    // "Add" Flow
    function openAddModal() {
        els.addModal.classList.add('active');
        els.form.reset();
        els.photoPreview.style.display = 'none';
        els.photoBase64.value = '';
        renderCats();
    }
    
    els.homeAdd.addEventListener('click', openAddModal);
    els.fabAdd.addEventListener('click', openAddModal);
    els.closeModal.addEventListener('click', () => els.addModal.classList.remove('active'));

    // "Consume" Flow
    els.homeConsume.addEventListener('click', () => {
        scanMode = 'consume';
        startScanner();
    });

    // --- RENDER ---
    function renderCats() {
        const cats = db.getCategories();
        els.catSelect.innerHTML = cats.map(c => `<option value="${c}">${c}</option>`).join('');
    }

    function renderList() {
        const products = db.getAll();
        const categories = db.getCategories();
        
        const grouped = {};
        categories.forEach(c => grouped[c] = []);
        products.forEach(p => {
            const c = p.category || 'General';
            if (!grouped[c]) grouped[c] = [];
            grouped[c].push(p);
        });

        els.listContainer.innerHTML = '';
        
        let hasItems = false;
        categories.forEach(cat => {
            const items = grouped[cat];
            if (items && items.length > 0) {
                hasItems = true;
                const section = document.createElement('div');
                section.className = 'category-section';
                section.innerHTML = `<div class="category-title">${cat}</div>`;
                
                items.forEach(p => {
                    const el = document.createElement('div');
                    el.className = 'product-item';
                    const img = p.photo || 'icon.svg';
                    el.innerHTML = `
                        <img src="${img}" class="product-thumb" onclick="openLightbox('${img}')">
                        <div class="product-info">
                            <div class="product-title">${p.name}</div>
                            <div class="product-meta">${p.barcode || ''}</div>
                        </div>
                        <div style="display:flex; align-items:center; gap:8px;">
                            <button class="btn-qty" onclick="updateStock('${p.id}', -1)">-</button>
                            <span class="qty-val">${p.qty}</span>
                            <button class="btn-qty" onclick="updateStock('${p.id}', 1)">+</button>
                        </div>
                    `;
                    section.appendChild(el);
                });
                els.listContainer.appendChild(section);
            }
        });

        if (!hasItems) {
            els.listContainer.innerHTML = `<div style="text-align:center; padding:3rem; color:var(--text-muted);">
                <h3>Fridge Empty</h3>
            </div>`;
        }
    }

    // --- LOGIC ---
    window.updateStock = (id, d) => {
        db.updateQty(id, d);
        renderList();
    };
    
    window.openLightbox = (src) => {
        if(!src || src.includes('icon.svg')) return;
        els.lightboxImg.src = src;
        els.lightbox.classList.add('active');
    };

    els.newCatBtn.addEventListener('click', () => els.catModal.classList.add('active'));
    els.saveCatBtn.addEventListener('click', () => {
        const val = els.newCatInput.value.trim();
        if(val) db.addCategory(val);
        els.catModal.classList.remove('active');
        if(els.list.classList.contains('active')) renderList(); 
        else renderCats();
    });

    els.form.addEventListener('submit', (e) => {
        e.preventDefault();
        const data = {
            barcode: els.barcodeInput.value,
            name: els.nameInput.value,
            category: els.catSelect.value,
            qty: parseInt(els.qtyInput.value),
            photo: els.photoBase64.value
        };
        db.add(data);
        els.addModal.classList.remove('active');
        if(els.list.classList.contains('active')) renderList();
        else alert('Product Saved!');
    });

    // --- SCANNERS ---
    els.scanTrigger.addEventListener('click', () => {
        scanMode = 'add';
        startScanner();
    });
    
    els.closeScanner.addEventListener('click', stopScanner);

    function startScanner() {
        els.scannerOverlay.classList.remove('hidden');
        if (!scanner) scanner = new Html5Qrcode("reader");
        
        scanner.start({ facingMode: "environment" }, { fps: 10, qrbox: 250 }, (decoded) => {
            if (scanMode === 'add') {
                els.barcodeInput.value = decoded;
                stopScanner();
                // Check exist
                const exist = db.findByBarcode(decoded);
                if(exist) {
                   if(confirm(`"${exist.name}" already exists. Add +1?`)) {
                       db.updateQty(exist.id, 1);
                       els.addModal.classList.remove('active');
                   }
                }
            } else if (scanMode === 'consume') {
                const exist = db.findByBarcode(decoded);
                if (exist) {
                    db.updateQty(exist.id, -1);
                    alert(`Consumed 1 ${exist.name}. Remaining: ${exist.qty - 1}`);
                    stopScanner(); // or keep open for multiple? Let's stop to be safe.
                } else {
                    alert('Product not found in fridge!');
                    stopScanner();
                }
            }
        }).catch(console.error);
    }
    
    function stopScanner() {
        if(scanner && scanner.isScanning) scanner.stop().then(() => els.scannerOverlay.classList.add('hidden'));
        else els.scannerOverlay.classList.add('hidden');
    }

    // --- CAMERA ZOOM ---
    els.takePhoto.addEventListener('click', async () => {
        try {
            cameraStream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment', width: {ideal: 1920}, height: {ideal: 1080} } 
            });
            els.video.srcObject = cameraStream;
            els.cameraOverlay.classList.remove('hidden');
        } catch(e) { alert('Cam Error: '+e); }
    });

    els.closeCamera.addEventListener('click', () => {
        if(cameraStream) cameraStream.getTracks().forEach(t=>t.stop());
        els.cameraOverlay.classList.add('hidden');
    });

    els.captureBtn.addEventListener('click', () => {
        const vid = els.video;
        const w = vid.videoWidth;
        const h = vid.videoHeight;
        
        // Simulated Zoom: Crop center 50%
        const cropFactor = 0.6; // Use 60% of image (zoom in)
        const cropW = w * cropFactor;
        const cropH = h * cropFactor;
        const startX = (w - cropW) / 2;
        const startY = (h - cropH) / 2;

        els.canvas.width = 600; // Output size
        els.canvas.height = 600;
        
        const ctx = els.canvas.getContext('2d');
        // Draw cropped region to canvas
        ctx.drawImage(vid, startX, startY, cropW, cropH, 0, 0, els.canvas.width, els.canvas.height);
        
        const data = els.canvas.toDataURL('image/jpeg', 0.8);
        els.photoBase64.value = data;
        els.photoImg.src = data;
        els.photoPreview.style.display = 'block';
        
        els.closeCamera.click();
    });
});
