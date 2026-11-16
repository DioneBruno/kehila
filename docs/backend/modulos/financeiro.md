# Módulo Financeiro (backend)

> Contas bancárias (credenciais do gateway **Asaas**), cobranças e suas parcelas
> (pagamentos), boleto, cartão de crédito tokenizado, baixa manual, verificação automática de
> pagamento e aviso de vencimento por e-mail.

- Código: `backend/src/@modules/financeiro/`
- HTTP: `backend/src/http/financeiro/` — `ContasBancariasController` (`/contas-bancarias`),
  `CobrancasController` (`/cobrancas`), `PagamentosController` (`/pagamentos`),
  `CartaoCreditoController` (`/cartao-credito`) e `PagamentoService` (cron)
- Migrations: `backend/src/@infra/database/migrations/financeiro/`
- Frontend: [frontend › financeiro](../../frontend/modulos/financeiro.md)

## Acesso

- `/cartao-credito`: só `JwtAuthMiddleware` (o próprio usuário, ex.: comprador no portal de eventos).
- Demais rotas: `JwtAuthMiddleware` + `AdminMiddleware`.

## Modelo de dados

```
financeiro_contas_bancarias  (nome, banco_numero, agência/conta/dígito, chave_api, status, ambiente HOMOLOG|PROD)
financeiro_cobrancas         (user_uuid, origem_tipo, origem_uuid, pagador_*, valor, banco_ref = installment Asaas, pagamentos_quantidade, status)
  1 ── n financeiro_pagamentos  (cobanca_uuid ← sic, forma_pagamento, vencimento, valor, valor_com_desc_gateway,
                                 valor_pago, pago_em, status, banco_ref = payment id Asaas, link_boleto, pix,
                                 pago_manual_*)
  1 ── n financeiro_pagamento_notificacoes (tipo 'email', data_envio)
financeiro_cartao_credito    (user_uuid, conta_bancaria_uuid, numero (últimos dígitos), bandeira, token, status, atual)
```

- Coluna com typo: **`cobanca_uuid`** (não `cobranca_uuid`). Use exatamente assim.
- **Origem** (`origem_tipo` + `origem_uuid`) liga a cobrança a quem a gerou — hoje o único
  produtor é o portal de eventos (pedido).
- Status de pagamento convivem em dois vocabulários: interno (`pendente`, `pago`) e Asaas
  (`PENDING`, `CONFIRMED`, `RECEIVED`…). Ao filtrar, considere ambos.

## Gateway Asaas

Todas as chamadas seguem o mesmo padrão (duplicado em cada `*Gateway.asaas.ts`):

1. `buscarToken`: pega **a primeira** conta `status = 'ativo'` da empresa → `chave_api` e
   `ambiente` (`PROD` → `api.asaas.com`, senão `api-sandbox.asaas.com`).
2. `buscarCliente`: `GET /v3/customers?cpfCnpj=` ou cria (`POST /v3/customers`).
3. Chamada da operação com header `access_token`.

HTTP via `connectionHub.http` (instância axios). Erros do Asaas são logados em
`error.response.data`.

## Casos de uso

