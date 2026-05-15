require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { startFtpServer } = require('./ftp-server');
const { startWatcher } = require('./watcher');
const { db } = require('./db');

console.log("=========================================");
console.log("   ISP Backup - Borda (Local Agent)      ");
console.log("=========================================");

if (!process.env.TENANT_ID || !process.env.AGENT_TOKEN) {
  console.warn("[Sistema] Operando em modo de falha sem variáveis de conexão Nuvem.");
}

// Inicialização Assíncrona dos Módulos Core (FTP e Watcher)
const diretorioDeDados = startFtpServer();
startWatcher(diretorioDeDados);

// Inicialização do Servidor Web (Painel Local Zero Trust)
const app = express();
app.use(cors());
app.use(express.json());

// API Routes for Local SQLite
app.get('/api/devices', (req, res) => {
  try {
    const devices = db.prepare('SELECT id, name, ip_address as ip, ftp_user as sshUser FROM devices').all();
    res.json(devices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/devices', (req, res) => {
  const { name, ip, vendor, sshUser, sshPassword } = req.body;
  const id = `dev_${Date.now()}`;
  try {
    const stmt = db.prepare('INSERT INTO devices (id, name, ip_address, ftp_user, ftp_password) VALUES (?, ?, ?, ?, ?)');
    stmt.run(id, name, ip, sshUser, sshPassword);
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/devices/:id', (req, res) => {
  try {
    const stmt = db.prepare('DELETE FROM devices WHERE id = ?');
    stmt.run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/devices/:id', (req, res) => {
  const { name, ip, vendor, sshUser, sshPassword } = req.body;
  try {
    if (sshPassword) {
      const stmt = db.prepare('UPDATE devices SET name = ?, ip_address = ?, ftp_user = ?, ftp_password = ? WHERE id = ?');
      stmt.run(name, ip, sshUser, sshPassword, req.params.id);
    } else {
      const stmt = db.prepare('UPDATE devices SET name = ?, ip_address = ?, ftp_user = ? WHERE id = ?');
      stmt.run(name, ip, sshUser, req.params.id);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/devices/:id/logs', (req, res) => {
  try {
    const logs = db.prepare('SELECT * FROM local_backup_logs WHERE device_id = ? ORDER BY created_at DESC LIMIT 10').all(req.params.id);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/devices/:id/files', (req, res) => {
  try {
    const fs = require('fs');
    const deviceDir = path.join(diretorioDeDados, req.params.id);
    if (!fs.existsSync(deviceDir)) {
      return res.json([]);
    }
    const files = fs.readdirSync(deviceDir)
      .map(file => {
        const stats = fs.statSync(path.join(deviceDir, file));
        return { name: file, size: stats.size, mtime: stats.mtime };
      })
      .sort((a, b) => b.mtime - a.mtime)
      .slice(0, 5); // top 5 recent files
    res.json(files);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/backups/download/:deviceId/:fileName', (req, res) => {
  const { deviceId, fileName } = req.params;
  const filePath = path.join(diretorioDeDados, deviceId, fileName);
  res.download(filePath, fileName, (err) => {
    if (err) {
      if (!res.headersSent) res.status(404).send('File not found.');
    }
  });
});

// Serve the compiled React SPA
const uiPath = path.join(__dirname, '..', 'ui', 'dist');
app.use(express.static(uiPath));

// Fallback for SPA routing
app.use((req, res) => {
  res.sendFile(path.join(uiPath, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[Sistema] Daemon Local ativado e monitorando rotinas de provedor...`);
  console.log(`[Painel Local] Acesse a interface Zero Trust em http://localhost:${PORT}`);
});
