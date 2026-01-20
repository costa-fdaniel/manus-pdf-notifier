# Empresa PDF Notifier - TODO

## Banco de Dados e Schema
- [x] Criar tabela `pdf_uploads` para armazenar metadados de PDFs
- [x] Criar tabela `extracted_companies` para dados extraídos
- [x] Criar tabela `email_campaigns` para campanhas de e-mail
- [x] Criar tabela `email_templates` para templates personalizáveis
- [x] Criar tabela `email_logs` para histórico de envios
- [x] Executar migrations com `pnpm db:push`

## Backend - Upload e Processamento
- [x] Implementar endpoint para upload de PDF
- [x] Integrar Camelot para extração de tabelas
- [x] Criar função para extrair nome e CNPJ das tabelas
- [x] Armazenar PDF em S3 com `storagePut()`
- [x] Registrar metadados no banco de dados

## Backend - Enriquecimento de Dados
- [x] Implementar integração com API OpenCNPJ
- [x] Criar função para consultar dados de CNPJ
- [x] Armazenar dados enriquecidos no banco
- [x] Implementar tratamento de erros e rate limiting
- [ ] Criar fila de processamento assíncrono (se necessário)

## Backend - Microsoft Graph API
- [ ] Solicitar credenciais do Outlook (client_id, client_secret, tenant_id)
- [x] Implementar autenticação Azure AD
- [x] Criar função para enviar e-mails via Microsoft Graph
- [x] Implementar suporte a templates HTML
- [x] Registrar logs de envio

## Frontend - Interface Principal
- [x] Criar página de upload de PDF com drag-and-drop
- [x] Exibir progresso de processamento
- [ ] Mostrar tabela com dados extraídos
- [ ] Implementar visualização de dados enriquecidos

## Frontend - Gerenciamento de Campanhas
- [x] Criar interface para criar/editar campanhas
- [x] Implementar editor de templates de e-mail
- [ ] Mostrar preview do e-mail
- [ ] Permitir seleção de empresas para envio

## Frontend - Envio de E-mails
- [x] Criar interface para disparar envios
- [ ] Exibir confirmação antes de enviar
- [ ] Mostrar progresso de envio
- [ ] Exibir relatório de envios

## Frontend - Dashboard e Relatórios
- [ ] Criar dashboard com estatísticas
- [ ] Mostrar histórico de campanhas
- [ ] Exibir logs de envios
- [ ] Implementar filtros e busca

## Design e UX
- [ ] Definir paleta de cores elegante
- [ ] Implementar tema visual consistente
- [ ] Adicionar animações e transições
- [ ] Garantir responsividade mobile

## Testes
- [ ] Escrever testes unitários com Vitest
- [ ] Testar extração de PDF
- [ ] Testar integração com OpenCNPJ
- [ ] Testar envio de e-mails
- [ ] Testar fluxo completo end-to-end

## Documentação e Deploy
- [ ] Documentar API e endpoints
- [ ] Criar guia de uso
- [ ] Preparar para deploy
- [ ] Criar checkpoint final
