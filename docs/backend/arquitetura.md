# Arquitetura do backend

NestJS 11 + TypeORM 0.3 (só como driver/migrations — **sem entities do TypeORM**, todo acesso
é SQL cru com `dataSource.query`) + PostgreSQL 17 + Redis. Testes com Jest (+ `@swc/jest`).

```
backend/src
├── main.ts                  bootstrap (CORS, body 50 MB, filtro global de erro, trust proxy)
├── http/                    camada Nest: módulos, controllers, middlewares, cron
│   ├── app.module.ts        TypeORM, Schedule, ConnectionHub (global) e todos os módulos
│   ├── middleware/          DominioMiddleware, JwtAuthMiddleware, perfil (Admin/Interno)
│   ├── shared/              GlobalErrorFilter
│   └── <modulo>/            <modulo>.module.ts + *.controller.ts
├── @modules/                domínio, sem dependência de Nest
│   ├── shared/              ApiError, ApiDate, ApiJwt, ApiString, ApiValidate, ApiSleep, connections/
│   └── <modulo>/<casoDeUso>/
│       ├── <casoDeUso>.usecase.ts
│       ├── <casoDeUso>Repository.ts
│       ├── <x>.entity.ts           (opcional)
│       ├── <x>Gateway.<provedor>.ts (opcional: Asaas, Metabase, SMTP, Vonage)
│       └── __test__/<casoDeUso>.usecase.test.ts
└── @infra/
    ├── database/            datasource.ts, migrations/<modulo>/, seeders/
    ├── cache/               ConnectionCacheRedis (usado)
    └── http|queue|socket|storage   adaptadores prontos, **ainda não usados** (Axios, RabbitMQ, Socket.io, S3)
```

Módulos: [auth](modulos/auth.md) · [usuario](modulos/usuario.md) · [empresa](modulos/empresa.md) ·
[membresia](modulos/membresia.md) · [aprisco](modulos/aprisco.md) ·
[portalEventos](modulos/portalEventos.md) · [financeiro](modulos/financeiro.md) ·
[notificacao](modulos/notificacao.md) · [bi](modulos/bi.md) · [imoveis](modulos/imoveis.md)

## Camadas e responsabilidades

| Camada | Pode | Não deve |
|---|---|---|
| **Controller** (`http/`) | ler `req.companyUuid`/`req.userUuid`, montar o input **campo a campo** a partir do body (whitelist), chamar use case/query, escolher status HTTP | conter regra de negócio ou SQL |
| **Use case** | validar entrada, aplicar regras, orquestrar repositório/gateway, lançar `ApiError` | conhecer Express/Nest |
| **Entity** | invariantes e normalização (`Entity.criar(...)` valida e gera `uuid`) | acessar banco |
| **Repository** | SQL parametrizado (`$1, $2…`), sempre com `company_uuid` e `deleted_at IS NULL` | regra de negócio |
| **Gateway** | falar com serviço externo | gravar no banco |
| **Query** (`<modulo>.query.ts`) | leituras para tela (listas, detalhes) sem passar por use case | escrever (há exceções históricas em `UsuarioQuery`, `FinanceiroQuery`) |

Use cases de outros módulos são reutilizados **instanciando direto**, não via DI:

```ts
const usecase = new EnviarEmailUsecase(new EnviarEmailRepository(this.connectionHub));
```

## Injeção de dependências

`AppModule` é `@Global()` e expõe um único provider, `ConnectionHub`
(`database: DataSource`, `http: AxiosInstance`, `cache: ConnectionCacheRedis`). Cada módulo Nest
registra use cases com uma fábrica:

```ts
function makeProvider<T>(token: new (...args: any[]) => T, factory: (hub: ConnectionHub) => T) {
  return { provide: token, useFactory: (hub: ConnectionHub) => factory(hub), inject: [ConnectionHub] };
}

makeProvider(IncluirApriscoUsecase, (hub) => new IncluirApriscoUsecase(new IncluirApriscoRepository(hub)))
```

`makeProvider` está **copiado** em cada `*.module.ts`; ao criar módulo novo, copie também (ou
extraia para `http/shared` e atualize todos).

## Autenticação, multiempresa e perfis

```
Requisição pública ── DominioMiddleware ── Origin (ou header Tenant se Platform=electron|site|mobile)
                                           → auth_company_domains → req.companyUuid

Requisição logada  ── JwtAuthMiddleware ── Authorization: Bearer <jwt>
                                           → req.userUuid, userName, userPosition, userRoles, companyUuid
                    └─ AdminMiddleware   ── position === "admin"
                    └─ InternoMiddleware ── bloqueia "externo" (role usuario-externo e sem position)
```

