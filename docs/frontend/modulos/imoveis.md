# Imóveis (frontend)

- HTTP + tipos: `src/@modules/imoveis/` — `pessoa.http.ts`, `imovel.http.ts`, `contrato.http.ts`,
  `painel.http.ts`
- Service: `pages/imoveis/imoveis.service.ts` — CRUD com loading/notify de sucesso e as listas de
  opções (`PESSOA_TIPOS`, `PAPEIS`, `IMOVEL_TIPOS`, `IMOVEL_FINALIDADES`, `IMOVEL_SITUACOES`,
  `INDICES_REAJUSTE`, `GARANTIA_TIPOS`…) e formatadores (`formatarMoeda`, `formatarData`, `labelIndice`…)
- Boot: `boot/imoveis.boot.ts` → `provide("pessoaHttp" | "imovelHttp" | "contratoHttp" | "painelHttp")`
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

`pessoaForm.vue`, `imovelForm.vue` e `contratoForm.vue` seguem o padrão do projeto
(`novo<X>Form()` / `<x>FormParaInput()`, vazio → `null`).

## Menu por módulo

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
- Dev: `quasar prepare` e `vue-tsc` exigem **Node ≥ 22.22** (requisito do `@quasar/app-vite`).
