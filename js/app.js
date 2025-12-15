document.addEventListener('DOMContentLoaded', () => {
  const els = {
    list: document.getElementById('product-list'),
    empty: document.getElementById('empty-state'),
    addBtn: document.getElementById('add-btn'),
    modal: document.getElementById('add-modal'),
    closeModal: document.getElementById('close-modal-btn'),
    form: document.getElementById('product-form'),
    barcodeInput: document.getElementById('barcode-input'),
    scanBtn: document.getElementById('scan-btn'),
    stopScanBtn: document.getElementById('stop-scan-btn'),
    scannerContainer: document.getElementById('scanner-container'),
  };

  let scanner = null;

  // Render
  function render() {
    const products = db.getAll();
    els.list.innerHTML = '';
    
    if (products.length === 0) {
      els.empty.classList.remove('hidden');
      return;
    }
    
    els.empty.classList.add('hidden');
    products.forEach(p => {
      const card = document.createElement('div');
      card.className = 'product-card';
      // Default image if none provided
      const imgUrl = p.image || 'https://images.unsplash.com/photo-1584269614966-1736e6556e29?w=400&q=80'; // Generic food image
      
      card.innerHTML = `
        <img src="${imgUrl}" class="product-image" loading="lazy" alt="${p.name}">
        <div class="product-name">${p.name}</div>
        <div class="product-meta">
          <span>${p.qty} in stock</span>
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-secondary" style="padding: 4px 8px; margin:0;" onclick="handleStock('${p.id}', 1)">+</button>
            <button class="btn btn-secondary" style="padding: 4px 8px; margin:0;" onclick="handleStock('${p.id}', -1)">-</button>
          </div>
        </div>
      `;
      els.list.appendChild(card);
    });
  }

  // Stock handlers (Global scope needed for onclick)
  window.handleStock = (id, delta) => {
    db.updateQty(id, delta);
    render();
  };

  // Modal
  els.addBtn.addEventListener('click', () => {
    els.modal.classList.add('active');
    els.form.reset();
  });
  
  els.closeModal.addEventListener('click', () => {
    els.modal.classList.remove('active');
    if (scanner) scanner.stop();
    els.scannerContainer.classList.add('hidden');
  });

  // Form
  els.form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = {
      barcode: els.barcodeInput.value,
      name: document.getElementById('name-input').value,
      image: document.getElementById('image-input').value,
      qty: parseInt(document.getElementById('qty-input').value)
    };
    db.add(data);
    els.modal.classList.remove('active');
    render();
  });

  // Scanner
  els.scanBtn.addEventListener('click', () => {
    els.scannerContainer.classList.remove('hidden');
    if (!scanner) {
        scanner = new Scanner('reader', (code) => {
            els.barcodeInput.value = code;
            els.scannerContainer.classList.add('hidden');
            // Beep?
        });
    }
    scanner.start();
  });

  els.stopScanBtn.addEventListener('click', () => {
    if (scanner) scanner.stop();
    els.scannerContainer.classList.add('hidden');
  });

  // Initial render
  render();
});
