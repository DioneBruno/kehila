# Módulo Portal de Eventos (backend)

> Eventos com inscrição/bilheteria: cadastro do evento, lotes e tipos de ingresso, pedido
> do participante, geração de cobrança (via Financeiro), preenchimento do formulário de cada
> ingresso e listas públicas de inscritos.

- Código: `backend/src/@modules/portalEventos/`
- Documento de visão/produto (longo, com roadmap e regras desejadas):
  [`PROJETO_BILHETERIA.md`](../../../backend/src/@modules/portalEventos/PROJETO_BILHETERIA.md).
  Ele descreve o **alvo**; esta página descreve o que **está implementado**.
- HTTP: `backend/src/http/portalEventos/`
- Migrations: `backend/src/@infra/database/migrations/portalEventos/`
- Frontend: [frontend › portalEventos](../../frontend/modulos/portalEventos.md)

## Controllers e acesso

| Controller | Base | Middleware | Quem usa |
|---|---|---|---|
| `EventosController` | `/eventos` | JWT + Admin | painel do organizador |
| `LotesController` | `/lotes` | JWT + Admin | painel do organizador |
| `PedidosController` | `/pedidos` | JWT | participante logado (e admin) |
| `PublicoController` | `/publico/eventos` | `DominioMiddleware` | página pública do evento |

Quase todas as rotas de leitura de pedidos/público são `POST` (histórico do projeto).

## Modelo de dados

```
eventos (titulo, slug único, datas, capacidade_total, local_*, online/link_online, status,
         form_campos, data_limite_pagamento, suporte_email/telefone)
  1 ── n evento_lotes (nome, ordem, quantidade, preco, data_inicio/fim, ativo)
           1 ── n evento_lote_tipos_ingresso (nome, descricao, quantidade, preco, visivel, ordem,
                                              gerar_quantidade_ingressos)
  1 ── n evento_pedidos (user_uuid, idempotency_key, status, valor_bruto/desconto/liquido)
           1 ── n evento_ingressos (tipo_ingresso_uuid, codigo, pessoa_* (nome, documento, email,
                                    telefone, pais, uf, cidade), form_data, status, checkin_*)
evento_cupons  (criada, ainda sem uso no código)
```

### Status do evento

`rascunho → publicado` (publicar) · `rascunho|publicado|em_vendas → cancelado` ·
`publicado|em_vendas → encerrado`. Editável só em `rascunho`/`publicado`.
`em_vendas` e `esgotado` existem na lista de filtros mas **nenhuma transição chega neles**.

### Status do pedido

`pendente` (criado) → `pagamento_gerado` (cobrança emitida) / `cancelado` (só a partir de
`pendente`, só o dono). `pago` é considerado nas listas, mas nada no código grava esse status
no pedido — o pagamento é acompanhado em `financeiro_pagamentos`.

## Fluxo do participante

1. **Cadastro público** `POST /publico/eventos/novo-usuario` (`CadastrandoUsuarioUsecase`): CPF
   válido obrigatório; cria `auth_users` + vínculo com role `usuario-externo` e **já devolve um
   token**.
2. **Ver evento** `POST /publico/eventos/:eventoUuid` → evento, lotes e tipos `visivel` com
   quantidade vendida.
3. **Criar pedido** `POST /pedidos/criar` `{ eventoUuid, pedido: [{ tipoIngressoUuid, quantidade }] }`
   - `EventoEntity.montaPedido`: tipo precisa ser do evento; quantidade inteira ≥ 1; soma as
     linhas repetidas do mesmo tipo antes de checar vaga; `quantidade = 0` no tipo = ilimitado.
   - Preço vem do **tipo de ingresso** (o `preco` do lote não entra no cálculo).
   - `gerar_quantidade_ingressos > 1` gera N ingressos por unidade comprada (ex.: pacote família).
   - Cada ingresso recebe `codigo` de 20 caracteres.
