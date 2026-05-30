require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');

const products = [
  // Running
  { name: 'Nike Air Zoom Pegasus 40', description: 'Lightweight daily trainer with responsive cushioning for long runs.', brand: 'nike', category: 'running', subcategory: 'shoes', price: 10995, originalPrice: 12995, image: '👟', sizes: [{ size: '7', stock: 10 }, { size: '8', stock: 8 }, { size: '9', stock: 12 }, { size: '10', stock: 6 }], colors: ['Black', 'White', 'Blue'], specifications: { material: 'Mesh upper', gender: 'unisex' }, isBestseller: true, isNewArrival: false, tags: ['bestseller'] },
  { name: 'Adidas Ultraboost 23', description: 'Energy-returning Boost midsole for an incredibly comfortable run.', brand: 'adidas', category: 'running', subcategory: 'shoes', price: 14999, originalPrice: 17999, image: '👟', sizes: [{ size: '7', stock: 5 }, { size: '8', stock: 9 }, { size: '9', stock: 7 }], colors: ['White', 'Grey'], specifications: { material: 'Primeknit', gender: 'men' }, isBestseller: true, isNewArrival: false, tags: ['bestseller', 'sale'] },
  { name: 'Decathlon Kiprun KS900', description: 'High-performance running shoe for competitive runners.', brand: 'decathlon', category: 'running', subcategory: 'shoes', price: 4999, originalPrice: 5999, image: '👟', sizes: [{ size: '6', stock: 15 }, { size: '7', stock: 12 }, { size: '8', stock: 10 }], colors: ['Blue', 'Orange'], specifications: { material: 'Synthetic mesh', gender: 'unisex' }, isBestseller: false, isNewArrival: true, tags: ['new_arrival'] },
  { name: 'Puma Running Shorts', description: 'Lightweight dry-fit shorts with inner liner for maximum comfort.', brand: 'puma', category: 'running', subcategory: 'shorts', price: 1299, originalPrice: 1799, image: '🩳', sizes: [{ size: 'S', stock: 20 }, { size: 'M', stock: 25 }, { size: 'L', stock: 18 }, { size: 'XL', stock: 10 }], colors: ['Black', 'Navy'], specifications: { material: 'Polyester', gender: 'men' }, isBestseller: false, isNewArrival: false, tags: ['sale'] },

  // Football
  { name: 'Adidas Predator Accuracy.3', description: 'Firm ground football boots with Controlskin upper for precise ball control.', brand: 'adidas', category: 'football', subcategory: 'boots', price: 6999, originalPrice: 8499, image: '⚽', sizes: [{ size: '7', stock: 8 }, { size: '8', stock: 10 }, { size: '9', stock: 6 }], colors: ['Black/Red'], specifications: { material: 'Synthetic', gender: 'men' }, isBestseller: true, isNewArrival: false, tags: ['bestseller'] },
  { name: 'Nike Phantom GX Academy', description: 'Multi-ground football boots with Ghost Lace system for a clean strike zone.', brand: 'nike', category: 'football', subcategory: 'boots', price: 5499, originalPrice: 6999, image: '⚽', sizes: [{ size: '7', stock: 12 }, { size: '8', stock: 9 }, { size: '9', stock: 7 }, { size: '10', stock: 4 }], colors: ['Blue/White'], specifications: { material: 'Synthetic leather', gender: 'unisex' }, isBestseller: false, isNewArrival: true, tags: ['new_arrival'] },
  { name: 'Decathlon Kipsta F500 Football', description: 'FIFA Basic certified match ball for 11-a-side football.', brand: 'decathlon', category: 'football', subcategory: 'ball', price: 899, originalPrice: 1199, image: '⚽', sizes: [{ size: '5', stock: 30 }], colors: ['White/Black'], specifications: { material: 'PU', gender: 'unisex' }, isBestseller: true, isNewArrival: false, tags: ['bestseller', 'sale'] },
  { name: 'Puma teamGOAL Jersey', description: 'Lightweight team jersey with dryCELL moisture management technology.', brand: 'puma', category: 'football', subcategory: 'jersey', price: 1999, originalPrice: 2499, image: '👕', sizes: [{ size: 'S', stock: 15 }, { size: 'M', stock: 20 }, { size: 'L', stock: 18 }, { size: 'XL', stock: 12 }], colors: ['Red', 'Blue', 'Green'], specifications: { material: 'Polyester', gender: 'unisex' }, isBestseller: false, isNewArrival: false, tags: [] },

  // Cricket
  { name: 'SS Ton Reserve Edition Bat', description: 'English willow cricket bat with premium grade wood for professional play.', brand: 'other', category: 'cricket', subcategory: 'bat', price: 8999, originalPrice: 10999, image: '🏏', sizes: [{ size: 'Full', stock: 15 }], colors: ['Natural'], specifications: { weight: '1.2kg', material: 'English Willow', gender: 'men' }, isBestseller: true, isNewArrival: false, tags: ['bestseller'] },
  { name: 'Decathlon Cricket Helmet', description: 'ABS shell cricket helmet with steel grille for full head protection.', brand: 'decathlon', category: 'cricket', subcategory: 'helmet', price: 1499, originalPrice: 1999, image: '⛑️', sizes: [{ size: 'S', stock: 10 }, { size: 'M', stock: 15 }, { size: 'L', stock: 8 }], colors: ['Navy', 'Black'], specifications: { material: 'ABS + Steel', gender: 'unisex' }, isBestseller: false, isNewArrival: true, tags: ['new_arrival'] },
  { name: 'SG Test Cricket Gloves', description: 'Premium batting gloves with extra padding for top-order batsmen.', brand: 'other', category: 'cricket', subcategory: 'gloves', price: 1299, originalPrice: 1599, image: '🧤', sizes: [{ size: 'S', stock: 12 }, { size: 'M', stock: 18 }, { size: 'L', stock: 10 }], colors: ['White/Red'], specifications: { material: 'Leather', gender: 'men' }, isBestseller: false, isNewArrival: false, tags: [] },
  { name: 'Decathlon Cricket Kit Bag', description: 'Large capacity cricket kit bag with separate shoe compartment.', brand: 'decathlon', category: 'cricket', subcategory: 'bag', price: 2499, originalPrice: 2999, image: '🎒', sizes: [{ size: 'One Size', stock: 20 }], colors: ['Black/Blue'], specifications: { material: 'Polyester', gender: 'unisex' }, isBestseller: false, isNewArrival: false, tags: ['sale'] },

  // Basketball
  { name: 'Nike LeBron NXXT Gen', description: 'Fast-break basketball shoe with Air cushioning and traction pattern.', brand: 'nike', category: 'basketball', subcategory: 'shoes', price: 12999, originalPrice: 15999, image: '🏀', sizes: [{ size: '8', stock: 6 }, { size: '9', stock: 8 }, { size: '10', stock: 5 }, { size: '11', stock: 4 }], colors: ['Black/Gold'], specifications: { material: 'Synthetic', gender: 'men' }, isBestseller: true, isNewArrival: false, tags: ['bestseller'] },
  { name: 'Spalding NBA Official Game Ball', description: 'Official NBA game ball with full-grain leather construction.', brand: 'other', category: 'basketball', subcategory: 'ball', price: 4999, originalPrice: 5999, image: '🏀', sizes: [{ size: '7', stock: 20 }], colors: ['Orange'], specifications: { material: 'Full-grain leather', gender: 'unisex' }, isBestseller: false, isNewArrival: true, tags: ['new_arrival'] },
  { name: 'Adidas 3-Stripe Basketball Jersey', description: 'Breathable mesh jersey for on-court performance.', brand: 'adidas', category: 'basketball', subcategory: 'jersey', price: 2299, originalPrice: 2799, image: '👕', sizes: [{ size: 'S', stock: 10 }, { size: 'M', stock: 15 }, { size: 'L', stock: 12 }, { size: 'XL', stock: 8 }], colors: ['White', 'Black', 'Red'], specifications: { material: 'Mesh polyester', gender: 'unisex' }, isBestseller: false, isNewArrival: false, tags: [] },

  // Fitness
  { name: 'Decathlon 20kg Dumbbell Set', description: 'Adjustable dumbbell set with chrome-plated handles and rubber plates.', brand: 'decathlon', category: 'fitness', subcategory: 'weights', price: 3499, originalPrice: 4499, image: '🏋️', sizes: [{ size: '20kg', stock: 15 }], colors: ['Black'], specifications: { weight: '20kg', material: 'Cast iron + rubber', gender: 'unisex' }, isBestseller: true, isNewArrival: false, tags: ['bestseller', 'sale'] },
  { name: 'Under Armour Compression Tee', description: 'HeatGear compression shirt that keeps you cool and dry during intense workouts.', brand: 'under_armour', category: 'fitness', subcategory: 'top', price: 1999, originalPrice: 2499, image: '👕', sizes: [{ size: 'S', stock: 20 }, { size: 'M', stock: 25 }, { size: 'L', stock: 18 }, { size: 'XL', stock: 10 }], colors: ['Black', 'Grey', 'Navy'], specifications: { material: 'HeatGear fabric', gender: 'men' }, isBestseller: false, isNewArrival: true, tags: ['new_arrival'] },
  { name: 'Decathlon Resistance Band Set', description: 'Set of 5 resistance bands with varying tension levels for full-body workouts.', brand: 'decathlon', category: 'fitness', subcategory: 'accessories', price: 799, originalPrice: 999, image: '💪', sizes: [{ size: 'Set of 5', stock: 40 }], colors: ['Multicolor'], specifications: { material: 'Latex', gender: 'unisex' }, isBestseller: false, isNewArrival: false, tags: ['sale'] },
  { name: 'Reebok Nano X3 Training Shoe', description: 'Versatile cross-training shoe built for gym workouts and HIIT sessions.', brand: 'reebok', category: 'fitness', subcategory: 'shoes', price: 8999, originalPrice: 10999, image: '👟', sizes: [{ size: '7', stock: 8 }, { size: '8', stock: 10 }, { size: '9', stock: 7 }, { size: '10', stock: 5 }], colors: ['Black', 'White'], specifications: { material: 'Mesh', gender: 'unisex' }, isBestseller: true, isNewArrival: false, tags: ['bestseller'] },

  // Swimming
  { name: 'Speedo Fastskin LZR Pure Intent', description: 'Competition swimsuit with Fastskin fabric for reduced drag.', brand: 'other', category: 'swimming', subcategory: 'swimsuit', price: 5999, originalPrice: 7499, image: '🏊', sizes: [{ size: 'S', stock: 8 }, { size: 'M', stock: 10 }, { size: 'L', stock: 6 }], colors: ['Black/Gold'], specifications: { material: 'Fastskin fabric', gender: 'unisex' }, isBestseller: false, isNewArrival: true, tags: ['new_arrival'] },
  { name: 'Decathlon Swimming Goggles', description: 'Anti-fog UV protection goggles with adjustable nose bridge.', brand: 'decathlon', category: 'swimming', subcategory: 'goggles', price: 599, originalPrice: 799, image: '🥽', sizes: [{ size: 'One Size', stock: 35 }], colors: ['Blue', 'Black', 'Clear'], specifications: { material: 'Silicone + PC lens', gender: 'unisex' }, isBestseller: true, isNewArrival: false, tags: ['bestseller', 'sale'] },

  // Cycling
  { name: 'Decathlon Triban RC 520 Helmet', description: 'Road cycling helmet with 18 vents and in-mold construction.', brand: 'decathlon', category: 'cycling', subcategory: 'helmet', price: 2999, originalPrice: 3499, image: '🪖', sizes: [{ size: 'S', stock: 10 }, { size: 'M', stock: 12 }, { size: 'L', stock: 8 }], colors: ['White', 'Black', 'Red'], specifications: { material: 'EPS + Polycarbonate', gender: 'unisex' }, isBestseller: false, isNewArrival: false, tags: [] },
  { name: 'Columbia Cycling Jersey', description: 'Moisture-wicking cycling jersey with 3 rear pockets and full-length zip.', brand: 'columbia', category: 'cycling', subcategory: 'jersey', price: 2499, originalPrice: 2999, image: '🚴', sizes: [{ size: 'S', stock: 12 }, { size: 'M', stock: 15 }, { size: 'L', stock: 10 }], colors: ['Blue', 'Black'], specifications: { material: 'Polyester', gender: 'men' }, isBestseller: false, isNewArrival: true, tags: ['new_arrival'] },

  // Hiking
  { name: 'Columbia Newton Ridge Boots', description: 'Waterproof leather hiking boots with Omni-Grip traction outsole.', brand: 'columbia', category: 'hiking', subcategory: 'boots', price: 7999, originalPrice: 9499, image: '🥾', sizes: [{ size: '7', stock: 8 }, { size: '8', stock: 10 }, { size: '9', stock: 7 }, { size: '10', stock: 5 }], colors: ['Brown', 'Black'], specifications: { material: 'Full-grain leather', gender: 'unisex' }, isBestseller: true, isNewArrival: false, tags: ['bestseller'] },
  { name: 'Decathlon Forclaz 50L Backpack', description: 'Trekking backpack with adjustable back system and rain cover.', brand: 'decathlon', category: 'hiking', subcategory: 'backpack', price: 3999, originalPrice: 4999, image: '🎒', sizes: [{ size: '50L', stock: 15 }], colors: ['Grey', 'Green'], specifications: { material: 'Polyamide', gender: 'unisex' }, isBestseller: false, isNewArrival: false, tags: ['sale'] },

  // Yoga
  { name: 'Decathlon Yoga Mat 8mm', description: 'Non-slip 8mm thick yoga mat with alignment lines and carry strap.', brand: 'decathlon', category: 'yoga', subcategory: 'mat', price: 1299, originalPrice: 1599, image: '🧘', sizes: [{ size: '183x61cm', stock: 30 }], colors: ['Purple', 'Blue', 'Black'], specifications: { material: 'NBR foam', gender: 'unisex' }, isBestseller: true, isNewArrival: false, tags: ['bestseller', 'sale'] },
  { name: 'Puma Yoga Leggings', description: 'High-waist 4-way stretch leggings with moisture-wicking fabric.', brand: 'puma', category: 'yoga', subcategory: 'leggings', price: 2299, originalPrice: 2799, image: '🩱', sizes: [{ size: 'XS', stock: 10 }, { size: 'S', stock: 15 }, { size: 'M', stock: 18 }, { size: 'L', stock: 12 }], colors: ['Black', 'Navy', 'Teal'], specifications: { material: 'Nylon/Spandex', gender: 'women' }, isBestseller: false, isNewArrival: true, tags: ['new_arrival'] },

  // Accessories
  { name: 'Nike Dri-FIT Headband', description: 'Sweat-wicking headband that keeps hair and sweat out of your face.', brand: 'nike', category: 'accessories', subcategory: 'headband', price: 499, originalPrice: 699, image: '🎽', sizes: [{ size: 'One Size', stock: 50 }], colors: ['Black', 'White', 'Red'], specifications: { material: 'Polyester/Spandex', gender: 'unisex' }, isBestseller: false, isNewArrival: false, tags: ['sale'] },
  { name: 'Decathlon Sports Water Bottle 1L', description: 'BPA-free 1L sports bottle with leak-proof flip cap.', brand: 'decathlon', category: 'accessories', subcategory: 'bottle', price: 399, originalPrice: 499, image: '🍶', sizes: [{ size: '1L', stock: 60 }], colors: ['Blue', 'Black', 'Green'], specifications: { material: 'Tritan plastic', gender: 'unisex' }, isBestseller: true, isNewArrival: false, tags: ['bestseller'] },
  { name: 'Asics Sports Socks 3-Pack', description: 'Cushioned ankle socks with arch support for all sports activities.', brand: 'asics', category: 'accessories', subcategory: 'socks', price: 699, originalPrice: 899, image: '🧦', sizes: [{ size: 'S', stock: 30 }, { size: 'M', stock: 40 }, { size: 'L', stock: 25 }], colors: ['White', 'Black'], specifications: { material: 'Cotton/Polyester', gender: 'unisex' }, isBestseller: false, isNewArrival: false, tags: ['sale'] },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sportzone');
    console.log('Connected to MongoDB');

    const existing = await Product.countDocuments();
    if (existing > 0) {
      console.log(`${existing} products already exist. Skipping seed.`);
      console.log('To re-seed, run: node seed.js --force');
      if (!process.argv.includes('--force')) {
        process.exit(0);
      }
      await Product.deleteMany({});
      console.log('Cleared existing products.');
    }

    const inserted = await Product.insertMany(
      products.map(p => ({
        ...p,
        availability: { isAvailable: true },
        ratings: { average: +(3.5 + Math.random() * 1.5).toFixed(1), count: Math.floor(Math.random() * 200) + 10 },
        isActive: true,
      }))
    );

    console.log(`✅ Seeded ${inserted.length} products successfully!`);
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  }
}

seed();
