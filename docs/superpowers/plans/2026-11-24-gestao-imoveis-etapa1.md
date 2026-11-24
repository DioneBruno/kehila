# Gestão de Imóveis — Etapa 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Módulos habilitados por empresa (igreja × imóveis) e o módulo Imóveis base: pessoas PF/PJ, imóveis, contratos com histórico de aditivos/renovações e painel de vencimentos.

**Architecture:** Nova tabela `auth_company_modulos` + middlewares `ModuloIgrejaMiddleware`/`ModuloImoveisMiddleware` aplicados nos módulos Nest; a lista de módulos também vai no JWT (`company.modulos`) para o menu. Módulo novo `@modules/imoveis/*` (use cases + SQL cru) exposto em `http/imoveis/`, e telas em `frontend/src/pages/imoveis/` seguindo a receita de CRUD existente.

**Tech Stack:** NestJS 11, TypeORM (só migrations/driver, SQL cru), PostgreSQL 17, Redis (cache), Jest; Quasar 2 / Vue 3 / Pinia.

**Spec:** `docs/superpowers/specs/2026-11-24-gestao-imoveis-etapa1-design.md`

## Global Constraints

- `company_uuid` sempre do `req` (JWT/domínio), nunca do body; todo SQL filtra `company_uuid` e `deleted_at IS NULL`.
- Controllers montam input **campo a campo** (nunca `...body`); erros de negócio com `ApiError` (nunca `throw new Error`).
- Respostas novas: `{ success: true, data, meta? }`; paginação `pagina` (1-based) / `porPagina` (padrão 20).
- Update parcial pelo mapa campo → coluna (só `!== undefined`).
- Mais de uma escrita → `connections.database.transaction(async (manager) => …)`.
- `decimal` → `::float8` no SELECT; `date` → `TO_CHAR(col,'YYYY-MM-DD')`.
- Nomes de domínio em português; Prettier backend `printWidth` 150, frontend 100, aspas duplas.
- Migrations em `backend/src/@infra/database/migrations/<modulo>/<timestamp>-<nome>.migration.ts`, SQL com `IF NOT EXISTS`, timestamps a partir de `1792000000000` (o maior existente é `1791100000000`).
- Testes de integração rodam em banco de dev **já migrado** (migrations em banco vazio quebram em B1); cada arquivo usa um `companyUuid` fixo próprio e apaga por ele no `afterAll`. Nunca contra banco com dados reais.
- Mensagens de erro em português, mostradas direto na tela.
- Chaves de módulo: `"igreja"` e `"imoveis"`. Mensagem do bloqueio: `"Módulo não habilitado para esta empresa"` (403).

## Review Focus

1. **Escritório chamando API de igreja pelo domínio público** (`/publico/eventos`, sem JWT): deve dar 403, não vazar eventos. → teste na Task 2.
2. **CPF/CNPJ com máscara ou repetido em outra empresa** (`"123.456.789-09"` e o mesmo documento na empresa B): grava só dígitos; duplicidade só vale dentro da mesma empresa. → teste na Task 4.
3. **Dois contratos criados ao mesmo tempo no mesmo imóvel**: só um fica vigente (lock `FOR UPDATE`). → teste com `Promise.allSettled` na Task 6.
4. **Contrato vencido há meses** (`fim < hoje`, vigente): aparece em "Vencidos" e **não** em 0–30. → teste na Task 7.
5. **Usuário trocado sem recarregar** (B13: `isAdmin`/módulos lidos uma vez): menu deve refletir o token atual após login. → verificação manual na Task 3.

---

## File Structure

