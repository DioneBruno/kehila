# Módulo Admin (gestão de empresas) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Módulo `admin` (só da empresa-admin) para cadastrar e manter empresas — dados, domínios, módulos e o admin inicial — sem SQL.

**Architecture:** Mesmo padrão dos módulos `igreja`/`imoveis`: use cases em `@modules/admin/`, controller em `http/admin/` protegido por `JwtAuth + Admin + ModuloAdmin`. Regras de domínio (normalização, unicidade, último ativo) ficam num helper de `@modules/empresa/dominio/` usado também pelas rotas antigas. Frontend Quasar ganha seção ADMIN e três telas.

**Tech Stack:** NestJS 11, SQL cru via TypeORM `DataSource` (sem entities), Postgres 17, Redis, Jest + `@swc/jest`; Vue 3 + Quasar.

**Spec:** `docs/superpowers/specs/2026-11-25-modulo-admin-empresas-design.md`

## Global Constraints

- `company_uuid` vem do `req`, **exceto** nas rotas `/admin/empresas/:uuid*`, onde a empresa alvo vem do path.
- Erros de negócio: `throw new ApiError(mensagem, status)`; nunca `throw new Error`. Mensagens em português, exatamente como no spec.
- Respostas novas: `{ success: true, data, meta? }`. Paginação `pagina` (1-based) / `porPagina` (padrão 20).
- Módulos válidos: `["igreja", "imoveis", "admin"]` — definidos num só lugar (`MODULOS_VALIDOS`).
- Copiar `makeProvider` no novo `*.module.ts` (padrão do projeto).
- Testes com banco: só contra o banco `kehila` do container `kehila-database` (porta 5437). **Nunca** `flow-*`, `start-*`, `one-*`. Usar uuids de empresa de teste próprios e apagar só eles.
- Mensagens fixas:
  - `"Informe o domínio como origem, ex.: https://app.exemplo.com.br"` (400)
  - `"Este domínio já está em uso por outra empresa"` (409)
  - `"A empresa precisa de pelo menos um domínio ativo"` (400)
  - `"Não é possível remover o módulo Admin da própria empresa"` (400)
  - `"Empresa não encontrada"` (404)

## Review Focus

1. Domínio digitado com maiúsculas/barra final (`HTTPS://App.X.com/`) igual a um já salvo sem normalização → deve contar como em uso (comparação por `lower(rtrim(domain,'/'))`). Teste na Task 1.
2. Desativar (PUT `active:false`) o único domínio ativo pela tela "Minha Empresa" → 400, não só no Admin. Teste na Task 1.
3. Falha no meio do cadastro (ex.: módulo repetido violando o índice único) → nenhuma linha da empresa fica gravada. Teste na Task 3.
4. Mudar módulos e o bloqueio continuar por 5 min por causa do Redis → a chave `modulos:<uuid>` é apagada após salvar. Teste na Task 2.
5. Rodar `admin:criar` duas vezes → a segunda não grava nada. Teste na Task 5.

---

### Task 0: Preparar o worktree

**Files:** nenhum versionado.

- [ ] **Step 1:** `cd backend && ln -s /home/dione/Projetos/kehila/backend/.env .env` (o `.env` é ignorado pelo git; `DB_DEFAULT_HOST=host.docker.internal` resolve para 127.0.0.1 neste host). Fazer `npm install` em `backend/` e `frontend/`.
- [ ] **Step 2:** Verificar: `cd backend && npx tsc --noEmit --incremental false` → sem erros; `npx jest src/http/middleware/__test__/seguranca.test.ts` → PASS.

---

### Task 1: Regras de domínio (normalização, unicidade, último ativo)

**Files:**
- Create: `backend/src/@modules/empresa/dominio/dominioRegras.ts`
- Modify: `backend/src/@modules/empresa/dominio/{criarDominio,editarDominio,deletarDominio}/*.usecase.ts`
- Modify: `backend/src/http/empresa/empresa.module.ts` (providers passam o segundo argumento)
- Test: `backend/src/@modules/empresa/dominio/__test__/dominioRegras.test.ts` (sem banco)

