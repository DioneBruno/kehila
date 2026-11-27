# Imóveis (frontend)

- HTTP + tipos: `src/@modules/imoveis/` — `pessoa.http.ts`, `imovel.http.ts`, `contrato.http.ts`,
  `painel.http.ts`, `conta.http.ts` (contas, agenda, pagamento, anexos)
- Service: `pages/imoveis/imoveis.service.ts` — CRUD com loading/notify de sucesso e as listas de
  opções (`PESSOA_TIPOS`, `PAPEIS`, `IMOVEL_TIPOS`, `IMOVEL_FINALIDADES`, `IMOVEL_SITUACOES`,
  `INDICES_REAJUSTE`, `GARANTIA_TIPOS`, `CONTA_TIPOS`…) e formatadores (`formatarMoeda`, `formatarData`, `labelIndice`, `labelConta`, `labelContaSituacao`…) e os métodos de contas (listar, agenda, pagar, anexos)
- Boot: `boot/imoveis.boot.ts` → `provide("pessoaHttp" | "imovelHttp" | "contratoHttp" | "painelHttp" | "contaHttp")`
  (registrado em `quasar.config.ts`)
- Backend: [imóveis](../../backend/modulos/imoveis.md)

## Telas

| Rota | Arquivo | Conteúdo |
|---|---|---|
| `imoveis.painel` (`/imoveis`) | `painel.vue` | cards (vencidos, 0–30, 31–60, 61–90, reajustes no mês, livres); clicar no card troca a lista abaixo |
| `imoveis.proprietarios` / `imoveis.inquilinos` | `pessoaListar.vue` | mesma tela; o papel vem de `route.meta.papel`; busca e paginação |
| `imoveis.pessoas.criar` | `pessoaIncluir.vue` + `pessoaForm.vue` | cadastro (`?papel=` pré-marca o papel) |
| `imoveis.pessoas.detalhe` | `pessoaEditar.vue` | edição e exclusão |
| `imoveis.imoveis` | `imovelListar.vue` | lista com filtros de situação e busca |
| `imoveis.imoveis.criar` / `.detalhe` | `imovelIncluir.vue` / `imovelEditar.vue` + `imovelForm.vue` | dados do imóvel, contrato vigente (ver/novo contrato), excluir |
| `imoveis.contratos` | `contratoListar.vue` | lista com filtro de status e busca |
| `imoveis.contratos.criar` | `contratoIncluir.vue` + `contratoForm.vue` | novo contrato (aceita imóvel pré-selecionado) |
| `imoveis.contratos.detalhe` | `contratoDetalhe.vue` + `contratoEventoDialog.vue` | dados vigentes, edição dos campos permitidos, histórico e ações **Renovar / Aditivo / Encerrar / Rescindir** |
| `imoveis.agenda` (`/imoveis/agenda`) | `agenda.vue` | três cards (**Vencidas**, **Próximos 7 dias**, **8–30 dias**) com contagem e soma; filtros de proprietário, imóvel e tipo; lista do grupo selecionado com ação rápida **Pagar** (`contaPagamentoDialog.vue`, data e valor pago, padrão hoje e valor da conta). Grupo com mais de 50 contas avisa "mostrando 50 de N" e leva a Contas já filtrada por período e situação |
| `imoveis.contas` (`/imoveis/contas`) | `contaListar.vue` | lista com os filtros da API (tipo, categoria, proprietário, imóvel, situação, responsável, período, busca), totais do filtro (`totalValor`/`totalPago`) e paginação; lê os filtros da query da rota |
| `imoveis.contas.criar` | `contaIncluir.vue` + `contaForm.vue` | nova conta ou **gerar em parcelas**; aceita `?imovelUuid=` e `?contratoUuid=` pré-preenchidos |
| `imoveis.contas.detalhe` | `contaEditar.vue` + `contaForm.vue` | dados e situação, edição, pagamento (registrar/desfazer), anexos, links para as outras parcelas do grupo, exclusão (admin) |

**Formulário da conta** (`contaForm.vue`): tipo → categoria (e esfera, se guia; a categoria pré-preenche a
esfera: carnê-leão/DARF/DAS/GPS federal, ITCMD estadual, ISS/ITBI municipal, trocável) → imóvel
(opcional) → contrato (pré-preenchido com o vigente do imóvel; trocável por um anterior ou vazio) →
proprietário (vem do imóvel e fica travado; livre sem imóvel) → quem paga → vencimento, valor,
competência (campo `type="month"`), fornecedor, nº do documento, observações. Opções "já está paga" e
"gerar em parcelas" (quantidade, primeiro vencimento e valor da parcela no lugar de vencimento/valor).

**Anexos** (detalhe da conta): envio com tipo `documento` ou `comprovante` (PDF/PNG/JPG, até 10 MB; o
erro de tamanho/formato vem da API), abrir (URL assinada de 5 min) e remover.

**Componente `components/ContasDoVinculo.vue`:** bloco "Contas" usado em `imovelEditar.vue`
(`imovelUuid`) e `contratoDetalhe.vue` (`contratoUuid` + `imovelUuidDoContrato`). Lista até 20 contas
com situação, botão **Nova conta** (já com imóvel/contrato) e **Ver todas (N)** que abre a lista de
Contas filtrada.

**Painel:** o card "Contas vencidas (N)" (`contasVencidas`) abre a agenda; os demais cards continuam
trocando a lista abaixo.

`pessoaForm.vue`, `imovelForm.vue` e `contratoForm.vue` seguem o padrão do projeto
(`novo<X>Form()` / `<x>FormParaInput()`, vazio → `null`).

## Menu por módulo

O menu IMÓVEIS fica: Painel · **Agenda** · Proprietários · Imóveis · Contratos · **Contas** · Inquilinos.

`layouts/menu.ts` define `MENU_ITEMS` (cada item pode ter `modulo: "igreja" | "imoveis"`) e
`filtrarMenu(itens, modulos, isAdmin, isInterno)`:

- `modulo: "imoveis"` → visível se a empresa tem `imoveis` **e** o usuário é interno (qualquer perfil
  interno, não só admin);
- `modulo: "igreja"` → visível se a empresa tem `igreja` **e** o usuário é admin;
- itens sem módulo (Minha Empresa, Usuários, Notificações) → admin; `home` → todos;
- seções sem itens visíveis somem.

Os módulos vêm de `token.company.modulos` (JWT; ausente → `["igreja"]`). `MainLayout.vue` também
escolhe a barra de navegação inferior (mobile) conforme o módulo, e `pages/home.vue` redireciona
empresa sem `igreja` mas com `imoveis` para `imoveis.painel`.

## Atenção

- O menu muda só depois de **novo login** (o módulo vem do token) — ver o aviso de cache em
  [backend › imóveis](../../backend/modulos/imoveis.md#módulos-por-empresa-habilitar-o-módulo).
- `situacao = alugado` não é editável na tela: é definida pelo contrato. Valor e data de fim do
  contrato só mudam por Renovar/Aditivo.
- Contas: o proprietário vem do imóvel (travado no formulário). O filtro `contratoUuid` vindo de
  "Ver todas" vale na lista mas **não tem chip visível** na tela Contas. A competência usa
  `<input type="month">`, que no Firefox desktop vira campo de texto (digitar `AAAA-MM`). A agenda
  não descarta resposta atrasada se os filtros mudarem rápido. Ver
  [pendências](../../pendencias.md#imóveis--contas).
- Dev: `quasar prepare` e `vue-tsc` exigem **Node ≥ 22.22** (requisito do `@quasar/app-vite`).
