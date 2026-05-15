# ispBackup

Sistema de Gerenciamento de Backups para Provedores (ISPs) - Arquitetura Híbrida (SaaS + Borda).

## Visão Geral
Este projeto protege as configurações críticas de roteadores (MikroTik, Cisco, Huawei), atuando em duas frentes:
1. **Painel SaaS (Cloud):** Dashboard web premium para gerenciar assinaturas, consultar retenção e gerar instaladores 1-Click.
2. **Agente Local (Edge):** Worker instalado na rede privada do provedor, contendo FTP passivo, motor SSH de coleta ativa, e tolerância a quedas de link.

## Estrutura de Documentação
Este projeto foi planejado sob a ótica de **Spec-Driven Development** e **Business Analysis**. Toda a inteligência do produto reside na pasta `/docs`:
- `PRD.md`: Personas, Épicos, Histórias de Usuário e Critérios de Aceitação.
- `implementation_plan.md`: Visão completa de Arquitetura (Monorepo, S3 vs PostgreSQL, Fluxos).
- `specs/01-saas-core.spec.md`: Schema do banco de dados e contratos de API (Nuvem).
- `specs/02-local-agent.spec.md`: Arquitetura do daemon local e protocolo FTP.
- `PLAN.md`: Divisão de tarefas para execução da equipe de engenharia.