**Interfaces:**
- Produces:
  - `normalizarDominio(valor: string | null | undefined): string` — `trim`, minúsculas, remove barras finais; vazio → `ApiError("O domínio é obrigatório")`; não casa `^https?://[a-z0-9.-]+(:\d{1,5})?$` → `ApiError(MSG_DOMINIO_FORMATO)`.
  - `MSG_DOMINIO_FORMATO`, `MSG_DOMINIO_EM_USO`, `MSG_ULTIMO_DOMINIO` (constantes exportadas, textos das Global Constraints).
  - `class DominioRegrasRepository { constructor(hub: ConnectionHub); dominioEmUso(domain: string, ignorarDominioUuid?: string): Promise<boolean>; estaAtivo(companyUuid: string, dominioUuid: string): Promise<boolean>; contarOutrosAtivos(companyUuid: string, dominioUuid: string): Promise<number> }`
    - `dominioEmUso`: `active AND deleted_at IS NULL AND lower(rtrim(domain,'/')) = $1 AND ($2::uuid IS NULL OR uuid <> $2)` em qualquer empresa.
  - `async garantirDominioLivre(regras, domain, ignorarUuid?)` → lança `ApiError(MSG_DOMINIO_EM_USO, 409)`.
  - `async garantirNaoEhUltimoAtivo(regras, companyUuid, dominioUuid)` → se `estaAtivo` e `contarOutrosAtivos === 0`, lança `ApiError(MSG_ULTIMO_DOMINIO)`.
  - Construtores: `new CriarDominioUsecase(repo, regras)`, `new EditarDominioUsecase(repo, regras)`, `new DeletarDominioUsecase(repo, regras)`.

- [ ] **Step 1: Testes que falham** (`regras` e `repo` falsos com `jest.fn()`):
  - `normalizarDominio("  HTTPS://Admin.Localhost:9000/ ")` → `"https://admin.localhost:9000"`
  - `normalizarDominio("admin.localhost")`, `("https://x.com/path")`, `("ftp://x.com")` → lança `MSG_DOMINIO_FORMATO`
  - `normalizarDominio("  ")` → lança `"O domínio é obrigatório"`
  - Criar com `dominioEmUso → true` → rejeita com status 409 e `MSG_DOMINIO_EM_USO`; com `false` → `repo.criar` recebe `domain` normalizado
  - Editar `{ domain }` chama `dominioEmUso(normalizado, dominioUuid)`
  - Editar `{ active: false }` com `estaAtivo → true`, `contarOutrosAtivos → 0` → `MSG_ULTIMO_DOMINIO`; com `1` → chama `repo.atualizar`
  - Deletar com `estaAtivo → true`, `contarOutrosAtivos → 0` → `MSG_ULTIMO_DOMINIO`; com `estaAtivo → false` → deleta
- [ ] **Step 2:** `npx jest src/@modules/empresa/dominio` → FAIL (módulo não existe).
- [ ] **Step 3:** Implementar `dominioRegras.ts` e ligar nos três use cases (validações antigas de 401/obrigatório continuam antes). Atualizar providers do `EmpresaModule` com `new DominioRegrasRepository(hub)`.
- [ ] **Step 4:** `npx jest src/@modules/empresa/dominio` → PASS; `npx tsc --noEmit --incremental false` → OK.
- [ ] **Step 5:** Commit `Valida formato, unicidade e último domínio ativo`.

---

### Task 2: Módulo `admin`, middleware e definir módulos

**Files:**
- Create: `backend/src/@modules/empresa/modulos/modulos.ts`
- Modify: `backend/src/http/middleware/modulo.middleware.ts`
- Create: `backend/src/@modules/admin/definirModulos/definirModulosEmpresa.usecase.ts`, `definirModulosEmpresaRepository.ts`
- Test: `backend/src/@modules/admin/definirModulos/__test__/definirModulosEmpresa.usecase.test.ts` (fake), `backend/src/@modules/admin/__test__/admin.db.test.ts` (banco — criado aqui, ampliado nas Tasks 3 e 4)

