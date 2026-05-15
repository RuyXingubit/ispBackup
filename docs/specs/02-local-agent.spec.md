# Spec: Agente Local e Recepção FTP (ispBackup)
**Status:** Em Revisão

## 1. Visão Técnica
Implementar a aplicação daemon (Node.js) responsável por operar na Borda (Edge), dentro da rede interna do provedor. Este agente atua como servidor FTP, executor de comandos remotos (SSH) e ponte para a Nuvem.

## 2. Arquitetura de Módulos (Local Agent)

### 2.1 Módulo FTP (Receptor Ativo e Seguro)
- **Biblioteca:** `ftp-srv` (Node.js).
- **Responsabilidade:** Receber arquivos de roteadores barrando acesso não autorizado e isolando cada cliente.
- **Fluxo:** 
  1. Ouve na porta `2121` com acessos anônimos estritamente bloqueados.
  2. Intercepta o login e consulta `username` e `password` no banco SQLite interno (`db.js`).
  3. Ao autenticar, confina (Sandbox) o dispositivo em seu próprio diretório raiz.
  4. Grava o arquivo físico no caminho: `/app/data/backups/{device_id}/{nome_do_arquivo}.backup`.

### 2.2 Watcher e Uploader S3
- **Responsabilidade:** Reagir a arquivos finalizados e sincronizá-los com a nuvem.
- **Fluxo:**
  1. Biblioteca `chokidar` observa a pasta `/app/data/backups/`.
  2. Ao acionar o evento `add` e garantir que o arquivo terminou de gravar (verificando lock de tamanho e handle de arquivo), a função `uploadToS3` é acionada.
  3. O arquivo vai via stream direto para o S3 da empresa (Nuvem).
  4. Dispara chamada HTTP POST real para `/api/backups/log` (SaaS API) reportando o sucesso.

### 2.3 Módulo de Retenção e Tolerância a Falhas (Cache)
- **Responsabilidade:** Impedir perda de dados se o provedor perder acesso à internet.
- **Fluxo:** Se o `POST` para a API da nuvem ou o upload para o S3 falhar, o caminho local do arquivo e seus metadados vão para um banco SQLite local enxuto. Um Worker rodará a cada N minutos processando os arquivos retidos.

## 3. Contratos e Variáveis de Ambiente
O container Docker precisará das seguintes variáveis injetadas via `.env` na instalação:
- `TENANT_ID`: Identificador da empresa.
- `AGENT_TOKEN`: Chave de API de autenticação.
- `SAAS_API_URL`: URL base da nuvem.
- `S3_ENDPOINT`, `S3_BUCKET`, `S3_KEY`, `S3_SECRET`: Variáveis dinâmicas para envio de arquivos.

## 4. Especificações de Teste (Implementação Real / End-to-End)

*(Nota: Nada de mocks. Todos os testes utilizarão serviços reais em containers paralelos para testar integrações verdadeiras).*

### Integração de Infraestrutura
- [ ] **Integração S3 Real:** Levantar um container MinIO local (Testcontainers/Docker) durante a suíte de testes. Garantir que o envio de um arquivo é salvo no Bucket do MinIO de verdade, comprovando com um GET de checagem.
- [ ] **Integração API Real:** Levantar o servidor local do Backend SaaS rodando contra o banco de testes. O Agente deve realizar a requisição HTTP real (`http://localhost:API_PORT/api/backups/log`) e a validação será feita checando o registro final no PostgreSQL.

### Integração Completa de Fluxo (E2E FTP -> Nuvem)
- [ ] **Fluxo Real Fim-a-Fim:** 
  1. Iniciar o processo servidor FTP do próprio Agente Local.
  2. Executar um cliente FTP de linha de comando (`lftp` ou similar via processo Node) para transferir um arquivo de 1MB genuíno para a porta do FTP em teste.
  3. Validar se o File Watcher intercepta a gravação correta no HD de teste.
  4. Validar se, no fim do processo, o arquivo está fisicamente no container do MinIO e o log de execução aparece no PostgreSQL.
