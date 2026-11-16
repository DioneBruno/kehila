# Portal de Eventos (frontend)

- HTTP: `src/@modules/portalEventos/eventos.http.ts`, `lotes.http.ts`, `pedido.http.ts`
- Store: `src/stores/pedido.ts` (`usePedidoStore`: evento carregado, itens do carrinho,
  ingressos, etapa do wizard)
- Boot: `boot/portalEventos.boot.ts`
- Backend: [portalEventos](../../backend/modulos/portalEventos.md)

## Painel do organizador (admin)

| Rota | Arquivo | Conteúdo |
|---|---|---|
| `eventos` | `pages/portalEventos/eventos/eventoListar.vue` | lista por status/busca |
| `eventos.criar` | `eventoIncluir.vue` | dados básicos, local/online, descrição (Quill) |
| `eventos.detalhe` | `eventoEditar.vue` | edição + publicar/cancelar/encerrar; data limite de pagamento; contato de suporte |
| `eventos.lotes` | `loteListar.vue` | lotes e tipos de ingresso com arrastar-e-soltar (`vue-draggable-next`) para reordenar |

`eventoFormulario.vue` (construtor do formulário de inscrição) está **desabilitado** no botão;
os campos extras do ingresso hoje são fixos no `StepIngressoForm.vue` (data de nascimento,
distrito, deficiência/restrição).

## Página pública de compra (`/publico/eventos/:eventoUuid`)

`pages/portalEventos/pedido/home.vue` — `BlankLayout`, abas **Ingressos** e **Meus pedidos**
(`?tab=pedidos`). Wizard `q-stepper` controlado por `pedido.etapa`:

| Etapa | Componente | O que faz |
|---|---|---|
| 1 | `StepIngressos.vue` | descrição do evento (`sanitizeHtml`), lotes e tipos; monta itens no store |
| 2 | `StepSeusDados.vue` + `LoginCadastro.vue` | login por código ou cadastro rápido |
| 3 | `StepResumo.vue` | confirma e chama `pedidos/criar` |
| 4 | `StepIngressoForm.vue` | carrossel com um formulário por ingresso (`editar-form-ingresso`); permite copiar dados do primeiro |
| 5 | `StepPagamento.vue` → `StepPagamentoBoleto.vue` / `StepPagamentoCartao.vue` | tipo de pagador (`usuarioLogado`, `ingresso`, `avulso`), parcelas, cartão salvo/novo → `pedidos/gerarCobranca` |
| 6 | `StepCobranca.vue` | boletos/links e status das parcelas |

`pedidos.vue` lista os pedidos do usuário no evento; abrir um pedido chama
`usePedidoStore().setPedido(...)`, que pula direto para a etapa 4 (sem cobrança) ou 6
(com cobrança). Cabeçalho e resumo lateral: `cabecalho.vue`, `resumo.vue`. Botões flutuantes de
WhatsApp/e-mail usam `evento.suporteTelefone`/`suporteEmail`.

O interceptor não redireciona para login em URLs com `publico`.