```
backend/src/@infra/database/migrations/auth/1792000000000-create-auth_company_modulos.migration.ts
backend/src/@infra/database/migrations/imoveis/1792000000100-create-imovel_pessoas.migration.ts
backend/src/@infra/database/migrations/imoveis/1792000000200-create-imovel_imoveis.migration.ts
backend/src/@infra/database/migrations/imoveis/1792000000300-create-imovel_contratos.migration.ts
backend/src/@infra/database/migrations/imoveis/1792000000400-create-imovel_contrato_eventos.migration.ts
backend/src/@modules/empresa/modulos/moduloEmpresaRepository.ts        listarModulos(companyUuid)
backend/src/http/middleware/modulo.middleware.ts                       exigirModulo + 2 middlewares
backend/src/http/middleware/__test__/modulo.middleware.test.ts
backend/src/@modules/imoveis/shared/imoveis.tipos.ts                   unions (tipos, situações, índices…)
backend/src/@modules/imoveis/pessoas/{pessoa.entity.ts, incluirPessoa/, alterarPessoa/, deletarPessoa/}
backend/src/@modules/imoveis/imoveis/{imovel.entity.ts, incluirImovel/, alterarImovel/, deletarImovel/}
backend/src/@modules/imoveis/contratos/{contrato.entity.ts, incluirContrato/, alterarContrato/, registrarEventoContrato/}
backend/src/@modules/imoveis/imoveis.query.ts                          listas, detalhes, histórico, painel
backend/src/http/imoveis/{imoveis.module.ts, pessoas.controller.ts, imoveis.controller.ts, contratos.controller.ts, painel.controller.ts}
frontend/src/@modules/imoveis/{pessoa.http.ts, imovel.http.ts, contrato.http.ts, painel.http.ts}
frontend/src/boot/imoveis.boot.ts
frontend/src/pages/imoveis/{imoveis.service.ts, painel.vue, pessoa*.vue, imovel*.vue, contrato*.vue}
docs/backend/modulos/imoveis.md, docs/frontend/modulos/imoveis.md
```

---

### Task 1: Tabela de módulos e módulos no JWT

**Files:**
- Create: `backend/src/@infra/database/migrations/auth/1792000000000-create-auth_company_modulos.migration.ts`
- Create: `backend/src/@modules/empresa/modulos/moduloEmpresaRepository.ts`
- Modify: `backend/src/@modules/auth/generateTokenAuthenticationUser/generateTokenAuthenticationUserRepository.ts` (query `buscarUsuario`), `user.entity.ts` (`tokenGenegate` → `company.modulos`)
- Modify: `backend/src/@infra/database/seeders/auth/company.seeder.ts` — insere `igreja` para cada empresa criada
- Test: `backend/src/@modules/auth/generateTokenAuthenticationUser/__test__/` (acrescentar caso)

**Interfaces:**
- Produces: tabela `auth_company_modulos(created_at, updated_at, deleted_at, uuid PK, company_uuid FK auth_companies ON DELETE CASCADE, modulo varchar(40) NOT NULL)` + índice único parcial `(company_uuid, modulo) WHERE deleted_at IS NULL`.
- Produces: `class ModuloEmpresaRepository { constructor(hub: ConnectionHub); listarModulos(companyUuid: string): Promise<string[]> }` (ordenado por `modulo`).
- Produces: payload JWT `company.modulos: string[]`.

- [ ] **Step 1: Migration** — `up` cria a tabela e faz `INSERT INTO auth_company_modulos (uuid, company_uuid, modulo) SELECT gen_random_uuid(), uuid, 'igreja' FROM auth_companies WHERE deleted_at IS NULL ON CONFLICT DO NOTHING`. `down` dropa a tabela. Rodar `npm run migration:run-dev` → sucesso; `SELECT count(*) FROM auth_company_modulos` = nº de empresas ativas.
- [ ] **Step 2: Teste falhando** — no teste do `GenerateTokenAuthenticationUserUsecase`: com empresa de teste tendo `igreja` e `imoveis`, `ApiJwt.tokenDecoding(token).company.modulos` é `["igreja","imoveis"]`; empresa sem linhas → `[]`.
- [ ] **Step 3: Rodar** `npx jest src/@modules/auth/generateTokenAuthenticationUser` → FAIL (`modulos` undefined).
- [ ] **Step 4: Implementar** — `buscarUsuario` adiciona `COALESCE((SELECT array_agg(m.modulo ORDER BY m.modulo) FROM auth_company_modulos m WHERE m.company_uuid = companies.uuid AND m.deleted_at IS NULL), '{}') AS company_modulos`; entity propaga para `company.modulos`.
- [ ] **Step 5: Rodar** o teste → PASS; `npx tsc --noEmit --incremental false` sem erros.
- [ ] **Step 6: Commit** `Adiciona módulos habilitados por empresa e envia no token`

### Task 2: Middlewares de módulo e aplicação nas rotas

**Files:**
- Create: `backend/src/http/middleware/modulo.middleware.ts`
- Create: `backend/src/http/middleware/__test__/modulo.middleware.test.ts`
- Modify: `backend/src/http/{aprisco,membresia,bi,financeiro,portalEventos}/*.module.ts` (`configure`)

