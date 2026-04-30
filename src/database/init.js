const sqlite3 = require('sqlite3').verbose();

const DB_PATH = process.env.DB_PATH || './database.sqlite';

// Create database connection
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('✅ Connected to SQLite database');
  }
});

// Initialize database tables
const initDatabase = () => {
  // Create users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      mobile_number TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('Error creating users table:', err.message);
    } else {
      console.log('✅ Users table ready');
    }
  });

  // Create game_scores table with proper indexing for leaderboard performance
  db.run(`
    CREATE TABLE IF NOT EXISTS game_scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      game_id INTEGER NOT NULL DEFAULT 1,
      level INTEGER NOT NULL DEFAULT 1,
      score INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
      UNIQUE(user_id, game_id)
    )
  `, (err) => {
    if (err) {
      console.error('Error creating game_scores table:', err.message);
    } else {
      console.log('✅ Game scores table ready');
      
      // Create indexes after table is created
      createIndexes();
    }
  });
};

// Create indexes for efficient queries
const createIndexes = () => {
  db.run(`
    CREATE INDEX IF NOT EXISTS idx_game_scores_game_level 
    ON game_scores (game_id, level DESC)
  `, (err) => {
    if (err) {
      console.error('Error creating game_scores index:', err.message);
    } else {
      console.log('✅ Game scores index ready');
    }
  });

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_users_mobile 
    ON users (mobile_number)
  `, (err) => {
    if (err) {
      console.error('Error creating mobile index:', err.message);
    } else {
      console.log('✅ Mobile number index ready');
    }
  });
};

module.exports = {
  db,
  initDatabase
};
