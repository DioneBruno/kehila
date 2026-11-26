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
Não há endpoint para editar `layout` — hoje só via banco.

## Regras de domínio

`/empresa/dominios` (e o [módulo admin](admin.md)) usam `dominioRegras.ts`: o valor é normalizado
(minúsculas, sem barra final) e precisa ser uma origem `http(s)://host[:porta]`; não pode repetir
um domínio ativo de outra empresa (409 "Este domínio já está em uso por outra empresa") e a empresa
não pode ficar sem domínio ativo (desativar/deletar o último → "A empresa precisa de pelo menos
um domínio ativo").

## Atenção

- A unicidade de domínio é validada só na aplicação (sem índice único no banco; há janela de
  corrida em requisições simultâneas).
- `DELETE /empresa` não bloqueia acesso: `DominioMiddleware` e JWT não checam
  `auth_companies.deleted_at`.
- O seeder `CompanyDomainsSeeder` executa `DELETE FROM auth_company_domains` (todas as
  empresas). Nunca rode `seed:run` em produção.