**Interfaces:**
- Consumes: `ModuloEmpresaRepository.listarModulos` (Task 1).
- Produces:
  - `export type ModuloChave = "igreja" | "imoveis"`
  - `export async function exigirModulo(repo: Pick<ModuloEmpresaRepository,"listarModulos">, cache: ConnectionCacheInterface | undefined, companyUuid: string, modulo: ModuloChave): Promise<void>` — lança `ApiError("Módulo não habilitado para esta empresa", 403)`; cache via `saveObject("modulos:<companyUuid>", { modulos }, 300)` / `findKey` (sem cache → consulta direto; erro no cache → consulta direto).
  - `@Injectable() class ModuloIgrejaMiddleware` e `ModuloImoveisMiddleware` (`constructor(hub: ConnectionHub)`, `async use(req,res,next)`), aplicados **depois** de `JwtAuthMiddleware`/`DominioMiddleware`.

- [ ] **Step 1: Testes falhando** (unitários, repo e cache fakes):
  - `bloqueia empresa sem o módulo` → rejeita com "Módulo não habilitado para esta empresa" e `statusCode` 403, `next` não chamado.
  - `libera empresa com o módulo` → `next` chamado uma vez.
  - `usa o cache na segunda chamada` → `listarModulos` chamado 1×.
  - `funciona sem cache` (`hub.cache` undefined).
  - `companyUuid ausente` → 403.
- [ ] **Step 2: Rodar** `npx jest src/http/middleware/__test__/modulo.middleware.test.ts` → FAIL.
- [ ] **Step 3: Implementar** `modulo.middleware.ts`.
- [ ] **Step 4: Aplicar** `ModuloIgrejaMiddleware` em: `ApriscoController`, `MembresiaController`, `BiController`, `ContasBancariasController`, `CobrancasController`, `PagamentosController`, `CartaoCreditoController`, `PublicoController` (após `DominioMiddleware`), `PedidosController`, `EventosController`, `LotesController`. **Não** aplicar em auth, `/ping`, empresa/domínios, usuários, notificações.
- [ ] **Step 5: Teste da matriz** no mesmo arquivo: para cada controller da lista acima, a ordem configurada inclui `ModuloIgrejaMiddleware` (inspecionar via `consumer` fake que registra `apply(...).forRoutes(...)` chamando `new XModule().configure(fake)`); `NotificacaoModule`, `UsuarioModule`, `EmpresaModule`, `AuthModule`, `PublicModule` **não** incluem.
- [ ] **Step 6: Rodar** os testes + `npx jest src/http/middleware/__test__` (inclui `seguranca.test.ts`) → PASS; `npx tsc --noEmit --incremental false`.
- [ ] **Step 7: Commit** `Bloqueia rotas de igreja para empresas sem o módulo`

### Task 3: Menu e home por módulo (frontend)

**Files:**
- Modify: `frontend/src/@modules/auth/tokenDecode.ts` (`company.modulos?: string[]`)
- Modify: `frontend/src/layouts/MainLayout.vue`
- Modify: `frontend/src/pages/home.vue` (ou router) — empresa só com `imoveis` → painel de imóveis

**Interfaces:**
- Consumes: `company.modulos` no JWT (Task 1).
- Produces: `MenuItem.modulo?: "igreja" | "imoveis"`; função pura exportada `filtrarMenu(itens: MenuItem[], modulos: string[], isAdmin: boolean, isInterno: boolean): MenuItem[]` em `frontend/src/layouts/menu.ts` (MENU_ITEMS também movido para lá).

Regras de `filtrarMenu`:
- Itens base (sem `modulo`: Início, Minha Empresa, Usuários, Notificações): regra de hoje — admin vê todos; não-admin só Início.
- `modulo: "igreja"` (Eventos, BI, seção FINANCEIRO e itens, Membros, Apriscos): só se `modulos` inclui `igreja` **e** admin.
- `modulo: "imoveis"` (seção IMÓVEIS: Painel, Proprietários, Imóveis, Contratos, Inquilinos): se `modulos` inclui `imoveis` e usuário interno (qualquer perfil não externo).
- Seções sem item visível depois do filtro somem.
- Token sem `modulos` (token antigo antes do deploy) → tratar como `["igreja"]`.

