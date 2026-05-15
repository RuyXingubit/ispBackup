# Sistema de Gerenciamento de Backups para Provedores (ISPs)

Este documento descreve a arquitetura, stack tecnológica e o plano de implementação do software de gerenciamento de backups de dispositivos de rede, desenhado para funcionar em um modelo híbrido (Open Source / Auto-hospedado e SaaS Premium).

## 1. Arquitetura Híbrida e Componentes

O sistema será dividido em duas partes principais:

### 1.1 Painel SaaS (Nuvem)
O cérebro do sistema, onde os clientes (provedores) acessam o dashboard, gerenciam suas assinaturas, visualizam relatórios e monitoram alertas de backups falhos.
- **Frontend:** Next.js (React) focado em um design premium (Dark Mode, painéis analíticos com gráficos de uso de disco).
- **Backend:** Node.js (API REST / GraphQL) para gerenciar toda a lógica de negócios e permissões de usuários.
- **Banco de Dados:** PostgreSQL. Armazenará **apenas metadados** (cadastro de empresas, roteadores, planos SaaS, histórico de execução, nome e tamanho dos backups, logs).
- **Armazenamento de Arquivos:** Object Storage compatível com S3 (AWS S3, Cloudflare R2, MinIO ou DigitalOcean Spaces). Aqui ficam os arquivos físicos (`.sql`, `.backup`, `.rsc`).

### 1.2 Agente Local (Worker Docker)
Instalado na infraestrutura do próprio provedor (Edge), projetado para resolver problemas de conectividade e políticas restritivas de firewall (equipamentos sem acesso à internet).
- **Motor:** Aplicação base feita em Node.js / TypeScript.
- **Local FTP:** Um servidor FTP embutido (`ftp-srv`) ou container `vsftpd` acoplado via Docker Compose para receber backups automáticos.
- **Executor SSH/Telnet:** Rotinas programadas (cron) para acessar ativamente roteadores, switches, OLTs (Cisco, Huawei, Datacom) e extrair as configurações (`running-config`, `startup-config`).
- **Armazenamento Local:** Mapeamento de volume Docker no disco rígido local do provedor.
- **Sincronização Cloud:** Rclone nativo ou chamadas via AWS SDK para fazer o upload criptografado dos backups para a Nuvem.

---

## 2. Fluxos de Uso Detalhados (Casos de Uso)

### Fluxo 1: Cliente "Conforto" (Credenciais Centralizadas)
Neste cenário, o cliente quer gerenciar tudo pelo seu celular ou de qualquer lugar, sem se preocupar em hospedar configurações sensíveis localmente.
1. **Cadastro e Assinatura:** O usuário acessa o site, cria sua conta e escolhe o plano Premium (Gerenciamento Centralizado).
2. **Instalação do Agente:** O SaaS gera um comando de instalação único (ex: `curl -sSL https://api.backupisp.com/install.sh?token=HASH | bash`), similar ao projeto `ispAlive`. O Docker Compose sobe o Agente Local já autenticado com o Tenant do cliente.
3. **Provisionamento e Execução:** O cliente acessa o Painel Web e cadastra o IP e senhas de seus equipamentos. O Agente Local puxa essas tarefas (Polling) via API HTTPS e executa a coleta dos roteadores ativamente (via SSH/Telnet).

### Fluxo 2: Recepção FTP e Sincronização Cloud (A Arquitetura "Profissional")
Fluxo dedicado ao recebimento de envios automáticos agendados nos dispositivos (ex: MikroTik enviando `.rsc` e `.backup`).
1. **Recepção e Borda:** O Agente Local roda um FTP na porta 21 da VM do cliente. O MikroTik conecta e envia os arquivos.
2. **Camada de HD (Local Disk):** Os arquivos são primeiramente gravados em um Volume Docker no disco rígido do servidor local (garantindo que o cliente tenha uma cópia ultra-rápida e redundância na própria rede).
3. **Processamento Node.js (Watcher):** Imediatamente após a gravação completa, um script Node.js do Agente detecta o arquivo novo.
4. **Envio Cloud e Metadados:** O Agente faz um upload do arquivo (POST stream) direto para o Bucket S3/MinIO da Nuvem. Após o sucesso do upload, o Agente faz uma chamada REST para a API do SaaS (PostgreSQL) para registrar o sucesso da operação.
5. O arquivo passa a existir na Borda (Local) e no Core (Nuvem).

