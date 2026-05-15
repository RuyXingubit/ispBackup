# Spec: Fundação SaaS e Banco de Dados (ispBackup)
**Status:** Em Revisão

## 1. Visão Técnica
Implementar a fundação do Painel SaaS (Next.js) e do Backend (Node.js), estabelecendo o banco de dados multi-tenant, a API de provisionamento e o controle de assinaturas.

## 2. Modelagem de Dados (Prisma Schema)
A estrutura base do PostgreSQL precisa suportar a separação rígida de clientes (Tenants) e rastrear históricos.

```prisma
model Tenant {
  id        String   @id @default(cuid())
  name      String
  email     String   @unique
  plan      PlanType @default(CLOUD_MANAGED) // CLOUD_MANAGED, ZERO_TRUST
  agentToken String  @unique // Token usado pelo Agente Local para falar com a API
  createdAt DateTime @default(now())
  devices   Device[]
}

model Device {
  id          String   @id @default(cuid())
  tenantId    String
  tenant      Tenant   @relation(fields: [tenantId], references: [id])
  name        String
  ipAddress   String
  vendor      VendorType // MIKROTIK, HUAWEI, CISCO, DATACOM
  sshUser     String?  // Nullable para clientes Zero Trust
  sshPassword String?  // Nullable e criptografado na API
  backups     BackupLog[]
}

model BackupLog {
  id          String   @id @default(cuid())
  deviceId    String
  device      Device   @relation(fields: [deviceId], references: [id])
  status      BackupStatus // SUCCESS, FAILED
  fileSizeMb  Float
  s3Url       String?  // Caminho do arquivo na nuvem
  localPath   String?  // Caminho no Agente Local
  createdAt   DateTime @default(now())
}
```

## 3. Contratos de API (Endpoints)

### 3.1 Provisionamento do Agente
- **Endpoint:** `GET /api/agent/install`
- **Auth:** Requer Cookie de sessão (Usuário Logado) no Painel SaaS.
- **Response:** Um script Bash dinâmico (MIME: `text/plain`).
- **Comportamento:** O backend resgata o `agentToken` do Tenant e injeta dinamicamente dentro de um arquivo `.env` gerado no script bash do `docker-compose`.

### 3.2 Registro de Metadados de Backup
- **Endpoint:** `POST /api/backups/log`
- **Auth:** Header `Authorization: Bearer <agentToken>`
- **Payload:**
  ```json
  {
    "deviceId": "cuid_123",
    "s3Url": "s3://backups/tenant_A/router_1.backup",
    "fileSizeMb": 1.5,
    "status": "SUCCESS"
  }
  ```
- **Response:** `201 Created`

## 4. Especificações de Teste (Implementação Real / End-to-End)

*(Nota: Uso exclusivo de instâncias de teste isoladas e comunicação real. Zero uso de stubs/mocks no ciclo de persistência e APIs).*

### Testes Base
- [ ] Subir uma instância real de PostgreSQL isolada via Docker/Testcontainers no início da suíte de testes.
- [ ] Inserir um Tenant real no banco de testes e tentar acessar `/api/backups/log` com um Token incorreto. Validar o retorno HTTP 401 real.
- [ ] Validar que as senhas inseridas via endpoint são efetivamente transformadas em hash (bcrypt/argon2) conferindo fisicamente o campo gravado no banco de testes.

### Integração Completa
- [ ] Executar o fluxo End-to-End: Bater na rota de login real, obter o cookie, realizar o GET na rota `/api/agent/install` e verificar se a string de resposta (Bash script) contém exatamente o `AGENT_TOKEN` vinculado ao Tenant existente no banco de testes.