- [ ] **Step 1: Implementar** `menu.ts` e usar no `MainLayout` (computed lendo `TokenDecode.execute()` dentro do computed, não uma vez no `setup` — resolve B13 para o menu). `ROTAS_NAV_INFERIOR` passa a ser filtrado pelo mesmo resultado; para empresa só com `imoveis`: `["imoveis.painel","imoveis.contratos","imoveis.imoveis"]`.
- [ ] **Step 2: Home** — `pages/home.vue`: se `modulos` não inclui `igreja` e inclui `imoveis`, `router.replace({ name: "imoveis.painel" })`; senão comportamento atual.
- [ ] **Step 3: Verificar** `npm run lint` e `npx vue-tsc --noEmit` sem erros.
- [ ] **Step 4: Verificação manual** (depois da Task 9, quando a rota existir): login em empresa só-igreja → menu igual ao de hoje; empresa só-imóveis → só base + IMÓVEIS; trocar de usuário sem recarregar → menu do novo token.
- [ ] **Step 5: Commit** `Filtra menu e home pelos módulos da empresa`

### Task 4: Pessoas (PF/PJ) — backend

**Files:**
- Create: migration `imoveis/1792000000100-create-imovel_pessoas.migration.ts`
- Create: `backend/src/@modules/imoveis/shared/imoveis.tipos.ts`
- Create: `backend/src/@modules/imoveis/pessoas/pessoa.entity.ts`, `incluirPessoa/`, `alterarPessoa/`, `deletarPessoa/` (usecase + Repository + `__test__`)
- Create: `backend/src/@modules/imoveis/imoveis.query.ts` (métodos de pessoa)
- Create: `backend/src/http/imoveis/imoveis.module.ts`, `pessoas.controller.ts`; Modify: `backend/src/http/app.module.ts` (importar `ImoveisModule`)

**Interfaces:**
- Produces (tabela, conforme spec): `imovel_pessoas` com `tipo ('PF'|'PJ')`, `documento` (só dígitos, índice único parcial `(company_uuid, documento) WHERE deleted_at IS NULL`), `nome`, `nome_fantasia`, `rg_ie`, `email`, `telefone`, `endereco_cep/logradouro/numero/complemento/bairro/cidade/uf`, `observacoes`, `eh_proprietario/eh_inquilino/eh_fiador boolean default false`.
- Produces: `type PessoaTipo = "PF" | "PJ"`; `PessoaEntity.criar(input): PessoaEntity` (normaliza documento para dígitos, valida PF→`ApiValidate.validateCpf`, PJ→`validateCnpj`, nome obrigatório, e-mail via `validateEmail` se informado, UF 2 letras maiúsculas).
- Produces use cases: `IncluirPessoaUsecase.execute({companyUuid, ...campos}) → {uuid}`, `AlterarPessoaUsecase.execute({companyUuid, uuid, ...parciais}) → void`, `DeletarPessoaUsecase.execute({companyUuid, uuid}) → void`.
- Produces query: `ImoveisQuery.listarPessoas(companyUuid, {papel?: "proprietario"|"inquilino"|"fiador", busca?, pagina, porPagina}) → {data, total}`; `buscarPessoa(companyUuid, uuid)`.
- Produces rotas: `GET/POST /imoveis/pessoas`, `GET/PATCH/DELETE /imoveis/pessoas/:uuid`. Módulo: `JwtAuthMiddleware, InternoMiddleware, ModuloImoveisMiddleware` em todos os controllers de `ImoveisModule`; `DELETE` chama `exigirAdmin(req)`.

Mensagens:
- `"CPF inválido"`, `"CNPJ inválido"`, `"O nome é obrigatório"`, `"Já existe uma pessoa com este documento"` (409), `"Pessoa não encontrada"` (404), `"Não é possível excluir: a pessoa é proprietária de imóvel ou parte de contrato vigente"` (409).

- [ ] **Step 1: Migration** e `npm run migration:run-dev` → OK.
- [ ] **Step 2: Testes falhando** (integração, `companyUuid` próprio + um segundo `companyUuidB`):
  - inclui PF com `"123.456.789-09"` (CPF válido de teste) → `documento = "12345678909"`, `eh_proprietario` conforme input.
  - CPF inválido → "CPF inválido"; CNPJ inválido → "CNPJ inválido".
  - mesmo documento na mesma empresa → 409; na empresa B → sucesso.
  - alterar só `telefone` mantém o resto; `email: null` limpa.
  - alterar pessoa de outra empresa → "Pessoa não encontrada".
  - `listarPessoas({papel:"proprietario"})` retorna só `eh_proprietario = true`; busca por nome (ILIKE) e por documento (dígitos).
  - deletar faz soft delete; deletar pessoa dona de imóvel → 409 (este caso é escrito na Task 5, quando o imóvel existir).
