const DB_KEY = 'fridge_inventory_v1';

const db = {
  getAll: () => {
    const data = localStorage.getItem(DB_KEY);
    return data ? JSON.parse(data) : [];
  },
  saveAll: (products) => {
    localStorage.setItem(DB_KEY, JSON.stringify(products));
  },
  add: (product) => {
    const products = db.getAll();
    products.push({ ...product, id: Date.now().toString() });
    db.saveAll(products);
  },
  remove: (id) => {
    const products = db.getAll().filter(p => p.id !== id);
    db.saveAll(products);
  },
  updateQty: (id, delta) => {
    const products = db.getAll();
    const product = products.find(p => p.id === id);
    if (product) {
      product.qty = Math.max(0, parseInt(product.qty || 0) + delta);
      if (product.qty === 0) {
        // Option: auto-remove or keep with 0? Let's keep with 0.
        // Actually user might want to remove. Let's keep 0 for now so they can restock.
      }
      db.saveAll(products);
    }
  },
  findByBarcode: (code) => {
    return db.getAll().find(p => p.barcode === code);
  }
};
