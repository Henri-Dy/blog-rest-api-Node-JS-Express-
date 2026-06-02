const Database = require('better-sqlite3');
const path     = require('path');
const fs       = require('fs');

let db;

function getDb() {
  if (!db) throw new Error('Database not initialized. Call initializeDatabase() first.');
  return db;
}

async function initializeDatabase() {
  const isTest    = process.env.NODE_ENV === 'test';
  const dbPath    = path.resolve(
    isTest
      ? (process.env.TEST_DB_PATH || './test_database.sqlite')
      : (process.env.DB_PATH      || './database.sqlite')
  );
  const migrationPath = path.join(__dirname, 'migrations', '001_initial.sql');

  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.pragma('synchronous = NORMAL');

  const sql = fs.readFileSync(migrationPath, 'utf-8');
  db.exec(sql);

  return db;
}

function closeDatabase() {
  if (db) {
    db.close();
    db = null; // Permet la réinitialisation entre les suites
  }
}

module.exports = { getDb, initializeDatabase, closeDatabase };