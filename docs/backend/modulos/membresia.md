# Módulo Membresia (backend)

> Cadastro de pessoas da igreja (membros, congregados, visitantes), vínculos familiares entre
> elas e geração de usuário de acesso a partir de um membro.

- Código: `backend/src/@modules/membresia/`
- HTTP: `backend/src/http/membresia/` (`MembresiaController`, rota base `/membros`)
- Tabelas: `auth_pessoas`, `auth_pessoas_vinculos` (migrations em `migrations/auth/`)
- Frontend: [frontend › membresia](../../frontend/modulos/membresia.md)

## Acesso

`JwtAuthMiddleware` + `InternoMiddleware`. `DELETE /membros/:uuid` e
`POST /membros/:uuid/usuario` chamam `exigirAdmin(req)`.

## Conceitos importantes

- **Pessoa ≠ Usuário.** `auth_pessoas` é o cadastro pastoral (escopo de uma empresa).
  `auth_users` é a credencial de login, **global** (um usuário pode pertencer a várias
  empresas via `auth_users_companies`). Não há FK entre elas: a correspondência é por
  CPF ou e-mail.
- Flags do membro: `ativo`, `membro`, `batizado`, `transferido` (padrões na criação:
  `true, true, false, false`). Note que o **default do banco** é `false` para todos — quem
  grava pelo use case recebe os padrões da entity.
- `meta` (json) guarda dados livres. No `PUT`, `meta` é **mesclado** com o atual
  (`jsonb ||`), não substituído.

## Tabelas

| Tabela | Observações |
|---|---|
| `auth_pessoas` | `uuid` (gerado no código), `company_uuid`, dados pessoais, endereço (`endereco_*`), `data_nascimento date`, `meta json`, soft delete |
| `auth_pessoas_vinculos` | `pessoa_uuid`, `pessoa_vinculada_uuid`, `tipo`. **Sem soft delete** (remoção é `DELETE`) |

## Casos de uso

| Use case | Endpoint | Notas |
|---|---|---|
| `IncluirMembroUsecase` | `POST /membros` | `MembroEntity.criar` (nome obrigatório) |
| `AlterarMembroUsecase` | `PUT /membros/:uuid` | update parcial por mapa `COLUNAS`; `meta` em merge |
| `DeletarMembroUsecase` | `DELETE /membros/:uuid` | soft delete (admin) |
| `VinculoEntreMembrosUsecase` | `POST /membros/:uuid/vinculos` | aceita `{ vinculos: [...] }` ou um vínculo solto no body |
| `RemoverVinculoUsecase` | `DELETE /membros/:uuid/vinculos/:vinculoUuid` | apaga o par (direto + inverso) |
| `CriarUsuarioUsecase` | `POST /membros/:uuid/usuario` | cria/reaproveita `auth_users` e vincula à empresa (admin) |

### Vínculos familiares

`vinculoEntreMembros/vinculo.entity.ts`

- Leitura: **"pessoaVinculada é `<tipo>` de pessoa"**. Ex.: `{ pessoa: João, vinculada: Maria, tipo: MAE }`
  → Maria é mãe de João.
- Tipos: `PAI, MAE, FILHO, FILHA, CONJUGE, IRMAO, IRMA, AVO, NETO, NETA, TIO, TIA, SOBRINHO, SOBRINHA, OUTRO`.
- Todo vínculo é gravado **em par** com o inverso (`INVERSOS_VINCULO`). Como o sexo não é
  cadastrado, o chamador pode escolher `tipoInverso` (ex.: PAI → FILHO ou FILHA); sem ele, usa o
  primeiro da lista.
- Bloqueios: vincular a si mesmo; membro repetido na mesma requisição; vínculo já existente
  em qualquer direção (409); membro inexistente (404).
- O `INSERT` dos pares é um único comando (atômico).

### Criar usuário a partir do membro

`criarUsuario/criarUsuario.usecase.ts`

1. Membro precisa ter nome e CPF **ou** e-mail.
2. Procura `auth_users` com mesmo CPF/e-mail (global). Se já está na empresa → erro; se existe
   em outra empresa → **reaproveita** e só cria `auth_users_companies`.
3. Senha opcional (hash bcrypt custo 10). Sem senha, o login só funciona por código enviado
   por e-mail.
4. `apriscoUuid` opcional: também vincula o membro como `MEMBRO` do aprisco (sem duplicar).
5. Tudo em transação.

> ⚠️ `auth_users.estado_civil` é `varchar(10)` e `auth_pessoas.estado_civil` não tem limite.
> Valores longos (ex.: "Divorciado(a)") quebram a criação do usuário. Ver
> [pendências](../../pendencias.md).

## Queries (`membresia.query.ts`)

- `listarMembros` — todos os ativos (sem paginação; o frontend filtra em memória).
- `buscarMembro` — inclui `usuarioUuid` (usuário vinculado por CPF/e-mail).
- `listarVinculos` — vínculos do membro com o nome do vinculado.

Datas saem como `TO_CHAR(data_nascimento, 'YYYY-MM-DD')` para evitar deslocamento de fuso.

## Testes

Um `__test__` por use case + `__test__/membresia.query.test.ts`. Integração com Postgres.
