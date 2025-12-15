const DB_KEY = 'fridge_inventory_v1';
const DB_CATS_KEY = 'fridge_categories_v1';

const db = {
  getAll: () => {
    const data = localStorage.getItem(DB_KEY);
    return data ? JSON.parse(data) : [];
  },
  saveAll: (products) => {
    try {
        localStorage.setItem(DB_KEY, JSON.stringify(products));
    } catch (e) {
        alert('Stocarea este plina! Sterge produse cu poze mari.');
        console.error(e);
    }
  },
  getCategories: () => {
    const data = localStorage.getItem(DB_CATS_KEY);
    return data ? JSON.parse(data) : ['General', 'Dairy', 'Vegetables', 'Meat', 'Drinks'];
  },
  addCategory: (cat) => {
    const cats = db.getCategories();
    if (!cats.includes(cat)) {
        cats.push(cat);
        localStorage.setItem(DB_CATS_KEY, JSON.stringify(cats));
    }
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
      db.saveAll(products);
    }
  },
  findByBarcode: (code) => {
    return db.getAll().find(p => p.barcode === code);
  }
};
