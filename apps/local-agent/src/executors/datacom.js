const { Telnet } = require('telnet-client');
const { Client } = require('ssh2');
const ip = require('ip');
const { db } = require('../db');

function getAgentIp() {
  // Retorna o IP local da interface principal para injetar no comando do switch
  return ip.address();
}

async function runDatacomBackupViaTelnet(device) {
  const connection = new Telnet();
  const agentIp = getAgentIp();
  const fileName = `backup-${device.id}-${Date.now()}.cfg`;

  const params = {
    host: device.ip_address,
    port: 23,
    shellPrompt: /#\s*$/,
    loginPrompt: /login[: ]*$/i,
    passwordPrompt: /password[: ]*$/i,
    username: device.ftp_user,
    password: device.ftp_password,
    timeout: 10000,
    execTimeout: 15000,
  };

  try {
    console.log(`[Executor:Datacom] Conectando via Telnet em ${device.ip_address}...`);
    await connection.connect(params);
    
    // Comando compatível com o DmSwitch 2104G2 (TFTP)
    const cmd = `copy running-config tftp://${agentIp}/${fileName}`;
    console.log(`[Executor:Datacom] Executando comando: ${cmd}`);
    
    await connection.exec(cmd);
    
    // Finaliza sessão
    await connection.exec('exit');
    console.log(`[Executor:Datacom] Rotina Telnet finalizada com sucesso para ${device.id}`);
  } catch (err) {
    console.error(`[Executor:Datacom] Falha no Telnet para ${device.id}:`, err.message);
    throw err;
  } finally {
    connection.destroy();
  }
}

function runDatacomBackupViaSsh(device) {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    const agentIp = getAgentIp();
    const fileName = `backup-${device.id}-${Date.now()}.cfg`;

    console.log(`[Executor:Datacom] Conectando via SSH em ${device.ip_address}...`);
    
    conn.on('ready', () => {
      console.log(`[Executor:Datacom] SSH Conectado em ${device.id}`);
      
      conn.shell((err, stream) => {
        if (err) return reject(err);

        let output = '';
        stream.on('close', () => {
          conn.end();
          resolve(output);
        }).on('data', (data) => {
          output += data.toString();
          const str = data.toString();
          
          if (str.includes('#')) {
            if (!stream.cmdSent) {
              const cmd = `copy running-config tftp://${agentIp}/${fileName}\r`;
              console.log(`[Executor:Datacom] Executando comando: ${cmd.trim()}`);
              stream.write(cmd);
              stream.cmdSent = true;
            } else if (!stream.exitSent) {
              stream.write('exit\r');
              stream.exitSent = true;
            }
          }
        });
      });
    }).on('error', (err) => {
      console.error(`[Executor:Datacom] Erro SSH em ${device.id}:`, err.message);
      reject(err);
    }).connect({
      host: device.ip_address,
      port: 22,
      username: device.ftp_user,
      password: device.ftp_password,
      readyTimeout: 10000
    });
  });
}

async function triggerDatacomBackup(device) {
  try {
    if (device.backup_method === 'TFTP_SSH') {
      await runDatacomBackupViaSsh(device);
    } else {
      await runDatacomBackupViaTelnet(device);
    }
  } catch (err) {
    // Registra falha no SQLite local se não conectou
    const stmt = db.prepare('INSERT INTO local_backup_logs (device_id, status, message, file_name) VALUES (?, ?, ?, ?)');
    stmt.run(device.id, 'FAILED', `Erro de conexão ${device.backup_method}: ${err.message}`, null);
  }
}

module.exports = { triggerDatacomBackup };
