# Módulo Empresa (backend)

> Dados cadastrais da empresa (igreja / tenant), seus domínios de acesso e o layout público
> da tela de login.

- Código: `backend/src/@modules/empresa/`
- HTTP: `backend/src/http/empresa/` (`EmpresaController` em `/empresa`, `DominioController`
  em `/empresa/dominios`) e `backend/src/http/public/` (`GET /ping`)
- Tabelas: `auth_companies`, `auth_company_domains`, `auth_company_templates` (não usada no código atual)
- Frontend: [frontend › empresa](../../frontend/modulos/empresa.md)

## Multiempresa (tenant)

Cada requisição pertence a uma empresa:

- **Rotas públicas** (`/ping`, login, portal de eventos público): o `DominioMiddleware`
  resolve a empresa a partir do **domínio** (`auth_company_domains.domain`, ativo e não
  deletado). O domínio vem do header `Origin`; se `Platform` ∈ `electron | site | mobile`,
  vem do header `Tenant`.
- **Rotas autenticadas**: a empresa vem do JWT (`company.uuid`).

> O valor salvo em `domain` precisa bater **exatamente** com o `Origin` enviado pelo navegador
> (ex.: `http://localhost:9000`, com protocolo e porta, sem barra final). O seeder usa
> `SYSTEM_URL_APP`.

## Endpoints

Todos com `JwtAuthMiddleware` + `AdminMiddleware`, sempre sobre a empresa do token.

| Método | Rota | Use case |
|---|---|---|
| GET | `/empresa` | `DetalharEmpresaUsecase` |
| PUT | `/empresa` | `EditarEmpresaUsecase` — update parcial; `name`/`cpfCnpj` não podem ficar vazios; `address` é JSON |
| DELETE | `/empresa` | `DeletarEmpresaUsecase` — soft delete da **própria** empresa |
| POST | `/empresa/dominios` | `CriarDominioUsecase` (`active` padrão `true`) |
| GET | `/empresa/dominios` | `ListarDominiosUsecase` |
| PUT | `/empresa/dominios/:uuid` | `EditarDominioUsecase` |
| DELETE | `/empresa/dominios/:uuid` | `DeletarDominioUsecase` (soft delete) |
| GET | `/ping` | `LayoutQuery.buscarLayoutCompanyUuid` (público, via domínio) |

### Layout (`layout/layout.query.ts`)

`auth_companies.layout` (jsonb) com fallback:

```json
{ "telaLogin": { "titulo": "Kehila", "subTitulo": "Bem-vindo" },
  "header":    { "titulo": "Kehila", "subTitulo": "" } }
```

O frontend chama `/ping` no boot para descobrir se o domínio é válido e qual layout usar.

**Edição:** `PUT /empresa` (e `PUT /admin/empresas/:uuid`) aceitam
`layout: { header?: { titulo, subTitulo }, telaLogin?: { titulo, subTitulo } }`, validado por
`layout/layoutRegras.ts` (`normalizarLayout`): só essas seções/campos, texto até 120
caracteres, aparado; vazio vira `null` e o `/ping` usa o padrão acima (ex.: subtítulo do login
vazio mostra "Bem-vindo"). O update faz merge raso (`layout || $novo`): troca só as seções
enviadas e preserva outras chaves do JSON. `GET /empresa` e `GET /admin/empresas/:uuid`
devolvem `layout` cru (sem os padrões).

### Imagem de fundo do login (`layout/imagemLogin/imagemLogin.ts`)

| Método | Rota | O quê |
|---|---|---|
| POST | `/empresa/layout/imagem-login` | multipart, campo `arquivo`; devolve `{ imagemLoginUrl }` |
| DELETE | `/empresa/layout/imagem-login` | volta para a imagem padrão |

O Admin tem as mesmas rotas em `/admin/empresas/:uuid/layout/imagem-login`.

- Formato conferido pelos bytes iniciais (PNG, JPG ou WEBP; SVG não), até 5 MB.
- Variáveis: `STORAGE_REGION`, `STORAGE_KEYID`, `STORAGE_ACCESSKEY`, `STORAGE_BUCKET` e
  `STORAGE_BASE_URL` (opcional: endpoint de provedor compatível com S3 — MinIO, Spaces, R2,
  Wasabi —, usado em path-style; vazio = AWS; sem região, vai `auto`). Ver `criarClienteS3`.
- Vai para o S3 (`ConnectionStorageAwsS3`) em
  `empresas/<uuid>/layout/login-<timestamp>.<ext>`; o caminho fica em `layout.imagemLogin`
  (chave de topo, então editar `header`/`telaLogin` não apaga a imagem).
- `/ping` devolve `telaLogin.imagemUrl` (URL assinada, 6 h) ou `null`; os detalhes da empresa
  devolvem `imagemLoginUrl`. Se o S3 falhar ao assinar, vem `null` e o login usa a imagem padrão.
- Remover só desvincula: o arquivo antigo continua no bucket (`StorageInterface` não tem
  delete). Trocar a imagem também deixa a anterior lá.

## Regras de domínio

`/empresa/dominios` (e o [módulo admin](admin.md)) usam `dominioRegras.ts`: o valor é normalizado
(minúsculas, sem barra final, sem porta padrão `:443`/`:80`) e precisa ser uma origem
`http(s)://host[:porta]`; `active` deve ser booleano (senão 400); não pode repetir
um domínio ativo de outra empresa, nem ao criar, editar ou reativar (409 "Este domínio já está em uso por outra empresa") e a empresa
não pode ficar sem domínio ativo (desativar/deletar o último → "A empresa precisa de pelo menos
um domínio ativo").

## Atenção

- A unicidade de domínio é validada só na aplicação (sem índice único no banco; há janela de
  corrida em requisições simultâneas).
- `DELETE /empresa` não bloqueia acesso: `DominioMiddleware` e JWT não checam
  `auth_companies.deleted_at`.
- O seeder `CompanyDomainsSeeder` executa `DELETE FROM auth_company_domains` (todas as
  empresas). Nunca rode `seed:run` em produção.