- [ ] **Step 3: Rodar** `npx jest src/@modules/imoveis/pessoas` → FAIL.
- [ ] **Step 4: Implementar** entity, use cases, repositories, query, controller e módulo.
- [ ] **Step 5: Rodar** → PASS; `npx tsc --noEmit --incremental false`.
- [ ] **Step 6: Commit** `Adiciona cadastro de pessoas do módulo imóveis`

### Task 5: Imóveis — backend

**Files:**
- Create: migration `imoveis/1792000000200-create-imovel_imoveis.migration.ts`
- Create: `backend/src/@modules/imoveis/imoveis/imovel.entity.ts`, `incluirImovel/`, `alterarImovel/`, `deletarImovel/`
- Modify: `imoveis.query.ts`, `imoveis.module.ts`; Create: `http/imoveis/imoveis.controller.ts`

**Interfaces:**
- Produces (tabela conforme spec): `proprietario_uuid FK imovel_pessoas NOT NULL`, `identificacao`, `tipo`, `finalidade`, `endereco_*`, `inscricao_iptu`, `matricula`, `cartorio`, `area_m2 decimal(12,2)`, `situacao default 'livre'`, `observacoes`.
- Produces em `imoveis.tipos.ts`: `ImovelTipo = "casa"|"apartamento"|"sala_comercial"|"loja"|"galpao"|"terreno"|"outro"`, `ImovelFinalidade = "residencial"|"comercial"`, `ImovelSituacao = "livre"|"alugado"|"reforma"|"inativo"`.
- Produces: `IncluirImovelUsecase.execute({companyUuid, proprietarioUuid, identificacao, tipo, finalidade, ...}) → {uuid}` — em transação: valida proprietário da mesma empresa e liga `eh_proprietario = true`. `AlterarImovelUsecase` (não aceita `situacao = "alugado"` manualmente, nem sair de `alugado` enquanto houver contrato vigente). `DeletarImovelUsecase`.
- Produces query: `listarImoveis(companyUuid, {proprietarioUuid?, situacao?, busca?, pagina, porPagina})` (inclui `proprietarioNome`), `buscarImovel(companyUuid, uuid)` (inclui contrato vigente resumido ou `null`).
- Rotas: `GET/POST /imoveis/imoveis`, `GET/PATCH/DELETE /imoveis/imoveis/:uuid`.

Mensagens: `"Proprietário não encontrado"` (404), `"A identificação do imóvel é obrigatória"`, `"Tipo de imóvel inválido"`, `"Situação inválida"`, `"A situação 'alugado' é definida pelo contrato"`, `"Imóvel com contrato vigente não pode mudar de situação"` (409), `"Imóvel não encontrado"` (404), `"Não é possível excluir imóvel com contrato vigente"` (409).

- [ ] **Step 1: Migration** e rodar.
- [ ] **Step 2: Testes falhando**: incluir liga `eh_proprietario` da pessoa; proprietário de outra empresa → 404; situação inicial `livre`; alterar para `alugado` → erro; `area_m2` volta number; listar filtra por proprietário e situação; **deletar pessoa dona de imóvel → 409** (caso pendente da Task 4).
- [ ] **Step 3: Rodar** `npx jest src/@modules/imoveis/imoveis` → FAIL.
- [ ] **Step 4: Implementar.** `DeletarPessoaRepository` passa a checar imóvel ativo e contrato vigente.
- [ ] **Step 5: Rodar** `npx jest src/@modules/imoveis` → PASS; tsc.
- [ ] **Step 6: Commit** `Adiciona cadastro de imóveis`

### Task 6: Contratos e eventos (renovação/aditivo/encerramento/rescisão) — backend

**Files:**
- Create: migrations `imoveis/1792000000300-create-imovel_contratos.migration.ts`, `1792000000400-create-imovel_contrato_eventos.migration.ts`
- Create: `backend/src/@modules/imoveis/contratos/contrato.entity.ts`, `incluirContrato/`, `alterarContrato/`, `registrarEventoContrato/`
- Modify: `imoveis.query.ts`, `imoveis.module.ts`; Create: `http/imoveis/contratos.controller.ts`

