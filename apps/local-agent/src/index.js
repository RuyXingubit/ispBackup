require('dotenv').config();
const { startFtpServer, DATA_DIR } = require('./ftp-server');
const { startWatcher } = require('./watcher');

console.log("=========================================");
console.log("   ISP Backup - Borda (Local Agent)      ");
console.log("=========================================");

if (!process.env.TENANT_ID || !process.env.AGENT_TOKEN) {
  console.warn("[Sistema] Operando em modo de falha sem variáveis de conexão Nuvem.");
}

// Inicialização Assíncrona dos Módulos
const diretorioDeDados = startFtpServer();
startWatcher(diretorioDeDados);

console.log("[Sistema] Daemon Local ativado e monitorando rotinas de provedor...");
