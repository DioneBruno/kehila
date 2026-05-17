# 🎟️ Sistema de Inscrições e Bilheteria de Eventos

> Documento de referência técnica e de negócio para desenvolvimento, manutenção e evolução do sistema.  
> **Mantenha este documento atualizado a cada decisão arquitetural relevante.**

---

## Índice

1. [Visão Geral](#1-visão-geral)
2. [Modelo de Domínio](#2-modelo-de-domínio)
3. [Arquitetura do Sistema](#3-arquitetura-do-sistema)
4. [Módulos Funcionais](#4-módulos-funcionais)
5. [Regras de Negócio](#5-regras-de-negócio)
6. [Segurança e LGPD](#6-segurança-e-lgpd)
7. [Pagamentos](#7-pagamentos)
8. [Ingressos e QR Code](#8-ingressos-e-qr-code)
9. [Check-in e Controle de Acesso](#9-check-in-e-controle-de-acesso)
10. [Notificações e Comunicação](#10-notificações-e-comunicação)
11. [Relatórios e Dashboards](#11-relatórios-e-dashboards)
12. [Modelo de Dados](#12-modelo-de-dados)
13. [APIs e Integrações](#13-apis-e-integrações)
14. [Infraestrutura e DevOps](#14-infraestrutura-e-devops)
15. [Testes](#15-testes)
16. [Roadmap e Status](#16-roadmap-e-status)
17. [Decisões Técnicas Registradas (ADRs)](#17-decisões-técnicas-registradas-adrs)

---

## 1. Visão Geral

### 1.1 Propósito

Sistema web para gerenciamento completo do ciclo de vida de eventos, incluindo:

- Criação e configuração de eventos pelo organizador
- Venda e reserva de ingressos (online e presencial)
- Check-in digital via QR Code na entrada
- Relatórios financeiros e de presença em tempo real

---

## 2. Modelo de Domínio

> Em desenvolvimento.

---

## 3. Arquitetura do Sistema

### 3.1 Decisões Arquiteturais Importantes

- **Idempotência na compra:** Cada tentativa de compra deve ter um `idempotency_key` para evitar duplicação em caso de retentativa.
- **Webhook assíncrono:** Confirmação de pagamento via webhook do gateway, processada em fila.
- **Check-in offline-first:** O app de portaria sincroniza a lista de ingressos válidos antes do evento e opera localmente.

---

## 4. Módulos Funcionais

### 4.1 Gestão de Eventos

- [x] CRUD de eventos (título, descrição, data, local, banner, categoria)
- [x] Configuração de localização (endereço ou link online)
- [ ] Publicação e agendamento de eventos
- [ ] Duplicar evento (para eventos recorrentes)
- [ ] Cancelamento com notificação automática aos inscritos

### 4.2 Gestão de Ingressos e Lotes

- [x] Criação de tipos de ingresso (inteira, meia, VIP, cortesia)
- [x] Criação de lotes com preço, quantidade e validade
- [ ] Ordem automática de lotes (ao esgotar um, abre o próximo)
- [ ] Código de desconto/cupom com rastreabilidade
- [ ] Limite de ingressos por CPF/e-mail

### 4.3 Fluxo de Compra

- [ ] Seleção de ingressos e quantidade
- [ ] Reserva temporária (ex: 15 minutos) com countdown visível
- [ ] Coleta de dados do comprador e dos participantes (se diferente)
- [ ] Seleção de forma de pagamento
- [ ] Confirmação e geração do ingresso
- [ ] Tela/e-mail de sucesso com ingresso em PDF

### 4.4 Área do Participante

- [ ] Histórico de compras
- [ ] Visualização e download dos ingressos
- [ ] Reenvio de ingresso por e-mail
- [ ] Transferência de ingresso para outro participante
- [ ] Solicitação de cancelamento/reembolso

### 4.5 Painel do Organizador

- [ ] Dashboard com vendas em tempo real
- [ ] Gestão de inscritos (busca, filtro, exportação)
- [ ] Geração manual de cortesias
- [ ] Configuração de check-in (quais campos validar)
- [ ] Relatórios financeiros

### 4.6 App de Portaria / Check-in

- [ ] Login do operador com permissão restrita
- [ ] Leitura de QR Code pela câmera
- [ ] Feedback visual: ✅ Verde (válido) / ❌ Vermelho (inválido/já usado)
- [ ] Busca manual por nome ou código
- [ ] Funcionamento offline com sincronização posterior
- [ ] Contador de entradas em tempo real

---

## 5. Regras de Negócio

### 5.1 Controle de Estoque

```
⚠️ CRÍTICO: Evitar overbooking

- Usar transação de banco + SELECT FOR UPDATE ao reservar ingresso
- Estoque deve ser decrementado SOMENTE após confirmação de pagamento
- Durante reserva temporária: usar contador separado (vagas_reservadas)
- Fórmula: vagas_disponíveis = capacidade - ingressos_pagos - vagas_reservadas
- Expiração de reservas: job periódico libera reservas vencidas
```

### 5.2 Lotes

```
- Lotes são ordenados por prioridade/ordem definida pelo organizador
- Lote ativo = lote com menor ordem que ainda tem vagas E está dentro do período de vendas
- Ao esgotar todas as vagas de todos os lotes: evento vai para ESGOTADO
- Pode existir lista de espera (opcional)
```

### 5.3 Códigos de Desconto

```
- Desconto pode ser: percentual (%) ou valor fixo (R$)
- Pode ter: limite de usos total e/ou limite por usuário
- Deve ser registrado em tabela própria com rastreabilidade completa
- Preço final nunca pode ser negativo (mínimo R$ 0,00)
```

### 5.4 Cancelamento e Reembolso

```
- Política definida pelo organizador por evento
- Prazo mínimo recomendado: até X dias antes do evento
- Reembolso automático via gateway (estorno) ou manual (PIX/TED)
- Ingresso cancelado deve ter QR Code invalidado imediatamente
- E-mail de confirmação de cancelamento obrigatório
```

### 5.5 Transferência de Ingresso

```
- Participante pode transferir para outro e-mail
- O ingresso antigo é invalidado e um novo é gerado
- Ambas as partes recebem confirmação por e-mail
- Log completo da transferência deve ser mantido
```

### 5.6 Unicidade do Ingresso

```
- Cada ingresso tem UUID único e imutável
- QR Code contém: UUID + hash de assinatura (HMAC-SHA256)
- Assinatura impede falsificação mesmo com UUID conhecido
- No check-in: verificar validade da assinatura ANTES de consultar o banco
```

---

## 6. Segurança e LGPD

### 6.1 Autenticação e Autorização

```
- JWT com expiração curta (15-30 min) + refresh token
- Refresh token rotativo: a cada uso, gera um novo e invalida o anterior
- Roles: ADMIN | ORGANIZADOR | OPERADOR | PARTICIPANTE
- Permissões granulares por evento (organizador só vê seus eventos)
- Rate limiting em endpoints críticos (login, compra, check-in)
```

### 6.2 Proteção de Dados (LGPD)

```
Dados coletados e sua base legal:
- Nome completo       → execução de contrato
- E-mail              → execução de contrato + comunicação
- CPF (se necessário) → obrigação legal (nota fiscal) ou contrato
- Telefone            → legítimo interesse / comunicação
- Data de nascimento  → verificação de elegibilidade (meia-entrada)

Direitos do titular (implementar endpoints):
- GET  /me/data         → exportar todos os dados
- DEL  /me/account      → solicitar exclusão (anonimização)
- POST /me/consent      → registrar/revogar consentimentos

Retenção: dados de transação mantidos por 5 anos (obrigação fiscal)
Logs de acesso: manter por no mínimo 6 meses
```

### 6.3 Segurança Técnica

```
- Senhas: bcrypt com custo ≥ 12 (nunca MD5/SHA1 simples)
- Dados sensíveis em trânsito: HTTPS obrigatório (HSTS)
- SQL Injection: usar ORM com queries parametrizadas
- XSS: sanitizar inputs, Content-Security-Policy no header
- CSRF: token CSRF em formulários ou SameSite=Strict nos cookies
- Dados de cartão: NUNCA armazenar — delegar 100% ao gateway
- Logs: nunca logar CPF, cartão, senha, token completo
- Segredos: variáveis de ambiente (.env), nunca no código
```

### 6.4 Auditoria

```
Logar com timestamp, user_id e IP:
- Login / logout / falha de login
- Criação/edição/cancelamento de evento
- Geração de cortesia
- Cancelamento/reembolso de ingresso
- Check-in realizado
- Exportação de dados
```

---

## 7. Pagamentos

### 7.1 Formas de Pagamento Suportadas

| Método            | Gateway                    | Confirmação       | Prazo          |
| ----------------- | -------------------------- | ----------------- | -------------- |
| Cartão de crédito | Mercado Pago / Stripe      | Webhook ~segundos | Imediato       |
| PIX               | Mercado Pago / Gerencianet | Webhook ~segundos | Imediato       |
| Boleto            | Mercado Pago               | Webhook           | 1-3 dias úteis |
| Cortesia          | Sistema próprio            | Automático        | Imediato       |

### 7.2 Fluxo de Pagamento

```
1. Cliente seleciona ingressos
2. Sistema reserva temporariamente (decrementa vagas_reservadas)
3. Sistema cria Pedido com status PENDENTE + idempotency_key
4. Sistema cria preferência/cobrança no gateway
5. Cliente realiza pagamento no gateway
6. Gateway envia webhook ao sistema
7. Sistema valida assinatura do webhook
8. Sistema processa webhook em fila (assíncrono)
9. Se aprovado:
   - Pedido → PAGO
   - Gerar ingressos com QR Codes únicos
   - Enviar e-mail com ingressos (job na fila)
   - Decrementar estoque definitivo
10. Se recusado/expirado:
    - Pedido → CANCELADO
    - Liberar vagas_reservadas
    - Notificar cliente
```

### 7.3 Tratamento de Webhooks

```
⚠️ IMPORTANTE:

- Validar assinatura HMAC do webhook (cada gateway tem seu método)
- Responder HTTP 200 imediatamente, processar depois em fila
- Idempotência: se webhook duplicado, não processar duas vezes
- Salvar webhook raw na tabela webhook_logs ANTES de processar
- Retry automático: se processamento falhar, tentar novamente (3x com backoff)
- Alertar se webhook não chegar em X minutos após criação do pedido
```

### 7.4 Divisão de Receita (Split — se aplicável)

```
- Taxa da plataforma: X% sobre valor líquido
- Valor líquido = valor bruto - taxa do gateway
- Repasse ao organizador: D+X após o evento (ou conforme política)
- Geração de extrato por evento
```

---

## 8. Ingressos e QR Code

### 8.1 Geração do Ingresso

```javascript
// Estrutura do payload do QR Code
{
  "id": "uuid-v4-único",
  "evento_id": "uuid-do-evento",
  "lote_id": "uuid-do-lote",
  "participante": "Nome Completo",
  "tipo": "INTEIRA | MEIA | VIP | CORTESIA",
  "emitido_em": "2024-01-15T10:30:00Z",
  "assinatura": "hmac-sha256(id + evento_id + secret_key)"
}
```

### 8.2 Validação no Check-in

```
1. Ler QR Code → extrair payload
2. Validar assinatura HMAC (rejeita falsificações sem consultar banco)
3. Consultar banco: ingresso existe? Status = PAGO?
4. Verificar: ingresso pertence a este evento?
5. Verificar: ingresso já foi usado? (status = USADO)
6. Se válido:
   - Atualizar status → USADO
   - Registrar timestamp e operador
   - Retornar ✅ com nome do participante
7. Se inválido: retornar ❌ com motivo específico
```

### 8.3 PDF do Ingresso

```
Conteúdo obrigatório:
- Nome do evento, data, horário, local
- Nome do participante
- Tipo do ingresso e lote
- QR Code grande e legível (mínimo 200x200px)
- Código alfanumérico legível abaixo do QR (fallback)
- Número do pedido / protocolo
- Instruções de acesso

Tecnologia sugerida: PDFKit / Puppeteer / wkhtmltopdf
```

---

## 9. Check-in e Controle de Acesso

### 9.1 Modo Offline

```
Fluxo de sincronização:
1. Antes do evento (ex: 2h antes): baixar lista completa de ingressos válidos
   - Armazenar localmente: { id, assinatura, nome, tipo, status }
2. Durante o evento: validar localmente (sem internet)
   - Marcar como USADO localmente
   - Enfileirar para sincronização
3. Quando internet disponível: sincronizar check-ins realizados offline
4. Tratar conflito: ingresso marcado como usado em dois dispositivos offline
   - Segundo check-in é rejeitado na sincronização e operador é alertado
```

### 9.2 Múltiplos Operadores

```
- Cada operador autentica com seu login
- Check-ins são registrados com o ID do operador
- Conflito de check-in simultâneo: banco resolve com transação
  SELECT FOR UPDATE → verifica status → atualiza → retorna resultado
- Relatório mostra check-ins por operador
```

### 9.3 Tipos de Acesso

```
Pode haver múltiplas "portarias" por evento:
- Entrada geral
- Área VIP
- Credenciamento (para imprensa/staff)

Cada tipo de ingresso define quais áreas dá acesso.
Operador vê apenas as áreas que está autorizado a validar.
```

---

## 10. Notificações e Comunicação

### 10.1 E-mails Transacionais

| Trigger                  | Destinatário           | Conteúdo                             |
| ------------------------ | ---------------------- | ------------------------------------ |
| Compra confirmada        | Participante           | Ingressos em PDF, detalhes do evento |
| Lembrete 48h antes       | Participante           | Detalhes + ingresso + localização    |
| Lembrete 2h antes        | Participante           | Link do evento (se online)           |
| Cancelamento de ingresso | Participante           | Confirmação + prazo de reembolso     |
| Transferência recebida   | Novo participante      | Novo ingresso                        |
| Evento cancelado         | Todos inscritos        | Motivo + informações de reembolso    |
| Novo ingresso vendido    | Organizador (opcional) | Resumo da venda                      |

### 10.2 Boas Práticas de E-mail

```
- Usar serviço dedicado: Resend / SendGrid / Mailgun / Amazon SES
- NUNCA enviar e-mail de forma síncrona na requisição (usar fila)
- Template responsivo (funcionar no celular)
- SPF, DKIM e DMARC configurados no domínio
- Link de cancelamento de inscrição em e-mails de marketing
- Rastrear bounces e marcar e-mails inválidos
```

---

## 11. Relatórios e Dashboards

### 11.1 Painel do Organizador

```
Métricas em tempo real:
- Total de ingressos vendidos / capacidade (%)
- Receita bruta e líquida (após taxas)
- Vendas por tipo de ingresso
- Vendas por lote
- Gráfico de vendas ao longo do tempo
- Total de check-ins realizados / esperados

Exportações disponíveis:
- Lista de inscritos (CSV/Excel): nome, e-mail, tipo, status
- Relatório financeiro (CSV/Excel): pedidos, valores, formas de pagamento
- Relatório de presença (CSV/Excel): check-ins com horário
```

### 11.2 Relatório Financeiro

```
Campos obrigatórios:
- ID do pedido
- Data/hora da compra
- Nome e e-mail do comprador
- Ingressos comprados (tipo + quantidade)
- Valor bruto
- Desconto aplicado
- Taxa da plataforma
- Taxa do gateway
- Valor líquido repassado
- Forma de pagamento
- Status do pagamento
```

---

## 12. Modelo de Dados

### 12.1 Tabelas Principais

```sql
-- Eventos
eventos (
  uuid              UUID PK,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ,
  company_uuid      UUID,
  titulo            VARCHAR(300) NOT NULL,
  slug              VARCHAR(300) UNIQUE NOT NULL,
  descricao         TEXT,
  banner_url        VARCHAR(500),
  data_inicio       TIMESTAMPTZ NOT NULL,
  data_fim          TIMESTAMPTZ,
  capacidade_total  INT,
  local_nome        VARCHAR(300),
  local_endereco    VARCHAR(500),
  local_lat         DECIMAL(10,8),
  local_lng         DECIMAL(11,8),
  online            BOOLEAN DEFAULT false,
  link_online       VARCHAR(500),
  status            ENUM('rascunho','publicado','em_vendas','esgotado','encerrado','cancelado'),
)

-- Lotes
evento_lotes (
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ,
  company_uuid      UUID,
  uuid              UUID PK,
  evento_uuid       UUID FK → eventos,
  nome              VARCHAR(200) NOT NULL,      -- ex: "1º Lote"
  ordem             INT NOT NULL,               -- para ordenação
  quantidade        INT NOT NULL,
  preco             DECIMAL(10,2) NOT NULL,
  data_inicio       TIMESTAMPTZ,
  data_fim          TIMESTAMPTZ,
  ativo             BOOLEAN DEFAULT true,
)

-- Tipos de Ingresso (dentro de um lote)
evento_lote_tipos_ingresso (
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ,
  company_uuid      UUID,
  evento_uuid       UUID FK → eventos,
  lote_uuid         UUID FK → lotes,
  uuid              UUID PK,
  nome              VARCHAR(200) NOT NULL,          -- ex: "Inteira", "VIP"
  descricao         TEXT,
  quantidade        INT NOT NULL,
  vendidos          INT DEFAULT 0,
  preco             DECIMAL(10,2) NOT NULL,
  visivel           BOOLEAN DEFAULT true
)

-- Pedidos
evento_pedidos (
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ,
  company_uuid        UUID,
  evento_uuid         UUID FK → eventos,
  uuid                UUID PK,
  user_uuid           UUID FK → usuarios,
  status              ENUM('pendente','pago','cancelado','reembolsado','expirado'),
  valor_bruto         DECIMAL(10,2) NOT NULL,
  desconto            DECIMAL(10,2) DEFAULT 0,
  valor_liquido       DECIMAL(10,2) NOT NULL,
  forma_pagamento     ENUM('cartao','pix','boleto','cortesia'),
  expires_at          TIMESTAMPTZ,              -- expiração da reserva temporária
  pago_em             TIMESTAMPTZ
)

-- Ingressos
ingressos (
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ,
  company_uuid        UUID,
  evento_uuid         UUID FK → eventos,
  tipo_ingresso_uuid  UUID FK → tipos_ingresso,
  pedido_uuid         UUID FK → pedidos,
  uuid                UUID PK,
  user_uuid           UUID FK → usuarios,
  codigo              VARCHAR(20) UNIQUE NOT NULL, -- código alfanumérico legível
  assinatura          TEXT NOT NULL,       -- HMAC-SHA256
  status              ENUM('pago','usado','cancelado','transferido'),
  transferido_de      UUID FK → ingressos,         -- histórico de transferência
  checkin_em          TIMESTAMPTZ,
  checkin_operador_uuid UUID FK → usuarios
)

-- Cupons de Desconto
cupons (
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ,
  company_uuid        UUID,
  evento_uuid         UUID FK → eventos,
  tipo_ingresso_uuid  UUID,
  uuid              UUID PK,
  codigo          VARCHAR(50) UNIQUE NOT NULL,
  tipo            ENUM('percentual','fixo'),
  valor           DECIMAL(10,2) NOT NULL,
  usos_maximos    INT,
  usos_por_usuario INT DEFAULT 1,
  usos_atuais     INT DEFAULT 0,
  valido_ate      TIMESTAMPTZ,
  ativo           BOOLEAN DEFAULT true,
  criado_em       TIMESTAMPTZ DEFAULT NOW()
)

```

---

## 13. APIs e Integrações

### 13.1 Padrão de Resposta

```json
// Sucesso
{
  "success": true,
  "data": { ... },
  "meta": { "pagina": 1, "total": 100 }
}

// Erro
{
  "success": false,
  "error": {
    "code": "INGRESSO_JA_UTILIZADO",
    "message": "Este ingresso já foi utilizado às 19:32.",
    "details": { ... }
  }
}
```

---

## 14. Infraestrutura e DevOps

> Em desenvolvimento.

---

## 15. Testes

### 15.1 Estratégia de Testes

```
Unitários (70%):
- Regras de negócio isoladas (cálculo de desconto, validação de estoque)
- Geração e validação de assinatura do QR Code
- Funções utilitárias

Integração (20%):
- Fluxo de compra completo (do pedido ao ingresso)
- Processamento de webhook de pagamento
- Sincronização de check-in offline

E2E (10%):
- Jornada crítica: buscar evento → comprar ingresso → fazer check-in
- Cenário de evento esgotado
- Cancelamento e reembolso
```

### 15.2 Cenários de Teste Críticos

```
⚠️ Estes cenários DEVEM ter cobertura de teste:

1. Concorrência: dois usuários compram o último ingresso simultaneamente
   → Apenas um deve conseguir; o outro deve receber erro claro

2. Webhook duplicado: mesmo webhook de pagamento chega duas vezes
   → Ingresso deve ser gerado apenas uma vez

3. Check-in duplicado: mesmo QR Code lido duas vezes (offline + online)
   → Segundo check-in deve ser rejeitado na sincronização

4. Reserva expirada: usuário tenta pagar após expiração da reserva
   → Sistema deve verificar disponibilidade e rejeitar se não houver vagas

5. Cupom no limite: último uso de cupom por dois usuários simultaneamente
   → Apenas um deve conseguir aplicar
```

---

## 16. Roadmap e Status

### MVP (versão mínima viável)

- [ ] Cadastro e autenticação de usuários
- [ ] Criação de eventos com um tipo de ingresso
- [ ] Fluxo de compra com PIX (via Mercado Pago)
- [ ] Geração de ingresso com QR Code
- [ ] Envio de e-mail com ingresso em PDF
- [ ] Check-in via QR Code (online)
- [ ] Painel básico do organizador (vendas + lista de inscritos)

### V1.1

- [ ] Múltiplos lotes
- [ ] Múltiplos tipos de ingresso
- [ ] Cartão de crédito
- [ ] Cupons de desconto
- [ ] Transferência de ingresso

### V1.2

- [ ] Check-in offline
- [ ] Múltiplos operadores de portaria
- [ ] Relatórios avançados + exportação
- [ ] Reembolso automático via gateway

### V2.0

- [ ] Multi-tenant (vários organizadores na plataforma)
- [ ] Split de pagamento
- [ ] App mobile (operador de portaria)
- [ ] Integração com calendários (Google Calendar, etc.)
- [ ] Lista de espera

---

## 17. Decisões Técnicas Registradas (ADRs)

> Use este formato para documentar decisões importantes.  
> ADR = Architecture Decision Record

### ADR-001: [Título da decisão]

```
Data: YYYY-MM-DD
Status: Proposta | Aceita | Deprecada | Substituída por ADR-XXX

Contexto:
[Descreva o problema ou situação que gerou esta decisão]

Decisão:
[O que foi decidido]

Consequências:
[Prós e contras da decisão tomada]
```

---

_Documento criado em: [data]_  
_Última atualização: [data]_  
_Responsável: [nome/equipe]_

> 💡 **Dica para uso com IA:** Ao iniciar uma sessão de desenvolvimento, cole este documento ou o trecho relevante no contexto e diga: _"Estou implementando o módulo X deste sistema. Siga as convenções e regras de negócio definidas neste documento."_
