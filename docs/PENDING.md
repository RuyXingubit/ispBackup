# Status Atual e Pendências (Next Steps)

## 🎯 Onde Paramos (Concluído)
O motor central do **ispBackup** está 100% estruturado, blindado e testado.
- **Monorepo:** Configurado via `npm workspaces` e Turborepo.
- **Banco de Dados (SaaS):** PostgreSQL modelado com Prisma (`Tenant`, `Device`, `BackupLog`). APIs de recepção criadas.
- **Agente Local (Borda):** Criado em Node.js com FTP Passivo, Watcher de Disco em tempo real e Upload direto para S3/MinIO.
- **Segurança (Zero Trust):** O Agente Local autentica roteadores via SQLite interno (sem nuvem) e tranca os arquivos em Sandboxes isoladas por dispositivo para evitar vazamentos e acessos indevidos.

---

## 🚀 Pendências para Amanhã (Fase 4 - Interfaces e Painéis)

Para amanhã, o foco será exclusivamente na **Camada Visual (UI/UX)** e na usabilidade dos administradores. Devemos iniciar a construção seguindo regras de design Premium (Micro-animações, Cores Vibrantes/Dark Mode) utilizando **CSS Modules / Vanilla CSS** no Next.js.

### 1. Painel SaaS (Nuvem - Next.js)
- [ ] **Sistema de Design:** Criar o `index.css` global definindo as paletas de cores, tipografia (ex: Inter/Outfit) e variáveis responsivas.
- [ ] **Autenticação UI:** Telas de Login e Cadastro de novos Tenants (Provedores).
- [ ] **Dashboard Principal:** 
  - Gráficos de retenção e consumo de dados.
  - Tabela listando os `BackupLogs` reportados pelo Agente Local.
  - Botão de **Download**: Rota na API para espelhar o arquivo do S3 para a máquina do usuário.
- [ ] **Gerenciador de Borda:** Tela com botão "Gerar Instalador", que consome a API `/api/agent/install` e exibe o comando Bash (docker-compose) para o provedor copiar e colar na VM local.

### 2. Mini-Painel Local (Zero Trust - Express/React)
- [ ] **Dashboard Offline:** O Agente Local precisa de uma página web super simples (rodando na porta local da VM do cliente, ex: `localhost:3000`).
- [ ] **Gerenciamento de Credenciais:** Formulário para o cliente cadastrar localmente seus roteadores no banco SQLite (`db.js`) recém-criado, garantindo que as senhas do MikroTik/Huawei nunca sejam enviadas para o nosso banco de dados da Nuvem.

### 3. Integrações Finais
- [ ] Fazer o *Merge* e validar a comunicação E2E do Painel Frontend com o Agente rodando simultaneamente.