| Use case | Disparo | Resumo |
|---|---|---|
| `contaBancaria/*` (criar, listar, detalhar, editar, deletar) | `/contas-bancarias` | CRUD com paginação/busca por nome. `chave_api` **não** é devolvida no detalhe/lista |
| `GerarCobrancaUsecase` | chamado por `portalEventos/pedidos/gerarCobranca` | Cria cobrança + pagamentos no Asaas e no banco |
| `ListarCobrancaUsecase` | `GET /cobrancas` | Paginado; agrega as parcelas de cada cobrança |
| `ListaPagamentoUsecase` | `GET /pagamentos` | Paginado; busca pelo nome do pagador |
| `GerarBoletoPagamentoUsecase` | `POST /pagamentos/:uuid/gerarBoleto` | (Re)gera boleto de uma parcela com novo `vencimento` (≥ hoje) |
| `InformarPagamentoManualUsecase` | `POST /pagamentos/:uuid/informarPagamentoManual` | Baixa manual: exige descrição; `valorPago ≥ valor`; grava `forma_pagamento = 'manual'` e `pago_manual_*` |
| `VerificarPagamentoUsecase` | `POST /pagamentos/:uuid/verificarPagamento` | Consulta `GET /v3/lean/payments/:id`; se `RECEIVED`, marca `pago` e envia e-mail de confirmação |
| `VerificarPagamentoPeriodoUsecase` | cron (2h) | Lista no Asaas os `RECEIVED` de ontem→hoje (paginado de 100) e verifica cada um |
| `FinanceiroQuery.verificarPagamentoPeriodo` | `POST /pagamentos/verificarPagamentoPeriodo` | Verifica, um a um, todos os pagamentos com vencimento no intervalo |
| `NotificarVencimentoPagamentoUsecase` | cron (2h da manhã) e `POST /pagamentos/notificarVencimento` | E-mail de aviso; pula quem já foi notificado (salvo `forcarEnvio`) |
| `IncluirCartaoCreditoUsecase` | `POST /cartao-credito` | Tokeniza no Asaas (`/v3/creditCard/tokenizeCreditCard`) e salva token + bandeira |
| `FinanceiroQuery.removerCartaoCredito` | `DELETE /cartao-credito/:uuid` | Soft delete do cartão do próprio usuário |

### Gerar cobrança (detalhe)

- **Boleto**: `POST /v3/payments` parcelado (`installmentCount`, `totalValue`) com
  vencimento **sempre amanhã** (o `vencimento` do input é ignorado). Depois busca as parcelas
  (`/v3/installments/:id/payments`) e grava uma linha em `financeiro_pagamentos` por parcela.
- **Cartão**: cobra **só a primeira parcela** agora, com acréscimo de
  `valorParcela × 1,0299 + 0,49` (repasse da taxa). Precisa voltar `CONFIRMED`, senão 400. As
  demais parcelas são gravadas como `pendente` com vencimento mensal (`addMonth`) e a última
  absorve o arredondamento. O cartão usado vira `atual = true`.
- Nada disso é transacional: se o `INSERT` falhar depois da cobrança no Asaas, a cobrança
  fica órfã no gateway.

### Cron (`http/financeiro/pagamento.service.ts`)

| Expressão | Ação |
|---|---|
| `EVERY_2_HOURS` | `verificarPagamentosCompanies()` — só roda se `VERIFICAR_PAGAMENTOS_COMPANIES=true` |
| `EVERY_DAY_AT_2AM` | aviso de vencimento para pagamentos que vencem em **5 dias** |
| 10s, 1min, 10min, 30min, 1h | métodos vazios (ganchos) |

O cron roda em **todas** as instâncias do backend; com mais de uma réplica, e-mails podem ser
enviados em dobro.

## Variáveis de ambiente

`VERIFICAR_PAGAMENTOS_COMPANIES`. As credenciais do Asaas ficam no banco
(`financeiro_contas_bancarias.chave_api`), por empresa.

## Atenção

- `chave_api` é gravada em texto puro.
- O número completo e o CVV do cartão passam pelo backend antes da tokenização (escopo PCI);
  só o retorno do Asaas é persistido.
- `IncluirCartaoCreditoRepository.buscarContaBancaria` não filtra `deleted_at` nem `status`.
- `VerificarPagamentoPeriodoRepository.verificarPagamento` busca `banco_ref` sem filtrar
  empresa (o use case seguinte filtra, então o efeito é só "não encontrado").
- `GerarBoletoPagamentoUsecase` responde 450 quando o pagamento não existe (código HTTP fora do padrão).
- Duas migrations com o mesmo timestamp `1781222400001`.
- A migration de `financeiro_pagamentos` quebra em banco novo ("multiple primary keys") —
  ver [arquitetura › banco](../arquitetura.md#banco-de-dados-e-migrations).
