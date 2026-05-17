const cron = require('node-cron');
const { db } = require('./db');
const { triggerDatacomBackup } = require('./executors/datacom');

// Mantém um mapa em memória dos jobs agendados para poder recarregá-los se necessário
const scheduledJobs = {};

function startScheduler() {
  console.log(`[Scheduler] Iniciando motor de agendamentos cron (Coleta Ativa)...`);
  
  // Lê todos os dispositivos configurados para coleta ativa
  const devices = db.prepare(`SELECT * FROM devices WHERE backup_method LIKE '%TFTP%' OR backup_method LIKE '%TELNET%' OR backup_method LIKE '%SSH%'`).all();

  devices.forEach(device => {
    scheduleDevice(device);
  });
}

function scheduleDevice(device) {
  if (scheduledJobs[device.id]) {
    scheduledJobs[device.id].stop();
  }

  const cronExp = device.backup_schedule || '0 2 * * *';
  
  if (cron.validate(cronExp)) {
    scheduledJobs[device.id] = cron.schedule(cronExp, () => {
      console.log(`[Scheduler] Disparando coleta ativa para o dispositivo: ${device.id}`);
      
      if (device.backup_method.includes('TFTP')) {
        triggerDatacomBackup(device);
      }
    });
    console.log(`[Scheduler] Agendado [${device.id}] método [${device.backup_method}] para: ${cronExp}`);
  } else {
    console.error(`[Scheduler] Expressão Cron inválida para ${device.id}: ${cronExp}`);
  }
}

// Para ser chamado via API se um dispositivo for editado
function reloadSchedule(deviceId) {
  const device = db.prepare(`SELECT * FROM devices WHERE id = ?`).get(deviceId);
  if (device) {
    if (device.backup_method.includes('TFTP') || device.backup_method.includes('TELNET') || device.backup_method.includes('SSH')) {
      scheduleDevice(device);
    } else if (scheduledJobs[device.id]) {
      // Se mudou para FTP PASSIVE, cancela o agendamento
      scheduledJobs[device.id].stop();
      delete scheduledJobs[device.id];
      console.log(`[Scheduler] Agendamento cancelado para ${device.id} (Mudou para Passivo)`);
    }
  }
}

module.exports = { startScheduler, reloadSchedule };
