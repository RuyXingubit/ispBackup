const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const s3Client = new S3Client({
  region: process.env.S3_REGION || 'us-east-1',
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || '',
    secretAccessKey: process.env.S3_SECRET_KEY || '',
  },
  forcePathStyle: true
});

async function uploadFileAndNotify(filePath, deviceId) {
  try {
    const fileName = path.basename(filePath);
    const tenantId = process.env.TENANT_ID || 'demo_tenant';
    
    // Agora organizamos no S3 também pelo Device ID
    const s3Key = `backups/${tenantId}/${deviceId}/${Date.now()}_${fileName}`;
    const bucket = process.env.S3_BUCKET || 'backups-bucket';

    console.log(`[Uploader] Iniciando envio para S3 Object Storage: ${s3Key}`);
    
    const fileStream = fs.createReadStream(filePath);
    const stats = fs.statSync(filePath);
    const fileSizeMb = stats.size / (1024 * 1024);

    const uploadCommand = new PutObjectCommand({
      Bucket: bucket,
      Key: s3Key,
      Body: fileStream,
    });

    await s3Client.send(uploadCommand);
    console.log(`[Uploader] Arquivo do dispositivo [${deviceId}] espelhado no S3 com sucesso!`);

    const apiUrl = process.env.SAAS_API_URL || 'http://localhost:3000';
    console.log(`[Uploader] Notificando API Nuvem: ${apiUrl}/api/backups/log`);

    await axios.post(`${apiUrl}/api/backups/log`, {
      deviceId: deviceId, // O ID exato capturado da pasta FTP
      s3Url: `s3://${bucket}/${s3Key}`,
      localPath: filePath,
      fileSizeMb: parseFloat(fileSizeMb.toFixed(4)),
      status: "SUCCESS"
    }, {
      headers: {
        Authorization: `Bearer ${process.env.AGENT_TOKEN}`
      }
    });

    console.log(`[Uploader] Sincronização e Metadados finalizados para ${deviceId}!`);
  } catch (error) {
    console.error(`[Uploader] Erro crítico no fluxo de envio Cloud:`, error.message);
    // TODO: Jogar o arquivo retido para a fila (offline_queue) no SQLite
  }
}

module.exports = { uploadFileAndNotify };
