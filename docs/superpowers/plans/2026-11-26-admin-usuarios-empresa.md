# Admin — aba Usuários Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A empresa-admin gerencia os usuários de qualquer empresa por uma aba na edição de empresa.

**Architecture:** Reusa os use cases de `@modules/usuario` com a empresa vinda do path em `/admin/empresas/:uuid/usuarios`. Regras novas (último admin, override de dados de acesso, vínculo ativo no login) entram nos use cases/repositórios existentes. Frontend: componente de aba + diálogo.

**Tech Stack:** NestJS 11, SQL cru (TypeORM DataSource), Postgres, Jest + @swc/jest; Vue 3 + Quasar.

**Spec:** `docs/superpowers/specs/2026-11-26-admin-usuarios-empresa-design.md`

## Global Constraints

- Mensagem do último admin: `"A empresa precisa de pelo menos um administrador"` (400).
- Admin ativo = vínculo `position = 'admin'`, `is_accepted = true`, `deleted_at IS NULL`, usuário `deleted_at IS NULL`.
- `permitirAlterarAcessoCompartilhado` padrão `false`; só o controller do Admin passa `true`.
- Erros de negócio com `ApiError`; respostas `{ success, data, meta? }`; inputs montados campo a campo.
- Testes com banco só no `kehila` (container `kehila-database`); nunca `flow-*`, `start-*`, `one-*`. Usar uuids de teste próprios e limpar só eles.
- Frontend com Node 22: `export PATH=~/.nvm/versions/node/v22.22.3/bin:$PATH`. `vue-tsc` tem 32 erros pré-existentes em arquivos fora deste trabalho; o critério é zero erro nos arquivos tocados.

## Review Focus

1. Rebaixar o último admin por `isAccepted: false` (não só por `position`) → bloqueado. Teste na Task 1.
2. Usuário removido tentando logar por senha ou por código → não acha o usuário (401/erro de login atual). Teste na Task 2.
3. Admin editando a si mesmo como único admin da empresa-admin (mudar cargo) → bloqueado pela regra do último admin. Coberto pelo teste da Task 1.
4. `PUT` com `position` igual a `admin` num admin existente (sem mudança real) → permitido. Teste na Task 1.
5. Detalhar usuário de outra empresa pelo `:usuarioUuid` errado (usuário existe, mas não na empresa alvo) → 404. Teste na Task 3.

---

### Task 1: Último admin e override de dados de acesso

**Files:**
- Modify: `backend/src/@modules/usuario/editarUsuario/editarUsuario.usecase.ts`, `editarUsuarioRepository.ts`
- Modify: `backend/src/@modules/usuario/deletarUsuario/deletarUsuario.usecase.ts`, `deletarUsuarioRepository.ts`
- Create: `backend/src/@modules/usuario/ultimoAdmin.ts`
- Test: `backend/src/@modules/usuario/__test__/ultimoAdmin.test.ts` (repos falsos)

**Interfaces:**
- Produces:
  - `MSG_ULTIMO_ADMIN` (texto das Global Constraints).
  - `interface UltimoAdminRepo { ehAdminAtivo(companyUuid: string, usuarioUuid: string): Promise<boolean>; contarOutrosAdminsAtivos(companyUuid: string, usuarioUuid: string): Promise<number> }`
  - `garantirNaoEhUltimoAdmin(repo: UltimoAdminRepo, companyUuid: string, usuarioUuid: string): Promise<void>` — se `ehAdminAtivo` e `contarOutrosAdminsAtivos === 0`, lança `ApiError(MSG_ULTIMO_ADMIN)`.
  - `EditarUsuarioRepository` e `DeletarUsuarioRepository` implementam `UltimoAdminRepo` (SQL com a definição de admin ativo).
  - `EditarUsuarioInput.permitirAlterarAcessoCompartilhado?: boolean`; quando `true`, pula a checagem de `vinculadoAOutrasEmpresas` (403).
  - Editar chama `garantirNaoEhUltimoAdmin` somente quando `(input.position !== undefined && input.position !== "admin") || input.isAccepted === false`. Deletar chama sempre, depois do 404 e da regra "próprio acesso".

