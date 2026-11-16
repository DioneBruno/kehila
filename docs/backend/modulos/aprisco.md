# Módulo Aprisco (backend)

> Aprisco = célula / pequeno grupo que se reúne semanalmente. O módulo cuida do cadastro dos
> apriscos, de quem participa de cada um (integrantes com papéis) e do registro de presença
> por reunião.

- Código: `backend/src/@modules/aprisco/`
- HTTP: `backend/src/http/aprisco/` (`ApriscoController`, rota base `/apriscos`)
- Migrations: `backend/src/@infra/database/migrations/aprisco/`
- Frontend correspondente: [frontend › aprisco](../../frontend/modulos/aprisco.md)

## Acesso

`JwtAuthMiddleware` + `InternoMiddleware` em todo o controller: qualquer usuário **interno**
(não `usuario-externo`) acessa. A exclusão de aprisco exige `position === "admin"` (checagem
inline no controller).

> ⚠️ Não há checagem de liderança no backend: qualquer usuário interno pode alterar qualquer
> aprisco, vincular integrantes e registrar presença em qualquer aprisco da empresa. A restrição
> "líder só vê os seus" existe apenas no frontend (rota `/apriscos/liderados`). Ver
> [pendências](../../pendencias.md).

## Tabelas

| Tabela | Chave | Observações |
|---|---|---|
| `apriscos` | `uuid` | `index` serial (número amigável), `nome`, `dia_semana`, `horario` (HH:MM), `endereco`, `latitude`/`longitude` `decimal(10,7)`, `status` (`ativo`/`inativo`), soft delete (`deleted_at`) |
| `aprisco_integrantes` | `uuid` | FK `aprisco_uuid → apriscos`, FK `pessoa_uuid → auth_pessoas` (`ON DELETE CASCADE`), `papel`. Índice único parcial: 1 vínculo ativo por (empresa, aprisco, pessoa) |
| `aprisco_presencas` | `uuid` | `tipo` CHECK (`INTEGRANTE`/`CRIANCA`/`VISITANTE`), `pessoa_uuid` opcional, `data_reuniao date`, `presenca bool`, `quantidade int ≥ 0`. Índice único parcial por (empresa, aprisco, data, tipo, pessoa-ou-zero) |

Todas as consultas filtram `company_uuid` e `deleted_at IS NULL`.

## Regras de domínio (entities)

`incluirAprisco/aprisco.entity.ts`
- Nome obrigatório (trim).
- `status` ∈ `ativo | inativo` (padrão `ativo`).
- `diaSemana` ∈ `Segunda…Domingo` (com acento, capitalizado) ou `null`.
- `horario` normalizado para `HH:MM` 24h; aceita `8:30` → `08:30`; vazio → `null`.
- Latitude/longitude **sempre em par** (ambas ou nenhuma), com faixas válidas.

`vincularIntegrante/integrante.entity.ts`
- `papel` ∈ `LIDER | AUXILIAR | ANFITRIAO | MEMBRO` (padrão `MEMBRO`, case-insensitive).

`registrarPresenca/presenca.entity.ts`
- `dataReuniao` estritamente `AAAA-MM-DD` e data real (rejeita `2024-02-30`).
- `INTEGRANTE` exige `pessoaUuid`; `CRIANCA`/`VISITANTE` exigem `quantidade` inteira ≥ 0
  (com pessoa identificada, padrão 1).
- `tipo` normalizado sem acento/maiúsculo (`criança` → `CRIANCA`).

## Casos de uso

| Use case | Endpoint | O que faz |
|---|---|---|
| `IncluirApriscoUsecase` | `POST /apriscos` | Cria via `ApriscoEntity.criar` → `{ uuid }` |
| `AlterarApriscoUsecase` | `PUT /apriscos/:uuid` | Update parcial: só campos `!== undefined` entram no `UPDATE` (mapa `COLUNAS`) |
| `DeletarApriscoUsecase` | `DELETE /apriscos/:uuid` | Soft delete (admin) |
| `VincularIntegranteUsecase` | `POST /apriscos/:uuid/integrantes` | Valida aprisco, pessoa e duplicidade (409) |
| `DisvincularIntegranteUsecase` | `DELETE /apriscos/:uuid/integrantes/:integranteUuid` | Soft delete do vínculo (o id é o do registro em `aprisco_integrantes`, não o da pessoa) |
| `RegistrarPresencaUsecase` | `POST /apriscos/:uuid/presencas` | Upsert transacional de todas as presenças da reunião |

`RegistrarPresencaUsecase` — corpo:

```json
{
  "dataReuniao": "2026-11-12",
  "integrantes": [{ "pessoaUuid": "…", "presenca": true }],
  "criancas": 3,
  "visitantes": 1
}
```

- `criancas`/`visitantes` `null`/ausente = **não altera** o valor já gravado.
- Integrante repetido → 400; pessoa que não é integrante do aprisco → 422.
- Gravar de novo a mesma reunião **atualiza** (SELECT + UPDATE/INSERT dentro de transação).

## Queries (`aprisco.query.ts`)

| Método | Endpoint | Notas |
|---|---|---|
| `listarApriscos` | `GET /apriscos` | ordenado por nome |
| `listarApriscosLiderados` | `GET /apriscos/liderados` | apriscos em que o usuário logado é `LIDER` |
| `buscarAprisco` | `GET /apriscos/:uuid` | 404 se não achar |
| `listarIntegrantes` | `GET /apriscos/:uuid/integrantes` | ordem: LIDER, AUXILIAR, ANFITRIAO, MEMBRO, depois nome |
| `listarPresencas` | `GET /apriscos/:uuid/presencas?data=AAAA-MM-DD` | |

**Ligação usuário ↔ pessoa:** não existe FK entre `auth_users` e `auth_pessoas`. O vínculo é
feito por **CPF ou e-mail iguais (trim) na mesma empresa** — mesmo critério de
`MembresiaQuery.buscarMembro`. Se o CPF/e-mail do membro mudar, o usuário perde a liderança.

`latitude::float8` no SELECT existe para o driver `pg` devolver `number` em vez de `string`
(decimal). Mantenha esse cast em novas queries.

## Testes

`__test__/aprisco.query.test.ts` e um teste por use case. São **testes de integração** contra
Postgres real (ver [arquitetura › testes](../arquitetura.md#testes)). Usam `company_uuid` fixo e
limpam por ele no `afterAll`.

## Como evoluir

- Nova coluna em `apriscos`: migration em `migrations/aprisco/`, adicionar em
  `COLUNAS_APRISCO` (query), em `COLUNAS` (alterar), em `ApriscoEntity`/`IncluirApriscoRepository`
  e em `camposAprisco()` no controller (whitelist do body).
- Regras de permissão por liderança devem entrar no use case (receber `userUuid` e consultar
  `aprisco_integrantes`), não só no frontend.
