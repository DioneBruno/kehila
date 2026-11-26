# Admin — aba Usuários na edição de empresa — design (curto)

Data: 2026-11-26 · Tamanho: mudança pequena · Base: [módulo Admin](2026-11-25-modulo-admin-empresas-design.md)

## Intenção

A empresa-admin precisa gerenciar os usuários de **qualquer** empresa (incluir, editar, trocar
senha, remover) sem depender do admin daquela empresa nem de SQL.

## Objetivos, não-objetivos, anti-objetivos

- **Objetivo:** aba **Usuários** em `admin/empresas/:uuid` com lista (busca, paginação), incluir,
  editar (dados, cargo, ativo, nova senha) e remover.
- **Não-objetivo:** mexer em membresia, endereço/estado civil/meta (ficam na tela "Usuários" da
  própria empresa), impersonar usuário, invalidar JWT já emitido.
- **Anti-objetivo:** deixar uma empresa sem admin; usuário removido continuar entrando.

## Decisões do usuário

- **Opção 2:** pelo Admin, a empresa-admin pode trocar senha, e-mail, CPF e telefone mesmo de
  usuário que também acessa outras empresas. A tela avisa quais outras empresas ele acessa.
  A proteção atual continua valendo em `/usuarios` (tela de cada empresa).
- Bloquear remover/rebaixar o **último admin** — valendo também em `/usuarios`.

## Abordagens

| | Abordagem | | |
|---|---|---|---|
| **A** | Reusar os use cases de `@modules/usuario` com a empresa vinda do path (`/admin/empresas/:uuid/usuarios`), como os domínios | Sem duplicação | **Escolhida** |
| B | Use cases próprios do Admin | Duplica regras de usuário | — |
| C | Frontend chamar `/usuarios` | Impossível: empresa vem do token | — |

## Design

### Backend
- Rotas sob `/admin/empresas/:uuid/usuarios` (mesmos middlewares do Admin: JWT + Admin +
  ModuloAdmin; `garantirEmpresa(:uuid)`; `garantirUuid(:usuarioUuid, "Usuário não encontrado")`):
  `GET` (lista: `busca`, `pagina`, `porPagina`), `GET /:usuarioUuid`, `POST`, `PUT /:usuarioUuid`,
  `DELETE /:usuarioUuid`. Respostas `{ success, data, meta? }` iguais às de `/usuarios`.
- `EditarUsuarioUsecase` ganha `permitirAlterarAcessoCompartilhado?: boolean` (padrão `false`);
  só o controller do Admin passa `true`.
- Detalhe no Admin inclui `outrasEmpresas: { uuid, name }[]` (vínculos ativos em empresas não
  deletadas, exceto a alvo).
- **Último admin** (em `EditarUsuarioUsecase` e `DeletarUsuarioUsecase`, logo valendo nas duas
  telas): se o usuário é admin ativo da empresa e a operação o remove, muda `position` para algo
  ≠ `admin` ou define `isAccepted: false`, e não há **outro** admin ativo → 400
  `"A empresa precisa de pelo menos um administrador"`. Admin ativo = vínculo com
  `position = 'admin'`, `is_accepted = true`, `deleted_at IS NULL`, usuário não deletado.
- `DeletarUsuario` mantém "não pode remover o próprio acesso" (`usuarioLogadoUuid = req.userUuid`).
- **Correção de segurança (decisão do construtor, relatada ao usuário):** login por senha
  (`tokenGenerateRepository`), por código (`generateTokenAuthenticationRandomCodeRepository`) e a
  montagem do token (`generateTokenAuthenticationUserRepository`) passam a exigir
  `uc.deleted_at IS NULL`. Hoje um usuário removido continua entrando. Token já emitido segue
  válido até expirar (8h) — limitação conhecida.

### Frontend
- `empresaEditar.vue` ganha a aba **Usuários** (componente próprio `pages/admin/empresaUsuarios.vue`):
  busca, `q-table` paginada no servidor (nome, e-mail, cargo, ativo, ações editar/remover),
  botão "Novo usuário".
- Incluir/editar em `q-dialog` (`pages/admin/empresaUsuarioDialog.vue`): nome, e-mail, CPF,
  telefone, cargo (`admin`/`usuario`), ativo, senha (obrigatória ao incluir; "nova senha"
  opcional ao editar, com mostrar/ocultar). Se `outrasEmpresas` não vazio: banner
  `"Também acessa: <nomes>. Senha, e-mail, CPF e telefone mudam lá também."`.
- Remover com diálogo de confirmação.
- `AdminEmpresaHttp`/`AdminEmpresaService` ganham os métodos de usuários.

### Docs
`docs/backend/modulos/admin.md`, `docs/backend/modulos/usuario.md` (último admin, override do
Admin, login exige vínculo ativo), `docs/frontend/modulos/admin.md`, `docs/pendencias.md`.

## Deixado ao construtor
Nomes internos, layout fino seguindo `pages/usuario/*` e as abas existentes.