- [ ] **Step 1: Testes que falham** (repos falsos com `jest.fn()`):
  - Deletar último admin (`ehAdminAtivo→true`, `contar→0`) → `MSG_ULTIMO_ADMIN`, `deletar` não chamado; com `contar→1` → deleta; usuário não-admin (`ehAdminAtivo→false`) → deleta.
  - Editar `position: "usuario"` no último admin → `MSG_ULTIMO_ADMIN`; `isAccepted: false` no último admin → `MSG_ULTIMO_ADMIN`; `position: "admin"` → não chama `ehAdminAtivo`, atualiza; só `name` → atualiza.
  - Editar `password` com `vinculadoAOutrasEmpresas→true`: sem flag → 403 (mensagem atual); com `permitirAlterarAcessoCompartilhado: true` → atualiza.
- [ ] **Step 2:** `cd backend && npx jest src/@modules/usuario` → FAIL.
- [ ] **Step 3:** Implementar conforme Interfaces; ajustar providers se o construtor mudar (não deve: os repos ganham métodos).
- [ ] **Step 4:** `npx jest src/@modules/usuario` → PASS; `npx tsc --noEmit --incremental false` → OK.
- [ ] **Step 5:** Commit `Bloqueia remover ou rebaixar o último admin da empresa`.

---

### Task 2: Login exige vínculo ativo

**Files:**
- Modify: `backend/src/@modules/auth/generateTokenAutenticationUsernamePassword/tokenGenerateRepository.ts`
- Modify: `backend/src/@modules/auth/generateTokenAuthenticationRandomCode/generateTokenAuthenticationRandomCodeRepository.ts`
- Modify: `backend/src/@modules/auth/generateTokenAuthenticationUser/generateTokenAuthenticationUserRepository.ts`
- Test: `backend/src/@modules/auth/__test__/vinculoRemovido.db.test.ts` (banco)

**Interfaces:**
- Produces: as três queries adicionam `AND uc.deleted_at IS NULL` (alias do vínculo em cada query; em `generateTokenAuthenticationUserRepository` o alias é `"userCompanies"`).

- [ ] **Step 1: Teste com banco que falha:** empresa de teste `c0de0000-0000-4000-8000-0000000000a1` + usuário com e-mail `removido@teste.test` vinculado com `deleted_at = now()`; `new TokenGenerateRepository(hub).findUser(<email>, companyUuid)` (ou o método equivalente — ler o arquivo) → `null`; idem o repositório de código; `GenerateTokenAuthenticationUserRepository.buscarUsuario(companyUuid, userUuid)` → `null`. Com vínculo ativo → encontra. `afterAll` apaga só as linhas criadas.
- [ ] **Step 2:** `npx jest src/@modules/auth/__test__/vinculoRemovido.db.test.ts` → FAIL.
- [ ] **Step 3:** Adicionar o filtro nas três queries.
- [ ] **Step 4:** Mesmo comando → PASS; `npx tsc --noEmit --incremental false` → OK.
- [ ] **Step 5:** Commit `Impede login de usuário com acesso removido`.

---

### Task 3: Rotas `/admin/empresas/:uuid/usuarios`

**Files:**
- Modify: `backend/src/http/admin/adminEmpresa.controller.ts`, `backend/src/http/admin/admin.module.ts`
- Modify: `backend/src/@modules/admin/admin.query.ts` (`outrasEmpresasDoUsuario`)
- Test: ampliar `backend/src/@modules/admin/__test__/admin.db.test.ts`

**Interfaces:**
- Consumes: `CriarUsuarioUsecase`, `ListarUsuariosUsecase`, `DetalharUsuarioUsecase`, `EditarUsuarioUsecase` (Task 1), `DeletarUsuarioUsecase` (Task 1) — mesma fiação de `backend/src/http/usuario/usuario.module.ts`.
- Produces:
  - `AdminQuery.outrasEmpresasDoUsuario(usuarioUuid: string, exceto: string): Promise<{ uuid: string; name: string }[]>` — vínculos `deleted_at IS NULL` em empresas `deleted_at IS NULL`, `company_uuid <> exceto`, ordem por nome.
  - Rotas (todas chamam `garantirEmpresa(uuid)`; as com `:usuarioUuid` também `garantirUuid(usuarioUuid, "Usuário não encontrado")`):
    - `GET :uuid/usuarios` → `{ success, data, meta: { total } }` (mesmos query params de `/usuarios`)
    - `GET :uuid/usuarios/:usuarioUuid` → `{ success, data: { ...detalhe, outrasEmpresas } }`
    - `POST :uuid/usuarios` → 201 `{ success, data }` (campos: name, cpf, email, phone, password, position, roles)
    - `PUT :uuid/usuarios/:usuarioUuid` → `{ success }` (campos: name, cpf, email, phone, password, position, roles, isAccepted; `permitirAlterarAcessoCompartilhado: true`)
    - `DELETE :uuid/usuarios/:usuarioUuid` → `{ success }` (`usuarioLogadoUuid: req.userUuid`)
  - Usar `body?.` em todos os acessos.

