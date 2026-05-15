# Product Requirements Document (PRD) & User Stories

**Projeto:** Sistema de Gerenciamento de Backups para ISPs (ispBackup)
**Documento Base:** `implementation_plan.md`

---

## 1. Visão do Produto
O objetivo do sistema é garantir que provedores de internet (ISPs) não percam configurações críticas de seus roteadores e OLTs. O sistema atua como uma ponte entre a Borda (infraestrutura do provedor, muitas vezes offline/isolada) e a Nuvem, garantindo segurança, redundância e opções flexíveis de privacidade.

## 2. Personas (Público-Alvo)
- **O Gestor "Conforto":** Quer praticidade. Delega a gestão de senhas para a nuvem para poder acessar tudo pelo celular.
- **O Engenheiro "Zero Trust":** É paranoico com segurança. Não aceita que a senha do seu roteador core saia da sua própria rede.
- **O Agente Local (Sistema):** O "funcionário" digital que trabalha dentro do provedor 24/7 coletando os dados.

---

## 3. Epics e User Stories (Requisitos Funcionais)

### Epic 1: Onboarding e Provisionamento SaaS
- **US01: Cadastro e Assinatura**
  - **Como** Gestor do provedor
  - **Quero** criar uma conta no painel SaaS e escolher a modalidade de gestão (Cloud ou Zero Trust)
  - **Para** iniciar o uso da plataforma.
  - **Critérios de Aceitação (DoD):**
    - Fluxo de sign-up completo com e-mail/senha.
    - Tenant provisionado no PostgreSQL.

- **US02: Instalação do Agente Local (1-Click)**
  - **Como** Gestor do provedor
  - **Quero** copiar um comando `curl` do meu dashboard SaaS
  - **Para** instalar o Agente Local na minha VM com facilidade, sem precisar configurar tokens na mão.
  - **Critérios de Aceitação (DoD):**
    - O comando gerado pelo SaaS deve injetar o `TENANT_ID` dinamicamente.
    - A instalação via Bash deve subir a stack em Docker Compose.

### Epic 2: Motor de Coleta de Backups (Agente Local)
- **US03: Recepção via FTP Passivo**
  - **Como** Roteador MikroTik (agendador)
  - **Quero** enviar meus arquivos `.backup` e `.rsc` para um servidor FTP interno na porta 21
  - **Para** que o sistema pegue meu backup automaticamente.
  - **Critérios de Aceitação (DoD):**
    - O Agente Local deve subir um serviço FTP responsivo com acesso anônimo **bloqueado**.
    - O roteador deve autenticar com credenciais únicas validadas no banco de dados local (SQLite).
    - Os arquivos devem ser salvos em um Volume Docker mapeado, isolados em uma "Sandbox" exclusiva por dispositivo (`/data/backups/{device_id}/`).

- **US04: Coleta Ativa (SSH/Telnet)**
  - **Como** Agente Local
  - **Quero** acessar equipamentos via rede local (Huawei, Cisco)
  - **Para** rodar comandos de exportação e extrair os arquivos texto.
  - **Critérios de Aceitação (DoD):**
    - Execução via cron local baseada na frequência escolhida.
    - Suporte a fallback de SSH para Telnet (comum em Datacom antigo).

### Epic 3: Sincronização Cloud e Disaster Recovery
- **US05: Upload Síncrono e Registro de Metadados**
  - **Como** Agente Local
  - **Quero** enviar cada backup finalizado para o Storage S3 e avisar a API
  - **Para** criar redundância na Nuvem.
  - **Critérios de Aceitação (DoD):**
    - O envio do arquivo físico vai para o MinIO/AWS S3 via stream.
    - O disparo dos metadados (POST) vai para o PostgreSQL da API SaaS.
    - **Offline Tolerance:** Se a internet do provedor cair no momento, o Agente guarda em uma fila (cache) e envia assim que voltar.

- **US06: Resgate Offline (Disaster Recovery)**
  - **Como** Gestor do Provedor (cuja rede principal caiu)
  - **Quero** acessar o Painel SaaS via rede externa (ex: 4G) e baixar o backup
  - **Para** restaurar meu roteador e salvar o provedor.
  - **Critérios de Aceitação (DoD):**
    - Interface Web deve listar o histórico completo de backups no MinIO.
    - Botão de "Download" gerando URL assinada do S3.

### Epic 4: Segurança Zero Trust
- **US07: Mini-Painel de Credenciais Locais**
  - **Como** Engenheiro Zero Trust
  - **Quero** acessar um painel restrito `http://IP_DO_AGENTE:3000`
  - **Para** colocar a senha do meu roteador sem que ela vá para a internet.
  - **Critérios de Aceitação (DoD):**
    - O SaaS não terá campos de senha do roteador.
    - O Agente Local terá um banco SQLite interno criptografado.
    - O Agente rodará as rotinas usando senhas locais e mandará só o arquivo inerte pra nuvem.

---

## 4. Requisitos Não Funcionais (NFRs)
1. **Performance:** O Painel Web (Next.js) deve carregar estatísticas de milhares de arquivos em menos de 1 segundo (usar paginação).
2. **Resiliência:** O serviço FTP local não deve bloquear se a internet do ISP cair. O disco local sempre é o buffer de segurança.
3. **Segurança:** Backups salvos no S3 devem ter o acesso restrito por Tenant (Provedor A não pode acessar arquivos do Provedor B).
4. **Volume de Disco:** O SaaS deve calcular e descontar o armazenamento real usado no S3 da cota do plano Premium.
