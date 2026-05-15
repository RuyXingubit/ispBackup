const chokidar = require('chokidar');
const path = require('path');
const { uploadFileAndNotify } = require('./uploader');

function startWatcher(watchDir) {
  console.log(`[Watcher] Monitorando diretório local em tempo real: ${watchDir}`);
  
  const watcher = chokidar.watch(watchDir, {
    ignored: /(^|[\/\\])\../,
    persistent: true,
    awaitWriteFinish: {
      stabilityThreshold: 2000,
      pollInterval: 100
    }
  });

  watcher.on('add', (filePath) => {
    console.log(`[Watcher] GATILHO: Novo backup físico detectado: ${filePath}`);
    
    // O diretório do arquivo agora é o ID do dispositivo (ex: data/backups/dev_mikrotik_01/backup.rsc)
    // Extraimos a pasta pai para saber a quem pertence.
    const deviceId = path.basename(path.dirname(filePath));
    
    if (deviceId && deviceId !== 'backups') {
      uploadFileAndNotify(filePath, deviceId);
    } else {
      console.warn(`[Watcher] Arquivo caiu fora da sandbox do dispositivo: ${filePath}`);
    }
  });
}

module.exports = { startWatcher };
