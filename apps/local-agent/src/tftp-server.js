const tftp = require('tftp');
const path = require('path');
const fs = require('fs');
const { db } = require('./db');
const { uploadFileAndNotify } = require('./uploader');

function startTftpServer(dataDir) {
  const tftpServer = tftp.createServer({
    host: '0.0.0.0',
    port: 69,
    denyPUT: false,
    denyGET: true // We only want devices to PUSH config to us
  });

  tftpServer.on('error', (err) => {
    console.error(`[TFTP] Erro no servidor:`, err);
    if (err.code === 'EACCES') {
      console.error(`[TFTP] ERRO DE PERMISSÃO: Não foi possível escutar na porta 69. Execute o Agente como root/Administrator.`);
    }
  });

  tftpServer.on('listening', () => {
    console.log(`[TFTP-SERVER] Escutando na porta 69 (UDP). Prontos para receber backups Datacom.`);
  });

  tftpServer.on('request', (req, res) => {
    const remoteIp = req.stats.remoteAddress;
    console.log(`[TFTP] Recebendo conexão de: ${remoteIp}`);

    // Autenticação Zero Trust baseada em IP
    const stmt = db.prepare('SELECT id FROM devices WHERE ip_address = ? AND backup_method LIKE "%TFTP%"');
    const device = stmt.get(remoteIp);

    if (!device) {
      console.error(`[TFTP] Bloqueado. IP ${remoteIp} não cadastrado para TFTP.`);
      req.abort();
      return;
    }

    const deviceId = device.id;
    const deviceDir = path.join(dataDir, deviceId);
    if (!fs.existsSync(deviceDir)) {
      fs.mkdirSync(deviceDir, { recursive: true });
    }

    // Usaremos o nome do arquivo enviado pelo Datacom, mas podemos formatar
    const fileName = req.file || `datacom_backup_${Date.now()}.cfg`;
    const finalPath = path.join(deviceDir, fileName);

    req.on('error', (err) => {
      console.error(`[TFTP] Erro na transferência de ${deviceId}:`, err);
    });

    req.on('close', () => {
      console.log(`[TFTP] Transferência concluída para ${deviceId}: ${fileName}`);
      // Inicia a sincronização com S3 Nuvem
      uploadFileAndNotify(finalPath, deviceId);
    });

    res.pipe(fs.createWriteStream(finalPath));
  });

  try {
    tftpServer.listen();
  } catch (err) {
    console.error(`[TFTP] Falha ao tentar iniciar:`, err);
  }
}

module.exports = { startTftpServer };