**Interfaces:**
- Produces (tabelas conforme spec). Defaults: `multa_atraso_pct 2.00`, `juros_mes_pct 1.00`, `status 'vigente'`, `mes_reajuste` = mês de `inicio` quando omitido e `indice_reajuste <> 'nenhum'`. CHECKs: `dia_vencimento BETWEEN 1 AND 31`, `mes_reajuste BETWEEN 1 AND 12`. Índice único parcial `(imovel_uuid) WHERE status = 'vigente' AND deleted_at IS NULL` (rede de segurança do lock).
- Produces em `imoveis.tipos.ts`: `IndiceReajuste = "IGPM"|"IPCA"|"INPC"|"IGPDI"|"nenhum"`, `GarantiaTipo = "fiador"|"caucao"|"seguro_fianca"|"titulo_capitalizacao"|"nenhuma"`, `ContratoStatus = "vigente"|"encerrado"|"rescindido"`, `ContratoEventoTipo = "renovacao"|"aditivo"|"encerramento"|"rescisao"`.
- Produces: `IncluirContratoUsecase.execute({companyUuid, imovelUuid, inquilinoUuid, inicio, fim, valorAluguel, diaVencimento, indiceReajuste, mesReajuste?, multaAtrasoPct?, jurosMesPct?, descontoPontualidadePct?, multaRescisoriaMeses?, garantiaTipo, garantiaValor?, fiadorUuid?, numero?, observacoes?}) → {uuid}` — transação: `SELECT … FROM imovel_imoveis WHERE uuid=$1 AND company_uuid=$2 FOR UPDATE`; exige `situacao = 'livre'`; inquilino ≠ proprietário; fiador obrigatório se `garantiaTipo = "fiador"` e ≠ inquilino; `fim > inicio`; valores ≥ 0; grava contrato; imóvel → `alugado`; liga `eh_inquilino` (e `eh_fiador`).
- Produces: `AlterarContratoUsecase.execute({companyUuid, uuid, ...parciais})` — **rejeita** `fim`, `valorAluguel`, `status`, `imovelUuid`, `inquilinoUuid` (o controller nem repassa esses campos); só contrato vigente.
- Produces: `RegistrarEventoContratoUsecase.execute({companyUuid, userUuid, contratoUuid, tipo, data, descricao, valorNovo?, fimNovo?}) → {uuid}` — transação com `FOR UPDATE` no contrato vigente:
  - `renovacao`: exige `fimNovo > fim atual`; `valorNovo` opcional.
  - `aditivo`: exige `valorNovo` ou `fimNovo` (ao menos um); `fimNovo > inicio`.
  - `encerramento`/`rescisao`: status → `encerrado`/`rescindido`, `encerrado_em = data`, imóvel → `livre`.
  - grava `valor_anterior/valor_novo`, `fim_anterior/fim_novo`, `criado_por_uuid = userUuid`; atualiza o contrato.
- Produces query: `listarContratos(companyUuid, {proprietarioUuid?, imovelUuid?, inquilinoUuid?, status?, busca?, pagina, porPagina})`, `buscarContrato(companyUuid, uuid)` (com nomes de imóvel/proprietário/inquilino/fiador), `listarEventosContrato(companyUuid, contratoUuid)` (mais recente primeiro).
- Rotas: `GET/POST /imoveis/contratos`, `GET/PATCH /imoveis/contratos/:uuid`, `GET/POST /imoveis/contratos/:uuid/eventos`.

Mensagens: `"Imóvel não está livre para locação"` (409), `"Inquilino não pode ser o proprietário do imóvel"`, `"Informe o fiador"`, `"Fiador não pode ser o inquilino"`, `"A data de fim deve ser posterior ao início"`, `"Dia de vencimento inválido"`, `"Índice de reajuste inválido"`, `"Contrato não encontrado"` (404), `"Contrato não está vigente"` (409), `"A renovação deve estender a data de fim"`, `"Informe o novo valor ou a nova data de fim"`, `"Use renovação ou aditivo para alterar valor ou data de fim"`.

- [ ] **Step 1: Migrations** e rodar.
- [ ] **Step 2: Testes falhando**:
  - incluir: imóvel vira `alugado`, inquilino recebe `eh_inquilino`; `mes_reajuste` default = mês do início; multa/juros default 2/1.
  - imóvel `reforma` → "Imóvel não está livre para locação"; inquilino = proprietário → erro; garantia fiador sem fiador → "Informe o fiador".
  - **concorrência**: `Promise.allSettled` de dois `IncluirContrato` no mesmo imóvel → exatamente 1 fulfilled, 1 rejected; `count(*) vigente = 1`.
  - renovação: `fim` e `valor_aluguel` do contrato atualizados; evento com anterior/novo; renovação com `fimNovo <= fim` → erro.
  - aditivo só com `valorNovo` mantém `fim`.
  - encerramento: status `encerrado`, `encerrado_em`, imóvel `livre`; novo contrato no mesmo imóvel passa a ser permitido; evento em contrato encerrado → "Contrato não está vigente".
  - alterar com `observacoes` funciona; isolamento: contrato de outra empresa → 404.
  - deletar imóvel com contrato vigente → 409; deletar inquilino com contrato vigente → 409.
