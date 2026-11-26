# Módulo Usuário (backend)

> Administração dos usuários de acesso (login) de uma empresa: criar, listar, detalhar,
> editar e remover o acesso.

- Código: `backend/src/@modules/usuario/`
- HTTP: `backend/src/http/usuario/` (`UsuarioController`, base `/usuarios`)
- Tabelas: `auth_users` (global) + `auth_users_companies` (vínculo por empresa)
- Frontend: [frontend › usuario](../../frontend/modulos/usuario.md)

## Acesso

`JwtAuthMiddleware` + `AdminMiddleware` em tudo (só `position === "admin"`).

## Modelo

```
auth_users (global: nome, cpf, email, phone, password, endereço, estado_civil, data_nascimento, meta jsonb)
   1 ── n  auth_users_companies (company_uuid, position, roles json, is_accepted, deleted_at)
```

- **Dados de acesso** (senha, e-mail, CPF, telefone) vivem em `auth_users` e valem para todas
  as empresas do usuário.
- **Permissões** (`position`, `roles`, `is_accepted`) vivem no vínculo e são por empresa.
- Remover usuário = soft delete **só do vínculo** com a empresa atual
  (`auth_users_companies.deleted_at`). O registro global continua.
- Não há `UNIQUE` em `auth_users.cpf/email` no banco; a unicidade é checada no código
  apenas dentro da empresa.

## Endpoints / casos de uso

| Método | Rota | Use case | Regras |
|---|---|---|---|
| POST | `/usuarios` | `CriarUsuarioUsecase` | nome obrigatório; CPF **ou** e-mail; CPF válido (dígitos verificadores); e-mail válido; não pode já existir **nesta** empresa |
| GET | `/usuarios?busca=&pagina=&porPagina=` | `ListarUsuariosUsecase` | `ILIKE` em nome/e-mail/CPF; `porPagina` limitado a 1–100; retorna `{ data, meta: { total } }` |
| GET | `/usuarios/cargos` | `UsuarioQuery.listarCargos` | lista fixa: `admin`, `usuario` |
| GET | `/usuarios/:uuid` | `DetalharUsuarioUsecase` | inclui `randomCode` (ver aviso abaixo) |
| PUT | `/usuarios/:uuid` | `EditarUsuarioUsecase` | ver regras abaixo |
| DELETE | `/usuarios/:uuid` | `DeletarUsuarioUsecase` | não pode remover o próprio acesso |

### Regras de edição (`EditarUsuarioUsecase`)

- `uf` com 2 letras; `estadoCivil` ∈ `solteiro, casado, divorciado, separado, viuvo, uniao`;
  `dataNascimento` `AAAA-MM-DD` e não futura; CEP só dígitos.
- `meta` aceita só `batizado` e `outraIgreja` (booleanos) e é **mesclado** (`jsonb ||`).
- **Proteção multiempresa:** se o usuário pertence a outra empresa, um admin desta **não**
  pode mudar senha, e-mail, CPF ou telefone (403). Só o próprio usuário, via
  `/auth/editar-perfil`.
- Senha é re-hasheada (bcrypt 10) e atualiza `password_date_update`.
- **Último administrador:** remover (`DELETE`), rebaixar o cargo ou desativar (`isAccepted = false`)
  o último admin ativo da empresa → `A empresa precisa de pelo menos um administrador`. Vale em
  `/usuarios` e nas rotas do Admin.
- **Override do Admin:** o parâmetro `permitirAlterarAcessoCompartilhado` (só o `AdminEmpresaController`
  passa `true`) dispensa a proteção multiempresa acima; ver [admin](admin.md).
- **Login:** só autentica quem tem vínculo ativo (`auth_users_companies.deleted_at IS NULL`) com a
  empresa do domínio. O JWT já emitido continua válido até expirar após a remoção do acesso.

## `UsuarioQuery` (compartilhada com Auth)

- `buscarUsuarioPorUuid` — usado por `/auth/me`; devolve também os cartões de crédito do usuário
  (`financeiro_cartao_credito`, só os 4 últimos dígitos).
- `editarPerfilUsuario` — `/auth/editar-perfil`; `COALESCE` campo a campo (campo ausente mantém
  o valor).

## Atenção

- `DetalharUsuarioRepository` lê do Redis os **códigos de login ativos** do usuário
  (`auth_random_code:<empresa>:<cpf|email>`) e devolve em `randomCode`. Isso permite ao admin
  entrar como o usuário (suporte). É intencional? Ver [pendências](../../pendencias.md).
- `CriarUsuarioRepository` (este módulo) **sempre cria** um novo `auth_users`, enquanto
  `membresia/criarUsuario` **reaproveita** um usuário global existente. Escolha consciente ao
  evoluir; hoje é possível duplicar o mesmo CPF entre empresas.
- Os dois `INSERT` de criação não estão em transação.
- `/auth/editar-perfil` não valida CPF/e-mail nem checa duplicidade.
