import { NextResponse } from 'next/server';
import { prisma } from '@ispbackup/database';

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized: Missing or invalid Bearer token' }, { status: 401 });
  }

  const token = authHeader.split(' ')[1];
  
  // Valida se o Agente pertence a um Tenant válido
  const tenant = await prisma.tenant.findUnique({
    where: { agentToken: token }
  });

  if (!tenant) {
    return NextResponse.json({ error: 'Unauthorized: Invalid Agent Token' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { deviceId, s3Url, localPath, fileSizeMb, status } = body;

    // Registra o metadado do backup no PostgreSQL
    const log = await prisma.backupLog.create({
      data: {
        deviceId,
        s3Url,
        localPath,
        fileSizeMb,
        status,
      }
    });

    return NextResponse.json({ message: 'Backup metadata logged successfully', log }, { status: 201 });
  } catch (error) {
    console.error('Falha ao processar log de backup:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
