# Módulo BI (backend)

> Catálogo de painéis/perguntas do **Metabase** e geração do token de *embedding* assinado
> para exibi-los dentro do Kehila.

- Código: `backend/src/@modules/bi/` (nomes com typo: `bi.enitty.ts`, `biRepostiory.ts`)
- HTTP: `backend/src/http/bi/` (`BiController`, base `/bi`)
- Tabela: `bi_sumario` (`uuid`, `company_uuid`, `gateway`, `referencia jsonb`, `titulo`,
  `descricao`, `parametros jsonb`, `roles jsonb`, soft delete)
- Infra: serviço `metabase` no `docker-compose-dev.yml`
- Frontend: [frontend › BI](../../frontend/modulos/bi.md)

## Acesso

`JwtAuthMiddleware` + `InternoMiddleware`. Salvar e remover exigem admin (`exigirAdmin`).

## Endpoints

| Método | Rota | O que faz |
|---|---|---|
| POST | `/bi` | Lista (máx. 30). Body `{ filtros: { pesquisa } }` → busca full-text `to_tsvector('portuguese', titulo || descricao)` com prefixo (`palavra:*`, OR) |
| POST | `/bi/salvar` | Com `uuid` → `BiEditarUsecase`; sem → `BiIncluirUsecase`. Upsert `ON CONFLICT (uuid)` restrito à mesma empresa |
| DELETE | `/bi/:uuid` | Soft delete |
| GET | `/bi/:uuid/montar` | `BiMontarUsecase` → token JWT para o iframe do Metabase |

`referencia` = `{ tipo: "dashboard" | "question", valor: "<id numérico no Metabase>" }`.

## Embedding (`biGateway.metabase.ts`)

Assina com `METABASE_SECRET_KEY` (expira em 10 min):

```json
{ "resource": { "dashboard": 12 }, "params": { "companyUuid": "<empresa>" } }
```

O painel no Metabase **precisa** ter o parâmetro `companyUuid` *locked* e filtrar por ele — é
isso que isola os dados entre empresas. O frontend monta a URL do iframe com o token.

## Atenção

- `biListar` **não filtra `company_uuid`**: lista BIs de todas as empresas. O filtro por
  `roles` está comentado. (`montar`/`findBi` filtram corretamente.)
- `BiIncluirUsecase` ignora `roles` no create (só a edição grava).
- `parametros` é salvo mas não é usado ao montar o token.
- Variável necessária: `METABASE_SECRET_KEY` (não está no `.env.example`).