- [ ] **Step 3: Rodar** `npx jest src/@modules/imoveis/contratos` → FAIL.
- [ ] **Step 4: Implementar.**
- [ ] **Step 5: Rodar** `npx jest src/@modules/imoveis` → PASS; tsc.
- [ ] **Step 6: Commit** `Adiciona contratos com renovação, aditivo e encerramento`

### Task 7: Painel — backend

**Files:**
- Modify: `imoveis.query.ts` (`painel`), `imoveis.module.ts`; Create: `http/imoveis/painel.controller.ts`
- Test: `backend/src/@modules/imoveis/__test__/painel.query.test.ts`

**Interfaces:**
- Produces: `ImoveisQuery.painel(companyUuid: string, hoje: string /* YYYY-MM-DD */) → Promise<PainelImoveis>`:
  ```ts
  type ContratoResumo = { uuid; imovelIdentificacao; proprietarioNome; inquilinoNome; valorAluguel: number; fim: string; indiceReajuste; mesReajuste };
  type PainelImoveis = {
    vencidos: ContratoResumo[];      // vigente e fim < hoje
    vence0a30: ContratoResumo[];     // hoje <= fim <= hoje+30
    vence31a60: ContratoResumo[];    // hoje+31 .. hoje+60
    vence61a90: ContratoResumo[];    // hoje+61 .. hoje+90
    reajustesMes: ContratoResumo[];  // vigente, indice <> 'nenhum', mes_reajuste = mês de hoje, e inicio < primeiro dia do mês de hoje (não reajusta no 1º mês)
    imoveisLivres: { uuid; identificacao; proprietarioNome }[];
  };
  ```
  Ordenado por `fim` (vencimentos) e identificação (reajustes/livres). `hoje` vem do controller (`ApiDate` no fuso do servidor) para os testes poderem fixar a data.
- Rota: `GET /imoveis/painel` → `{ success: true, data: PainelImoveis }`.

- [ ] **Step 1: Teste falhando** com `hoje = "2026-11-24"` e contratos com `fim`: `2026-08-01` (vencidos), `2026-11-24` e `2026-12-24` (0–30), `2026-12-25` (31–60), `2027-02-22` (61–90), `2027-02-23` (fora); contrato encerrado com fim no passado → fora de tudo; reajuste: `mes_reajuste = 11` com início `2025-11-10` → entra; início `2026-11-05` → não entra; `indice = 'nenhum'` → não entra. Outra empresa → nada.
- [ ] **Step 2: Rodar** → FAIL. **Step 3: Implementar.** **Step 4: Rodar** → PASS; tsc.
- [ ] **Step 5: Commit** `Adiciona painel de vencimentos e reajustes`

### Task 8: Frontend — HTTP, boot, pessoas e imóveis

**Files:**
- Create: `frontend/src/@modules/imoveis/{pessoa.http.ts, imovel.http.ts, contrato.http.ts, painel.http.ts}` (tipos espelhando as rotas das Tasks 4–7)
- Create: `frontend/src/boot/imoveis.boot.ts` (provide `pessoaHttp`, `imovelHttp`, `contratoHttp`, `painelHttp`); Modify: `frontend/quasar.config.ts` (lista `boot`)
- Create: `frontend/src/pages/imoveis/imoveis.service.ts` (labels/cores de tipo, situação, índice, garantia, status; formatação `R$`, CPF/CNPJ mascarado)
- Create: `frontend/src/pages/imoveis/{pessoaListar.vue, pessoaIncluir.vue, pessoaEditar.vue, pessoaForm.vue, imovelListar.vue, imovelIncluir.vue, imovelEditar.vue, imovelForm.vue}`
- Modify: `frontend/src/router/routes.ts`

