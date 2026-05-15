const { FtpSrv, FtpConnectionError } = require('ftp-srv');
const path = require('path');
const fs = require('fs');
const { authenticateFtpUser } = require('./db');

const DATA_DIR = path.join(process.cwd(), 'data', 'backups');

function startFtpServer() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const port = process.env.FTP_PORT || 2121;
  const ftpServer = new FtpSrv({
    url: `ftp://0.0.0.0:${port}`,
    anonymous: false, // Bloqueio de acesso anônimo ativado
    pasv_url: process.env.PASV_URL || '127.0.0.1',
  });

  ftpServer.on('login', ({ connection, username, password }, resolve, reject) => {
    // Autentica contra o SQLite local (Zero Trust)
    const deviceId = authenticateFtpUser(username, password);
    
    if (deviceId) {
      console.log(`[FTP-SECURE] Login bem sucedido. Dispositivo autenticado: ${deviceId}`);
      
      // Cria uma sandbox/pasta isolada APENAS para este dispositivo
      const deviceFolder = path.join(DATA_DIR, deviceId);
      if (!fs.existsSync(deviceFolder)) {
        fs.mkdirSync(deviceFolder, { recursive: true });
      }
      
      // O MikroTik só vai enxergar e gravar dentro da pasta do próprio ID dele
      resolve({ root: deviceFolder });
    } else {
      console.warn(`[FTP-SECURE] Alerta de Segurança: Tentativa de login falhou para o usuário: ${username}`);
      reject(new FtpConnectionError('Credenciais inválidas'));
    }
  });

  ftpServer.listen().then(() => {
    console.log(`[FTP-SECURE] Servidor Seguro iniciado na porta ${port}. Acesso anônimo bloqueado.`);
  });

  return DATA_DIR;
}

module.exports = { startFtpServer, DATA_DIR };
