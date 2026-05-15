# Execution Plan (PLAN.md)

Baseado nos artefatos de arquitetura gerados (PRD e SDD Specs), esta é a quebra de tarefas para a execução do código.

## Phase 1: Foundation (SaaS Backend & DB)
- [ ] Inicializar o Monorepo (pnpm workspaces / Turborepo com Next.js e Node.js).
- [ ] Configurar conexão com PostgreSQL e inicializar o Prisma.
- [ ] Implementar a modelagem `01-saas-core.spec.md` (Tenant, Device, BackupLog).
- [ ] Desenvolver fluxo de Autenticação/Login do Painel SaaS.
- [ ] Criar a API de Provisionamento de Agente (`GET /api/agent/install`).
- [ ] Criar a API de Ingestão de Metadados (`POST /api/backups/log`).

## Phase 2: Local Agent (Edge Node)
- [ ] Inicializar o pacote Node.js `local-agent`.
- [ ] Implementar o motor de recepção FTP (ouvindo na porta 21).
- [ ] Implementar o Watcher de disco local para detecção de arquivos concluídos.
- [ ] Criar rotina de Upload em Stream usando o AWS S3 SDK (para MinIO/S3).
- [ ] Orquestrar o envio do arquivo para a nuvem e chamada POST para o SaaS.

## Phase 3: Modo Zero Trust & Coleta Ativa (SSH/Telnet)
- [ ] Integrar banco de dados SQLite interno ao Agente Local.
- [ ] Criar o Mini-Painel Web (Express/React) rodando na porta 3000 do agente para cadastro local de senhas.
- [ ] Desenvolver os módulos `device-drivers` para coletar arquivos via comandos CLI em Huawei, Cisco e MikroTik.
- [ ] Criar cronjobs (Node-cron) para rodar a coleta ativa conforme agendamento do cliente.

## Phase 4: Verification & DevOps
- [ ] Levantar Testcontainers (PostgreSQL efêmero) e validar rotas da API SaaS.
- [ ] Levantar MinIO em Docker de teste e executar a suíte E2E do Agente Local (Enviando `.rsc` via FTP Client).
- [ ] Escrever o `docker-compose.yml` final que será empacotado e disponibilizado para os ISPs.
