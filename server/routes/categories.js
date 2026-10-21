// ====================================================================
// TataDana Categories Management & AI Onboarding Recommendations
// ====================================================================
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { db } = require('../config/db');
const { authenticateToken, requireApprovedUser } = require('../middleware/auth');

router.use(authenticateToken);
router.use(requireApprovedUser);

// 1. GET ALL CATEGORIES (System templates + User custom)
router.get('/', (req, res) => {
  const categories = db.table('categories').find(c => c.is_system || c.user_id === req.user.id);
  res.json({ success: true, categories });
});

// 2. CREATE CUSTOM CATEGORY
router.post('/', (req, res) => {
  const { name, type, emoji, color } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'Nama kategori wajib diisi.' });
  }

  const newCat = db.table('categories').insert({
    id: crypto.randomUUID(),
    user_id: req.user.id,
    name: name.trim(),
    type: ['expense', 'income'].includes(type) ? type : 'expense',
    emoji: emoji || '🏷️',
    color: color || '#0284c7',
    is_system: false,
    created_at: new Date().toISOString()
  });

  res.status(201).json({ success: true, category: newCat });
});

// 3. AI ONBOARDING CATEGORY RECOMMENDATIONS
router.post('/onboarding-recommend', (req, res) => {
  const { occupation, lifestyle } = req.body;

  let recommendations = [
    { name: 'Makanan & Minuman', emoji: '🍜', type: 'expense', color: '#0284c7' },
    { name: 'Transportasi', emoji: '🚗', type: 'expense', color: '#0369a1' },
    { name: 'Kebutuhan Harian', emoji: '🛒', type: 'expense', color: '#38bdf8' },
    { name: 'Gaji Pokok', emoji: '💰', type: 'income', color: '#059669' }
  ];

  const occ = (occupation || '').toLowerCase();
  if (occ.includes('freelance') || occ.includes('desain') || occ.includes('developer')) {
    recommendations.push(
      { name: 'Klien & Project', emoji: '💼', type: 'income', color: '#10b981' },
      { name: 'Software & Tools', emoji: '💻', type: 'expense', color: '#0ea5e9' },
      { name: 'Ngopi & Cafe', emoji: '☕', type: 'expense', color: '#0284c7' }
    );
  } else if (occ.includes('mahasiswa') || occ.includes('kuliah')) {
    recommendations.push(
      { name: 'Uang Saku / Kiriman', emoji: '💵', type: 'income', color: '#10b981' },
      { name: 'Fotokopi & Buku', emoji: '📚', type: 'expense', color: '#1d4ed8' },
      { name: 'Kost & Laundry', emoji: '🏠', type: 'expense', color: '#0ea5e9' },
      { name: 'Jajan & Nongkrong', emoji: '🧋', type: 'expense', color: '#38bdf8' }
    );
  } else {
    recommendations.push(
      { name: 'Tagihan Rumah', emoji: '🏠', type: 'expense', color: '#0ea5e9' },
      { name: 'Investasi Masa Depan', emoji: '📈', type: 'income', color: '#34d399' },
      { name: 'Kesehatan & Asuransi', emoji: '💊', type: 'expense', color: '#0284c7' }
    );
  }

  // Insert into user's categories
  recommendations.forEach(r => {
    db.table('categories').insert({
      id: crypto.randomUUID(),
      user_id: req.user.id,
      name: r.name,
      emoji: r.emoji,
      type: r.type,
      color: r.color,
      is_system: false,
      created_at: new Date().toISOString()
    });
  });

  res.json({
    success: true,
    message: 'Kategori rekomendasi AI berhasil diterapkan!',
    categories: recommendations
  });
});

// 4. UPDATE CATEGORY
router.put('/:id', (req, res) => {
  const cat = db.table('categories').findById(req.params.id);
  if (!cat || (cat.user_id !== req.user.id && !cat.is_system)) {
    return res.status(404).json({ success: false, message: 'Kategori tidak ditemukan.' });
  }

  if (cat.is_system) {
    return res.status(403).json({ success: false, message: 'Kategori bawaan sistem tidak dapat diubah.' });
  }

  const { name, emoji, color } = req.body;
  const updated = db.table('categories').update(cat.id, {
    ...(name && { name: name.trim() }),
    ...(emoji && { emoji }),
    ...(color && { color })
  });

  res.json({ success: true, category: updated });
});

// 5. DELETE CATEGORY
router.delete('/:id', (req, res) => {
  const cat = db.table('categories').findById(req.params.id);
  if (!cat || cat.user_id !== req.user.id) {
    return res.status(404).json({ success: false, message: 'Kategori tidak ditemukan atau merupakan kategori sistem.' });
  }

  db.table('categories').delete(cat.id);
  res.json({ success: true, message: 'Kategori berhasil dihapus.' });
});

module.exports = router;
