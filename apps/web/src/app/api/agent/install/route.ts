import { NextResponse } from 'next/server';
import { prisma } from '@ispbackup/database';

export async function GET(request: Request) {
  // TODO: Substituir por Auth de sessão real do Next.js
  const tenantId = 'demo_tenant_id'; 
  
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId }
  });

  if (!tenant) {
    return new NextResponse('Tenant não encontrado ou não autenticado', { status: 404 });
  }

  const script = `#!/bin/bash
echo "Instalando ispBackup Agent Local..."
mkdir -p /opt/ispbackup
cat << 'EOF' > /opt/ispbackup/.env
TENANT_ID=${tenant.id}
AGENT_TOKEN=${tenant.agentToken}
SAAS_API_URL=https://api.ispbackup.com
EOF

curl -sSL https://api.ispbackup.com/docker-compose.yml > /opt/ispbackup/docker-compose.yml
cd /opt/ispbackup
docker-compose up -d
echo "Instalação do Agente Local finalizada com sucesso!"
`;

  return new NextResponse(script, {
    status: 200,
    headers: { 'Content-Type': 'text/plain' }
  });
}