**Interfaces:**
- Produces:
  - `MODULOS_VALIDOS = ["igreja", "imoveis", "admin"] as const`; `type ModuloChave = (typeof MODULOS_VALIDOS)[number]`
  - `validarModulos(modulos: unknown): ModuloChave[]` — não array/vazio → `ApiError("Informe pelo menos um módulo")`; item fora da lista → `ApiError("Módulo inválido: <x>")`; repetidos são removidos.
  - `modulo.middleware.ts` importa `ModuloChave` de `modulos.ts`; nova `ModuloAdminMiddleware` (`modulo = "admin"`).
  - `DefinirModulosEmpresaUsecase(repo).execute({ companyUuid, companyUuidLogada, modulos }): Promise<ModuloChave[]>`
  - `DefinirModulosEmpresaRepository { existeEmpresa(uuid): Promise<boolean>; definir(companyUuid, modulos: ModuloChave[]): Promise<void>; limparCache(companyUuid): Promise<void> }`
    - `definir` em `database.transaction`: `UPDATE ... SET deleted_at = now() WHERE company_uuid=$1 AND deleted_at IS NULL AND modulo <> ALL($2)`; `INSERT` para os que faltam (`ON CONFLICT DO NOTHING` não serve com índice parcial — selecionar os atuais e inserir a diferença).
    - `limparCache`: `hub.cache?.deleteKey("modulos:<uuid>")` em try/catch (só loga).

- [ ] **Step 1: Testes que falham (fake):**
  - `validarModulos([])` → `"Informe pelo menos um módulo"`; `(["igreja","xpto"])` → `"Módulo inválido: xpto"`; `(["admin","admin"])` → `["admin"]`
  - Empresa inexistente → 404 `"Empresa não encontrada"`
  - `companyUuid === companyUuidLogada` e lista sem `admin` → `"Não é possível remover o módulo Admin da própria empresa"`; outra empresa sem `admin` → OK
  - Sucesso chama `definir` e depois `limparCache(companyUuid)`
  - Em `seguranca.test.ts` (ou novo teste ao lado): `exigirModulo(repoFake(["admin"]), undefined, "c1", "admin")` resolve; com `["igreja"]` → 403
- [ ] **Step 2:** `npx jest src/@modules/admin src/http/middleware` → FAIL.
- [ ] **Step 3:** Implementar conforme Interfaces.
- [ ] **Step 4: Teste com banco** em `admin.db.test.ts` (empresa de teste `ad000000-0000-4000-8000-000000000a01`, padrão `beforeAll/afterAll` de `@modules/imoveis/imoveis/__test__/imoveis.test.ts`; `ConnectionHub({ database: dataSource, cache: fakeCache })` onde `fakeCache.deleteKey = jest.fn()`):
  - parte de `["igreja"]`, define `["imoveis","admin"]` → `ModuloEmpresaRepository.listarModulos` = `["admin","imoveis"]`; linha `igreja` com `deleted_at` preenchido; `fakeCache.deleteKey` chamado com `"modulos:ad000000-…a01"`
  - define de novo `["igreja"]` → reativa inserindo linha nova (2 linhas `igreja` no total, uma deletada)
- [ ] **Step 5:** `npx jest src/@modules/admin src/http/middleware` → PASS.
- [ ] **Step 6:** Commit `Adiciona módulo admin e definição de módulos por empresa`.

---

### Task 3: Cadastrar empresa completa (transacional)

**Files:**
- Create: `backend/src/@modules/admin/cadastrarEmpresa/cadastrarEmpresa.usecase.ts`, `cadastrarEmpresaRepository.ts`
- Test: `backend/src/@modules/admin/cadastrarEmpresa/__test__/cadastrarEmpresa.usecase.test.ts` (fake), ampliar `admin.db.test.ts`

**Interfaces:**
- Consumes: `normalizarDominio`, `DominioRegrasRepository`, `garantirDominioLivre` (Task 1); `validarModulos` (Task 2); `ApiValidate.validateCpf/validateEmail`.
- Produces:
  - `type CadastrarEmpresaInput = { empresa?: { name?, cpfCnpj?, commercialName?, fantasyName?, stateRegistration?, email?, phone?, uf?, address? }; dominio?: string; modulos?: unknown; admin?: { name?, email?, cpf?, phone?, password? } }`
  - `CadastrarEmpresaUsecase(repo: CadastrarEmpresaRepository, regras: DominioRegrasRepository).execute(input): Promise<{ uuid: string; adminUuid: string }>`
  - `type CadastrarEmpresaData = { uuid; adminUuid; empresa: {...trimados}; dominio: string; modulos: ModuloChave[]; admin: { name; email?; cpf?; phone?; passwordHash: string } }`
  - `CadastrarEmpresaRepository { cadastrar(data: CadastrarEmpresaData): Promise<void>; existeEmpresaComModulo(modulo: ModuloChave): Promise<boolean> }`
    - `cadastrar` em `database.transaction`: `auth_companies` (`tenant_id = uuid`), `auth_company_domains` (`active=true`), um `INSERT` por módulo em `auth_company_modulos`, `auth_users` (`password_date_update = now()`), `auth_users_companies` (`position='admin'`, `roles='[]'`, `is_accepted=true`).
  - Use case gera `uuid`/`adminUuid` com `randomUUID()` e o hash com `bcryptjs.hash(senha, 10)`.

