const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbPath = path.join(__dirname, '.', 'user-data.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Không thể kết nối database:', err.message);
    } else {
        console.log('Đã kết nối tới SQLite database at', dbPath);
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT
        )`);
    }
});

module.exports = db;