const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'agent.db');
const db = new Database(dbPath);

// Inicializa as tabelas da Fase 3 (Tolerância a falhas e Zero Trust)
db.exec(`
  CREATE TABLE IF NOT EXISTS devices (
    id TEXT PRIMARY KEY,
    name TEXT,
    ip_address TEXT,
    ftp_user TEXT UNIQUE,
    ftp_password TEXT
  );

  CREATE TABLE IF NOT EXISTS offline_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id TEXT,
    file_path TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

function authenticateFtpUser(username, password) {
  const stmt = db.prepare('SELECT id FROM devices WHERE ftp_user = ? AND ftp_password = ?');
  const device = stmt.get(username, password);
  return device ? device.id : null;
}

// Inserindo um dispositivo de teste para podermos testar o fluxo seguro
function seedDummyDevice() {
  const stmt = db.prepare('INSERT OR IGNORE INTO devices (id, name, ip_address, ftp_user, ftp_password) VALUES (?, ?, ?, ?, ?)');
  stmt.run('dev_mikrotik_01', 'Roteador Borda Core', '192.168.88.1', 'admin_isp', 'senha_super_segura');
}

seedDummyDevice();

module.exports = { db, authenticateFtpUser };