- [ ] **Step 1: Testes que falham (fake), mensagens exatas:**
  - sem `empresa.name` → `"O nome da empresa é obrigatório"`; sem `cpfCnpj` → `"O CPF/CNPJ é obrigatório"`
  - `dominio: "x.com"` → `MSG_DOMINIO_FORMATO`; `dominioEmUso → true` → 409
  - `modulos: []` → `"Informe pelo menos um módulo"`
  - sem `admin.name` → `"O nome do usuário é obrigatório"`; sem CPF e e-mail → `"Informe o CPF ou o e-mail do usuário"`; e-mail inválido → `"E-mail inválido"`; CPF inválido → `"CPF inválido"`
  - senha ausente ou `"1234567"` → `"A senha deve ter pelo menos 8 caracteres"`
  - sucesso: `repo.cadastrar` recebe `dominio` normalizado, `modulos` deduplicados e `passwordHash` ≠ senha
- [ ] **Step 2:** `npx jest src/@modules/admin/cadastrarEmpresa` → FAIL.
- [ ] **Step 3:** Implementar.
- [ ] **Step 4: Teste com banco** (ampliar `admin.db.test.ts`; domínio de teste `http://teste-admin-a.localhost:9000`; `afterAll` apaga users/users_companies/modulos/domains/companies desse teste):
  - cadastro completo → existe 1 linha em cada tabela; `auth_users_companies.position = 'admin'`; `bcryptjs.compare(senha, users.password)` true
  - **rollback:** chamar `repo.cadastrar` direto com `modulos: ["igreja","igreja"]` (viola `UQ_auth_company_modulos_company_modulo`) → rejeita e `SELECT count(*) FROM auth_companies WHERE uuid=$1` = 0 e nenhum domínio/usuário gravado
  - cadastrar segunda empresa com `"HTTP://Teste-Admin-A.localhost:9000/"` → 409
- [ ] **Step 5:** `npx jest src/@modules/admin` → PASS.
- [ ] **Step 6:** Commit `Cadastra empresa com domínio, módulos e admin numa transação`.

---

### Task 4: Consultas e rotas `/admin/empresas`

**Files:**
- Create: `backend/src/@modules/admin/admin.query.ts`
- Create: `backend/src/http/admin/adminEmpresa.controller.ts`, `backend/src/http/admin/admin.module.ts`
- Modify: `backend/src/http/app.module.ts` (importar `AdminModule`)
- Test: ampliar `admin.db.test.ts`

**Interfaces:**
- Consumes: use cases das Tasks 1–3; `EditarEmpresaUsecase`; `ListarDominiosUsecase`.
- Produces:
  - `AdminQuery(hub) { listarEmpresas({ busca?, pagina, porPagina }): Promise<{ data: EmpresaListItem[]; total: number }>; detalharEmpresa(uuid): Promise<EmpresaDetalhe | null>; existeEmpresa(uuid): Promise<boolean> }`
    - `EmpresaListItem = { uuid, name, fantasyName, cpfCnpj, modulos: string[], dominios: string[] (ativos), createdAt }`; só `deleted_at IS NULL`; `busca` em `name`, `fantasy_name`, `cpf_cnpj`, `domain` com `ILIKE`; ordem `name`.
    - `EmpresaDetalhe = { uuid, name, commercialName, fantasyName, stateRegistration, cpfCnpj, email, phone, address, uf, createdAt, modulos: string[], dominios: { uuid, domain, active, createdAt }[] }`
  - Controller `@Controller("admin/empresas")` com as 9 rotas da tabela do spec §2. Rotas com `:uuid` chamam `garantirEmpresa(uuid)` (`AdminQuery.existeEmpresa` → `ApiError("Empresa não encontrada", 404)`) antes dos use cases de domínio/edição. `PUT :uuid/modulos` passa `companyUuidLogada: req.companyUuid`. Body montado campo a campo.
  - `AdminModule.configure`: `consumer.apply(JwtAuthMiddleware, AdminMiddleware, ModuloAdminMiddleware).forRoutes(AdminEmpresaController)`.