### Fluxo 3: Recuperação de Desastre (Provedor Offline)
Cenário crítico: O roteador de Borda (MikroTik) queimou ou sofreu um reset. Toda a rede parou e o Agente Local perdeu conectividade externa.
1. **Ação:** O dono do provedor acessa o nosso Painel Web (SaaS) na nuvem utilizando a rede 4G do seu celular.
2. **A Salvação:** Como os backups rotineiros subiram via Fluxo 2, a Nuvem possui a cópia perfeita no MinIO.
3. **Restauração:** Ele clica em "Baixar", salva em um dispositivo removível, insere no equipamento novo e a rede do ISP volta à vida. (Fluxo chave para retenção de clientes).

### Fluxo 4: Cliente "Paranoico" (Zero Trust / Privacidade Extrema)
Para provedores que se recusam a enviar as senhas de seus roteadores principais para servidores cloud.
1. O usuário cria a conta e escolhe o modo "Gerenciamento Local".
2. Após instalar o Agente (via comando `curl`), ele acessa um Mini-Painel Local (ex: `http://192.168.1.100:3000`).
3. As senhas de SSH/Telnet dos roteadores (Huawei, Cisco) são digitadas nessa interface e salvas criptografadas **apenas** no SQLite local do Agente. A nuvem não as conhece.
4. O Agente Local executa o backup ativamente. O painel Cloud gerencia as cotas e recebe os arquivos binários finais dos backups, garantindo segurança absoluta das senhas de administração.

---

## 3. Estrutura do Repositório (Monorepo)

Para centralizar o desenvolvimento, utilizaremos um ecossistema Monorepo (Turborepo ou pnpm workspaces) para compartilhar bibliotecas base.

```text
/
├── apps/
│   ├── web/               # Next.js Painel SaaS (UI Premium, Dashboards)
│   ├── api/               # Node.js Backend SaaS (APIs Core)
│   └── local-agent/       # Node.js App (Executor FTP, Watcher de Disco, Workers SSH)
├── packages/
│   ├── database/          # Prisma schema para o PostgreSQL (SaaS) e SQLite (Agent)
│   ├── types/             # Tipagens TS e interfaces comuns
│   └── device-drivers/    # Scripts nativos de comandos para Huawei, Datacom, etc.
```

---

## 4. Fases de Implementação

### Fase 1: Fundação & Painel Web (MVP SaaS)
- Inicializar a estrutura do monorepo (Next.js + Node.js + Prisma).
- Modelagem e criação do banco de dados PostgreSQL.
- Criar Autenticação multi-tenant e CRUD de Provedores, Equipamentos, e Assinaturas.
- Desenhar a interface do Dashboard Premium com estatísticas de consumo de disco e status.

### Fase 2: O Agente Local e Motor FTP
- Criar o container do Agente em Node.js (Edge App).
- Implementar receptor FTP passivo robusto para MikroTik e Linux ERPs.
- Desenvolver a lógica de gravação em disco local, upload em stream síncrono para o MinIO/S3, e sync de dados de volta com a API.
- Criar a mecânica de script gerador automático para a instalação do cliente (`curl | bash`).

### Fase 3: Motor de Coleta Ativa e Mini-Painel (Zero Trust)
- Implementar motor SSH/Telnet para acesso ativo a equipamentos da rede (Cisco, Huawei, Datacom).
- Desenvolver o Mini-Painel Local (Next.js Standalone ou Express UI simples) e o banco SQLite para suporte ao cliente Zero Trust.
- Finalizar orquestração do Agente e testes finais de sincronização.

---

## 5. Plano de Verificação (Verification Plan)

### Testes Automatizados e de Arquitetura
- **Simulação de Rede (Borda):** Subir containers Docker com imagens simulando servidores SSH e clientes FTP enviando cargas grandes para estressar o "Local Agent".
- **Validação de Quotas de Disco:** Testar o medidor de armazenamento do plano SaaS (Garantir que um upload de 2MB via Agente seja deduzido corretamente do plano de 50GB do usuário).
- **Testes Offline (Cache Sync):** Derrubar a conexão simulada do Agente, forçar um backup local e validar se ele arquiva a pendência em cache para reenviar quando a internet da VM retornar.