Helpers `ehAdmin(req)`, `exigirAdmin(req)`, `exigirInterno(req)` em
`http/middleware/perfil.middleware.ts` servem para checagens pontuais dentro do controller.

**Regra de ouro:** `company_uuid` sai **sempre** do `req` (token ou domínio), nunca do body.
Todo `SELECT/UPDATE/DELETE` filtra por ele.

Mapa de proteção atual:

| Módulo | Middleware |
|---|---|
| auth (login) / public `/ping` | Dominio |
| `publico/eventos` | Dominio + ModuloIgreja |
| `/auth/*` | JWT |
| `/pedidos`, `/cartao-credito` | JWT + ModuloIgreja |
| `/imoveis/*` | JWT + Interno + ModuloImoveis |
| `/membros`, `/apriscos`, `/bi` | JWT + Interno + ModuloIgreja |
| `/usuarios`, `/empresa`, `/notificacoes` | JWT + Admin |
| `/eventos`, `/lotes`, `/contas-bancarias`, `/cobrancas`, `/pagamentos` | JWT + Admin + ModuloIgreja |

Todas as rotas de **igreja** (incluindo o portal público de eventos, `/pedidos`, `/cartao-credito` e
o financeiro) exigem também `ModuloIgrejaMiddleware`; as de imóveis, `ModuloImoveisMiddleware`.
Rotas de auth, usuários, empresa e notificações não dependem de módulo.

### Módulos por empresa