- [ ] **Step 1: Teste com banco que falha:** `listarEmpresas({ busca: "teste-admin-a", pagina: 1, porPagina: 20 })` devolve a empresa da Task 3 com `dominios` e `modulos`; `detalharEmpresa(uuidInexistente)` → `null`; empresa com `deleted_at` não aparece.
- [ ] **Step 2:** `npx jest src/@modules/admin` → FAIL.
- [ ] **Step 3:** Implementar query, controller, módulo e registro no `AppModule`.
- [ ] **Step 4:** `npx jest src/@modules/admin` → PASS; `npx tsc --noEmit --incremental false` → OK; `npm run build` → OK.
- [ ] **Step 5:** Commit `Adiciona rotas /admin/empresas`.

---

### Task 5: Comando `admin:criar`

**Files:**
- Create: `backend/src/@infra/database/scripts/criarEmpresaAdmin.ts`
- Modify: `backend/package.json` (scripts)
- Test: `backend/src/@infra/database/scripts/__test__/criarEmpresaAdmin.test.ts` (sem banco)

**Interfaces:**
- Consumes: `CadastrarEmpresaUsecase`, `CadastrarEmpresaRepository.existeEmpresaComModulo` (Task 3).
- Produces:
  - `lerArgumentos(argv: string[]): { dominio: string; email: string; nome: string; empresa: string; cnpj: string }` — padrões `nome="Administrador"`, `empresa="empresa-admin"`, `cnpj="00000000000000"`; falta `--dominio` ou `--email` → lança `Error` com a linha de uso (é CLI, não API).
  - `executarCriarEmpresaAdmin(deps: { usecase; repo; senha: string; log: (m: string) => void }, args): Promise<"criada" | "ja-existe">` — se `existeEmpresaComModulo("admin")` → loga `"Já existe uma empresa com o módulo admin; nada foi gravado."` e devolve `"ja-existe"`; senão cadastra com `modulos: ["admin"]`, `admin.password = senha`, e loga `"Empresa admin criada. Acesse <dominio>"`.
  - `main()` (só quando `require.main === module`): `dataSource.initialize()`, senha de `process.env.ADMIN_SENHA` ou pergunta no terminal sem eco (`readline` com `output` mudo), roda e `destroy()`. `ApiError` → imprime `message` e `process.exitCode = 1`.
  - Scripts: `"admin:criar": "NODE_PATH=. ts-node src/@infra/database/scripts/criarEmpresaAdmin.ts"`, `"admin:criar:prod": "NODE_PATH=dist node dist/@infra/database/scripts/criarEmpresaAdmin.js"`. Confirmar que os imports `src/...` resolvem nos dois; se `start:prod` usar outra estratégia, seguir a mesma.

- [ ] **Step 1: Testes que falham:** `lerArgumentos(["--dominio","http://admin.localhost:9000","--email","a@b.com"])` → padrões acima; sem `--email` → lança; `executarCriarEmpresaAdmin` com `existeEmpresaComModulo → true` → `"ja-existe"` e `usecase.execute` não chamado; com `false` → `usecase.execute` chamado com `modulos: ["admin"]` e `empresa.name: "empresa-admin"`.
- [ ] **Step 2:** `npx jest src/@infra/database/scripts` → FAIL.
- [ ] **Step 3:** Implementar e adicionar os scripts.
- [ ] **Step 4:** `npx jest src/@infra/database/scripts` → PASS; `npm run admin:criar` sem argumentos → imprime uso e sai com código ≠ 0.
- [ ] **Step 5:** Commit `Adiciona comando para criar a empresa-admin`.

---

### Task 6: Frontend — menu, rotas e telas

**Files:**
- Modify: `frontend/src/layouts/menu.ts`, `frontend/src/pages/home.vue`, `frontend/src/router/routes.ts`, `frontend/quasar.config.*` (boot `admin.boot`)
- Create: `frontend/src/@modules/admin/empresa.http.ts`, `frontend/src/boot/admin.boot.ts`, `frontend/src/pages/admin/{admin.service.ts, empresaListar.vue, empresaIncluir.vue, empresaEditar.vue}`

