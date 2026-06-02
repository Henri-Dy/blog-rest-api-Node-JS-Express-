const { initializeDatabase, closeDatabase, getDb } = require('../../src/database/db');

async function setupTestDb() {
  await initializeDatabase();

  // Nettoyer toutes les tables avant chaque suite
  const db = getDb();
  db.exec(`
    DELETE FROM comments;
    DELETE FROM article_tags;
    DELETE FROM article_categories;
    DELETE FROM articles;
    DELETE FROM refresh_tokens;
    DELETE FROM tags;
    DELETE FROM categories;
    DELETE FROM users;
  `);
}

module.exports = { setupTestDb, closeDatabase };