4. **Preencher ingressos** `POST /pedidos/:pedidoUuid/editar-form-ingresso` — dados da pessoa e
   `form_data`; CPF/CNPJ válido e sem repetir no mesmo pedido. Dono do pedido ou admin.
5. **Gerar cobrança** `POST /pedidos/gerarCobranca` (`GerarCobrancaUsecase` do portal):
   - só o dono do pedido;
   - respeita `data_limite_pagamento` (não passou; parcelas ≤ meses até o limite);
   - `tipoPagador`:
     - `usuarioLogado` → pagador = usuário do pedido;
     - `avulso` → dados informados no body;
     - `ingresso` → **uma cobrança por ingresso**, pagador = pessoa do ingresso, valor =
       `preco / gerar_quantidade_ingressos`, sempre boleto;
   - delega para `financeiro/gerarCobranca` com `origem = eventoPedido | eventoIngresso`;
   - marca o pedido como `pagamento_gerado`.
6. **Acompanhar** `POST /pedidos/listar` (meus pedidos no evento) e `POST /pedidos/:uuid`
   (detalhe com ingressos, cobranças e parcelas pagas).

## Painel do organizador

| Rota | Use case | Regras |
|---|---|---|
| `POST /eventos` | `CriarEventoUsecase` | título e `dataInicio` obrigatórios; online exige link; `slug` gerado do título, com sufixo `-2`, `-3`… se já existir |
| `GET /eventos` | `ListarEventosUsecase` | filtro por status/busca, paginado |
| `GET /eventos/:uuid` | `DetalharEventoUsecase` | |
| `PUT /eventos/:uuid` | `EditarEventoUsecase` | só `rascunho`/`publicado` |
| `PATCH /eventos/:uuid/publicar\|cancelar\|encerrar` | `AtualizarStatusEventoUsecase` | tabela `TRANSICOES` |
| `POST/GET/PUT/DELETE /lotes` | `CriarLote`, `ListarLotes`, `EditarLote`, `RemoverLote` | não reduz quantidade abaixo do vendido; não remove lote com vendas |
| `PUT /lotes/reordenar` | `ReordenarLotesUsecase` | rota estática declarada antes de `:uuid` |
| `/lotes/:loteUuid/tipos-ingresso[...]` | `CriarTipoIngresso`, `EditarTipoIngresso`, `RemoverTipoIngresso`, `ReordenarTiposIngresso` | mesmas proteções de "já vendido" |

## Listas públicas de inscritos

`POST /publico/eventos/:eventoUuid/inscritos` (10 por página, busca por nome/e-mail/documento) e
agregações `/inscritos/cidade`, `/uf`, `/distrito` (`form_data->>'distrito'`). Só ingressos de
pedidos `pago`/`pagamento_gerado` com nome e documento preenchidos. Nome, documento, e-mail e
telefone saem **mascarados** (`ApiString.ocultar*`).

## Atenção (riscos conhecidos)

- **Estoque sem trava:** a contagem de vendidos e os `INSERT` do pedido não estão em transação
  nem usam lock; compras simultâneas podem passar do limite. Ingressos de pedidos **cancelados**
  continuam contando como vendidos (não são soft-deletados).
- **Pedido não valida evento**: não checa status do evento, `ativo`/datas do lote, nem empresa
  na busca do evento (`buscaEvento`, `buscarEvento` público filtram só por uuid).
- **Cobrança duplicada:** `gerarCobranca` não verifica se o pedido já está `pagamento_gerado`.
- **Cadastro público** devolve token sem confirmar posse do CPF/e-mail.
- Busca pública por documento (`ILIKE`) permite descobrir se um CPF está inscrito.
- `editarFormIngresso` usa `throw new Error` em dois pontos → vira 500 em vez de 400.
- Mensagens de erro trocadas em `criarLote` (preço negativo diz "data de início…"; "Quantidade
  permitida").
- `evento_cupons`, check-in, transferência e QR Code estão só no documento de projeto.
