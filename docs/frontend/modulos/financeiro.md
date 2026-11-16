# Financeiro (frontend)

- HTTP: `src/@modules/financeiro/contaBancaria.http.ts`, `cobranca.http.ts`, `pagamento.http.ts`,
  `cartao.http.ts`
- Services: `pages/financeiro/<recurso>/<recurso>.service.ts`
- Boot: `boot/financeiro.boot.ts`
- Backend: [financeiro](../../backend/modulos/financeiro.md)

## Telas (admin)

| Rota | Arquivo | Ações |
|---|---|---|
| `financeiro.contas-bancarias` | `contaBancaria/contaBancariaListar.vue` | lista/filtra contas |
| `financeiro.contas-bancarias.criar` / `.detalhe` | `contaBancariaIncluir.vue` / `contaBancariaEditar.vue` | banco, agência, conta, **chave da API Asaas**, status, ambiente (`HOMOLOG`/`PROD`) |
| `financeiro.cobrancas` | `cobranca/cobrancaListar.vue` | cobranças com as parcelas expandidas |
| `financeiro.pagamentos` | `pagamento/pagamentoListar.vue` | verificar pagamento no gateway, verificar período, gerar/regerar boleto com novo vencimento, baixa manual, enviar aviso de vencimento (um ou vários) |

## Cartão de crédito (participante)

Usado no portal de eventos (`pages/portalEventos/pedido/StepPagamentoCartao.vue`):
`cartao.http.ts` → `POST cartao-credito` (tokeniza no Asaas) e `DELETE cartao-credito/:uuid`.
Os cartões salvos chegam por `auth/me` (`user.cartoes`, só os 4 últimos dígitos). O backend exige
telefone, CEP, endereço, bairro, cidade e UF do usuário antes de aceitar o cartão.

## Status

Pagamentos podem vir com status interno (`pendente`, `pago`) ou do Asaas (`PENDING`,
`CONFIRMED`, `RECEIVED`…). Mapeie os dois ao exibir chips/cores.
