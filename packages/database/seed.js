const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { agentToken: 'demo_token' },
    update: {},
    create: {
      id: 'demo_tenant',
      name: 'Demo Tenant',
      email: 'demo@demo.com',
      agentToken: 'demo_token'
    }
  });

  await prisma.device.upsert({
    where: { id: 'dev_mikrotik_01' },
    update: {},
    create: {
      id: 'dev_mikrotik_01',
      tenantId: tenant.id,
      name: 'Roteador Borda Core',
      ipAddress: '192.168.88.1',
      vendor: 'MIKROTIK'
    }
  });

  console.log('Database seeded successfully');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