- [ ] **Step 1: Teste com banco que falha:** usuário vinculado à empresa de teste do admin e a uma segunda empresa de teste → `outrasEmpresasDoUsuario(u, empresaA)` = `[{ uuid: empresaB, name }]`; com vínculo em B deletado → `[]`. `DetalharUsuarioUsecase` com usuário que não pertence à empresa alvo → 404.
- [ ] **Step 2:** `npx jest src/@modules/admin` → FAIL.
- [ ] **Step 3:** Implementar query, rotas e providers.
- [ ] **Step 4:** `npx jest src/@modules/admin src/http/middleware` → PASS; `npx tsc --noEmit --incremental false` → OK; `npm run build` → OK.
- [ ] **Step 5:** Commit `Adiciona rotas de usuários da empresa no Admin`.

---

### Task 4: Aba Usuários no frontend + docs

**Files:**
- Create: `frontend/src/pages/admin/empresaUsuarios.vue`, `frontend/src/pages/admin/empresaUsuarioDialog.vue`
- Modify: `frontend/src/pages/admin/empresaEditar.vue` (nova aba `usuarios`), `frontend/src/@modules/admin/empresa.http.ts`, `frontend/src/pages/admin/admin.service.ts`
- Modify docs: `docs/backend/modulos/admin.md`, `docs/backend/modulos/usuario.md`, `docs/frontend/modulos/admin.md`, `docs/pendencias.md`

**Interfaces:**
- Consumes: rotas da Task 3.
- Produces:
  - `AdminEmpresaHttp`: `listarUsuarios(uuid, params)`, `detalharUsuario(uuid, usuarioUuid)`, `criarUsuario(uuid, input)`, `editarUsuario(uuid, usuarioUuid, input)`, `deletarUsuario(uuid, usuarioUuid)`.
  - `AdminEmpresaService`: mesmos métodos no padrão existente (loading, notify `"Usuário criado"` / `"Usuário atualizado"` / `"Usuário removido"`, diálogo de confirmação `"Remover o acesso deste usuário a esta empresa?"`).
  - `empresaUsuarios.vue` (prop `empresaUuid: string`): busca com debounce, `q-table` server-side (Nome, E-mail, Cargo, Ativo, ações), botão "Novo usuário".
  - `empresaUsuarioDialog.vue` (props `empresaUuid: string`, `usuarioUuid?: string`; emite `salvo`): campos nome*, e-mail, CPF, telefone, cargo (`admin` "Administrador" / `usuario` "Usuário"), ativo (só ao editar), senha (obrigatória ao incluir; ao editar rótulo "Nova senha" opcional, enviada só se preenchida), mostrar/ocultar senha. Banner quando `outrasEmpresas.length`: `"Também acessa: <nomes separados por vírgula>. Senha, e-mail, CPF e telefone mudam lá também."`.
  - Docs: rotas novas; regra do último admin (valendo em `/usuarios` também); override do Admin; login exige vínculo ativo (token emitido vale até expirar); remover da pendência correspondente se houver.

- [ ] **Step 1:** Http, service e componentes.
- [ ] **Step 2:** Aba na `empresaEditar.vue`.
- [ ] **Step 3:** `cd frontend && npm run lint` sem erros nos arquivos tocados; `npx vue-tsc --noEmit -p tsconfig.json 2>&1 | grep -E "pages/admin|@modules/admin"` → vazio.
- [ ] **Step 4:** Docs.
- [ ] **Step 5:** Commit `Adiciona aba Usuários na edição de empresa do Admin`.

---

### Task 5: Verificação final (controller)

- [ ] `cd backend && npx jest src/@modules/usuario src/@modules/auth/__test__/vinculoRemovido.db.test.ts src/@modules/admin src/http/middleware --forceExit` → PASS; `npx tsc --noEmit --incremental false` → OK.
- [ ] Navegador (backend do worktree na 3017, frontend na 9010, domínio temporário `http://admin.localhost:9010` via API e removido no fim, `public/env-config.js` revertido): na empresa de teste, incluir usuário, editar cargo e senha, ver banner de outras empresas, tentar rebaixar/remover o último admin (bloqueado), remover um usuário e confirmar que o login dele falha.