`auth_company_modulos` (`company_uuid`, `modulo`) diz quais pacotes a empresa tem. Os middlewares
`ModuloIgreja`/`ModuloImoveis` (`http/middleware/modulo.middleware.ts`) leem a lista via
`ModuloEmpresaRepository` e a cacheiam no Redis (`modulos:<companyUuid>`, 300 s); sem o módulo →
403 "Módulo não habilitado para esta empresa". O JWT também leva `company.modulos` para o menu do
frontend. Como habilitar e os avisos de cache/relogin: [módulo imóveis](modulos/imoveis.md#módulos-por-empresa-habilitar-o-módulo).

## Erros

Lance `new ApiError(mensagem, statusCode = 400, internalMessage?, data?)`. O
`GlobalErrorFilter` responde:

```json
{ "statusCode": 404, "message": "Aprisco não encontrado", "internalMessage": null, "data": null }
```

`HttpException` do Nest é repassada; qualquer outro erro vira 500 genérico (stack no log).
Por isso **não use `throw new Error`** para erro de negócio.

Mensagens são em português e aparecem direto na tela (o frontend mostra `message`).

## Padrões de resposta

Os módulos mais novos usam:

```json
{ "success": true, "data": ..., "meta": { "total": 123 } }
```

Mais antigos (auth, bi, notificacao, pedidos) devolvem formatos próprios
(`{ token }`, `{ data }`, `{ message }`). Em código novo, prefira o padrão `success/data/meta`.

Paginação: query `pagina` (1-based) e `porPagina` (padrão 20), repositório faz `COUNT(*)` +
`LIMIT/OFFSET`.

## Update parcial

Padrão usado em todos os "editar/alterar": um mapa campo → coluna e só entram no `UPDATE`
os campos `!== undefined` (assim `null` limpa e ausente mantém):

```ts
const COLUNAS = { nome: "nome", diaSemana: "dia_semana" };
for (const [chave, coluna] of Object.entries(COLUNAS)) {
  const valor = data[chave];
  if (valor === undefined) continue;
  valores.push(valor);
  campos.push(`${coluna} = $${valores.length}`);
}
```

Colunas JSON (`meta`) fazem **merge** (`COALESCE(meta,'{}'::jsonb) || $n::jsonb`).

## Banco de dados e migrations

- Tabelas com prefixo do domínio: `auth_*`, `financeiro_*`, `evento_*`/`eventos`,
  `aprisco*`, `notificacao_*`, `bi_*`.
- Colunas padrão: `created_at`, `updated_at`, `deleted_at` (soft delete), `uuid` (PK),
  `company_uuid`, às vezes `index` serial.
- `decimal` volta como `string` no driver `pg` — faça `::float8` no SELECT ou `Number()`.
- `date` → use `TO_CHAR(col, 'YYYY-MM-DD')` para evitar fuso.
- Migrations em `src/@infra/database/migrations/<modulo>/<timestamp>-<nome>.migration.ts`
  (o glob do datasource é `**/*.migration.{ts,js}`). Prefira SQL com `IF NOT EXISTS`.

```bash
npm run migration:create      # cria arquivo modelo (renomeie e mova para a pasta do módulo)
npm run migration:run-dev     # roda com ts (src/)
npm run migration:run         # roda com dist/ (produção, após build)
npm run seed:run              # ⚠️ APAGA auth_users, auth_users_companies e auth_company_domains
```

> ⚠️ Em banco **vazio** as migrations falham em
> `MigrationCreatePagamentosMigration1779555472216` ("multiple primary keys for table
> financeiro_cobrancas"). Hoje não é possível subir um banco do zero só com migrations.

## Testes

- `jest.config.js`: `testMatch: src/**/*.test.ts`, alias `src/...` e `@modules/...`, timeout 30 s.
- A maioria é **integração**: usa `src/@infra/database/datasource` (lê o `.env`), cria dados com
  um `companyUuid` fixo do arquivo e apaga por ele no `afterAll`. Precisa de Postgres (e Redis
  para auth) com o schema aplicado.
- `src/http/middleware/__test__/seguranca.test.ts` é unitário (não usa banco) — regressões de
  segurança de JWT, perfis, código de login, estoque e dono do pedido.

```bash
npm test                                   # tudo (precisa de banco)
npx jest src/http/middleware/__test__      # só os unitários
npx tsc --noEmit --incremental false       # checagem de tipos
```

> **Nunca** aponte os testes para um banco com dados reais: eles fazem `DELETE ... WHERE
> company_uuid = ...`.

## Ambiente local

```bash
cd backend
cp .env.example .env              # preencha AUTH_JWT_SECRET, REDIS_URL, etc.
docker compose -f docker-compose-dev.yml up -d database redis
npm install
npm run migration:run-dev
npm run start:dev                 # http://localhost:3000
```

O `docker-compose-dev.yml` também sobe RabbitMQ, Metabase e o próprio backend
(`Dockerfile.dev` → `start.sh`).

### Variáveis de ambiente usadas no código

| Grupo | Variáveis |
|---|---|
| App | `PORT`, `TZ`, `SYSTEM_URL_API`, `SYSTEM_URL_APP`, `SYSTEM_USER_UUID`, `SYSTEM_COMPANY_UUID` |
| Auth | `AUTH_JWT_SECRET` (obrigatória em produção), `AUTH_JWT_EXPIRES_IN` |
| Banco | `DB_DEFAULT_DRIVER/HOST/PORT/NAME/USENAME` (sic)`/PASSWORD/SCHEMA/SSL` |
| Cache | `REDIS_URL` |
| E-mail/SMS | `NOTIFICACAO_SMTP_HOST/PORT/SECURE/USER/PASS`, `NOTIFICACAO_VONAGE_APIKEY/APISECRET` |
| BI | `METABASE_SECRET_KEY` |
| Financeiro | `VERIFICAR_PAGAMENTOS_COMPANIES` |
| Infra não usada | `RABBITMQ_*`, `SOCKET_*`, `STORAGE_*` |

`.env.example` não lista `REDIS_URL`, `METABASE_SECRET_KEY` nem as de notificação.

## Receita: novo caso de uso

1. `src/@modules/<modulo>/<casoDeUso>/` com `usecase`, `Repository` (e `entity` se houver regra).
2. Input tipado com `companyUuid` (e `userUuid` se necessário); valide no início e lance `ApiError`.
3. Repository: SQL parametrizado, `company_uuid` + `deleted_at IS NULL`, transação
   (`connections.database.transaction(async (manager) => …)`) quando houver mais de uma escrita.
4. Registre no `<modulo>.module.ts` com `makeProvider` e injete no controller.
5. No controller, monte o input campo a campo do `body` (nunca `...body`).
6. Escolha o middleware certo (ver tabela acima) ou use `exigirAdmin(req)`.
7. Teste em `__test__/` (integração com `companyUuid` próprio + limpeza no `afterAll`).
8. Atualize a página do módulo em `docs/backend/modulos/`.

## Convenções de código

- Nomes de domínio em **português** (`incluir`, `alterar`, `listar`, `deletar`, `vincular`);
  infraestrutura/herança em inglês (`TokenGenerateUseCase`, `company`, `user`).
- Prettier: aspas duplas, `printWidth: 150`, trailing comma.
- `strictNullChecks: false`, `noImplicitAny: false` — o compilador não pega `null`; seja
  explícito com `?.` e `??`.
- Typos históricos já espalhados (mantenha ao referenciar): `cobanca_uuid`, `biRepostiory`,
  `bi.enitty`, `VerificarPagamentoRepostiory`, `buscarGatewaty`, `savarCobranca`,
  `tokenGenegate`, `decoderTokenAuthentication.uscase.ts`, `queueConnection.rabbtimq.ts`,
  `DB_DEFAULT_USENAME`, `Disvincular`.