**Interfaces:**
- Consumes: rotas das Tasks 4–5; `filtrarMenu` (Task 3) — itens `imoveis.*` já declarados lá.
- Produces rotas (filhas do `MainLayout`): `imoveis.proprietarios` `/imoveis/proprietarios` e `imoveis.inquilinos` `/imoveis/inquilinos` (ambas `pessoaListar.vue` com `meta.papel`), `imoveis.pessoas.criar` `/imoveis/pessoas/criar?papel=`, `imoveis.pessoas.detalhe` `/imoveis/pessoas/:uuid`, `imoveis.imoveis` `/imoveis/imoveis`, `imoveis.imoveis.criar`, `imoveis.imoveis.detalhe` `/imoveis/imoveis/:uuid`.
- `pessoaForm.vue` exporta `novaPessoaForm(papel?)` e `pessoaFormParaInput(form)`; alterna PF (CPF, RG) / PJ (CNPJ, IE, nome fantasia); checkboxes Proprietário/Inquilino/Fiador com o papel da tela pré-marcado.
- `imovelForm.vue`: select de proprietário com busca (`listarPessoas({papel:"proprietario", busca})`) e botão "Novo proprietário".
- Detalhe do imóvel mostra o contrato vigente com link (rota da Task 9).

- [ ] **Step 1: Implementar** http, boot, service, telas, rotas.
- [ ] **Step 2: Verificar** `npm run lint` e `npx vue-tsc --noEmit` sem erros.
- [ ] **Step 3: Verificação manual** com backend local: criar PF com CPF mascarado, PJ, imóvel; editar; erros do backend aparecem no Notify (sem notificação duplicada).
- [ ] **Step 4: Commit** `Adiciona telas de pessoas e imóveis`

### Task 9: Frontend — contratos e painel

**Files:**
- Create: `frontend/src/pages/imoveis/{contratoListar.vue, contratoIncluir.vue, contratoDetalhe.vue, contratoForm.vue, contratoEventoDialog.vue, painel.vue}`
- Modify: `frontend/src/router/routes.ts`

**Interfaces:**
- Consumes: rotas das Tasks 6–7; `contratoHttp`, `painelHttp` (Task 8).
- Produces rotas: `imoveis.painel` `/imoveis`, `imoveis.contratos` `/imoveis/contratos`, `imoveis.contratos.criar` `/imoveis/contratos/criar?imovel=`, `imoveis.contratos.detalhe` `/imoveis/contratos/:uuid`.
- `contratoForm.vue`: na inclusão, todos os campos; na edição, `fim` e `valorAluguel` somente leitura com dica "Use Renovar ou Aditivo".
- `contratoDetalhe.vue`: dados vigentes, botões **Renovar**, **Aditivo**, **Encerrar**, **Rescindir** (abrem `contratoEventoDialog.vue` com `tipo`; Encerrar/Rescindir pedem confirmação via `MessageConfirmation`), e histórico (lista de eventos com anterior → novo).
- `painel.vue`: cards Vencidos · 0–30d · 31–60d · 61–90d · Reajustes no mês · Livres (contagem); clicar num card mostra a lista abaixo; linhas levam ao contrato/imóvel. Vencidos com destaque `negative`.

- [ ] **Step 1: Implementar.**
- [ ] **Step 2: Verificar** `npm run lint` e `npx vue-tsc --noEmit`.
- [ ] **Step 3: Verificação manual**: criar contrato → imóvel vira alugado; renovar → histórico e valores atualizados; encerrar → imóvel livre; painel mostra as faixas; executar também a verificação manual da Task 3 (menus e home).
- [ ] **Step 4: Commit** `Adiciona telas de contratos e painel de imóveis`

### Task 10: Documentação

**Files:**
- Create: `docs/backend/modulos/imoveis.md`, `docs/frontend/modulos/imoveis.md`
- Modify: `docs/README.md` (linha na tabela de módulos + mapa de dependências), `docs/backend/arquitetura.md` (tabela de middlewares com `ModuloIgreja/ModuloImoveis`, seção "Módulos por empresa"), `docs/frontend/arquitetura.md` (menu por módulo, rotas `imoveis.*`)

- [ ] **Step 1: Escrever** — incluir no doc de backend como habilitar o módulo para um escritório:
  ```sql
  INSERT INTO auth_company_modulos (uuid, company_uuid, modulo) VALUES (gen_random_uuid(), '<company_uuid>', 'imoveis');
  -- escritório puro: remover o pacote de igreja
  UPDATE auth_company_modulos SET deleted_at = now() WHERE company_uuid = '<company_uuid>' AND modulo = 'igreja';
  ```
  e o aviso de que o usuário precisa logar de novo (o menu vem do token) e que o cache do backend leva até 5 min.
- [ ] **Step 2: Rodar a suíte final** `cd backend && npx jest src/@modules/imoveis src/http/middleware src/@modules/auth/generateTokenAuthenticationUser && npx tsc --noEmit --incremental false`; `cd frontend && npm run lint` → tudo passa.
- [ ] **Step 3: Commit** `Documenta o módulo de imóveis e os módulos por empresa`