**Interfaces:**
- Consumes: rotas da Task 4.
- Produces:
  - `menu.ts`: `Modulo = "igreja" | "imoveis" | "admin"`; após o bloco IMÓVEIS, `{ label: "ADMIN", type: "section", modulo: "admin" }`, `{ label: "Empresas", icon: "domain", route: "admin.empresas", modulo: "admin" }`; em `itemVisivel`: `if (item.modulo === "admin") return modulos.includes("admin") && isAdmin;`.
  - `home.vue`: depois da regra de imóveis, `if (modulos.includes("admin") && router.hasRoute("admin.empresas")) await router.replace({ name: "admin.empresas" })` (só quando sem `igreja` e sem `imoveis`).
  - `AdminEmpresaHttp(http)`: `listar(params)`, `detalhar(uuid)`, `cadastrar(input)`, `editar(uuid, input)`, `listarDominios(uuid)`, `criarDominio(uuid, input)`, `editarDominio(uuid, dominioUuid, input)`, `deletarDominio(uuid, dominioUuid)`, `definirModulos(uuid, modulos)` — caminhos `admin/empresas...`; provido como `"adminEmpresaHttp"`.
  - `AdminEmpresaService` no padrão de `pages/empresa/dominio.service.ts` (loading, notify positivo, dialog de confirmação ao remover domínio; o interceptor já mostra o erro).
  - Rotas filhas do `MainLayout`: `admin/empresas` (`admin.empresas`), `admin/empresas/criar` (`admin.empresas.criar`), `admin/empresas/:uuid` (`admin.empresas.editar`).
  - Telas conforme spec §7 (lista com busca e chips; inclusão em seções Empresa / Acesso / Módulos / Usuário administrador; edição com abas Dados / Domínios / Módulos). Após cadastrar: notify `"Empresa criada. O admin entra em <domínio>"` e `router.replace` para a edição. Aba Módulos mostra aviso `"Os usuários da empresa precisam entrar de novo para ver o menu atualizado."`.

- [ ] **Step 1:** Implementar menu/home/rotas/boot/http/service.
- [ ] **Step 2:** Implementar as três telas, reaproveitando campos/estilo de `pages/empresa/empresaEditar.vue` e listas de `pages/imoveis/imovelListar.vue`.
- [ ] **Step 3:** `cd frontend && npm run lint` → sem erros novos; `npx vue-tsc --noEmit` (se disponível) ou `npm run build` → OK.
- [ ] **Step 4:** Commit `Adiciona telas do módulo Admin`.

---

### Task 7: Documentação

**Files:**
- Create: `docs/backend/modulos/admin.md`, `docs/frontend/modulos/admin.md`
- Modify: `docs/README.md` (linha na tabela de módulos; "Começando" com `npm run admin:criar -- --dominio http://admin.localhost:9000 --email <e-mail>`), `docs/backend/arquitetura.md` (linha `/admin/empresas` → JWT + Admin + ModuloAdmin; `ModuloChave` inclui `admin`), `docs/backend/modulos/imoveis.md` (habilitar módulo: agora pela tela Admin; SQL fica como alternativa), `docs/backend/modulos/empresa.md` (regras novas de domínio), `docs/pendencias.md` (remover o item "Não há tela (nem endpoint) para ligar/desligar módulos" e a nota de domínio sem unicidade, deixando a observação de que não há índice no banco)

- [ ] **Step 1:** Escrever/atualizar.
- [ ] **Step 2:** Commit `Documenta o módulo Admin`.

---

### Task 8: Verificação final e empresa-admin de exemplo

- [ ] **Step 1:** `cd backend && npx jest src/@modules/admin src/@modules/empresa src/@infra/database/scripts src/http/middleware` → PASS; `npx tsc --noEmit --incremental false` → OK.
- [ ] **Step 2:** Criar a empresa-admin no banco `kehila`: `ADMIN_SENHA=<senha de teste> npm run admin:criar -- --dominio http://admin.localhost:9000 --email admin@empresa-admin.test`. Rodar de novo → "Já existe…". Registrar a senha de teste só no `.env` local (não versionado), não no chat.
- [ ] **Step 3:** Subir backend (`npm run start:dev`) e frontend (`npm run dev`); no navegador abrir `http://admin.localhost:9000`, logar, ver o menu ADMIN › Empresas, cadastrar uma empresa de teste com domínio `http://teste.localhost:9000`, desligar/ligar um módulo, confirmar 400 ao tentar tirar `admin` da empresa-admin e ao desativar seu único domínio; logar em `http://teste.localhost:9000` com o admin criado.
