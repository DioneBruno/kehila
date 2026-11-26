# Módulo Admin (backend)

> Gestão de empresas (tenants) da plataforma: cadastrar, editar dados, domínios e módulos de
> **qualquer** empresa. Só quem acessa por uma empresa com o módulo `admin` (a "empresa-admin").

- Código: `backend/src/@modules/admin/` (`admin.query.ts`, `cadastrarEmpresa/`, `definirModulos/`)
- HTTP: `backend/src/http/admin/` (`AdminEmpresaController` em `/admin/empresas`)
- Regras compartilhadas: `@modules/empresa/dominio/dominioRegras.ts`, `@modules/empresa/modulos/modulos.ts`
- Comando: `backend/src/@infra/database/scripts/criarEmpresaAdmin.ts`
- Frontend: [frontend › admin](../../frontend/modulos/admin.md)

## Proteção

`JwtAuthMiddleware` + `AdminMiddleware` (position `admin`) + `ModuloAdminMiddleware` (a empresa do
token precisa ter o módulo `admin` em `auth_company_modulos`; senão `403 "Módulo não habilitado
para esta empresa"`). Os módulos válidos são `igreja`, `imoveis` e `admin` (`ModuloChave`).

## Endpoints

Prefixo `/admin/empresas`. `:uuid` inválido ou empresa apagada/inexistente → `404 "Empresa não encontrada"`.

| Método | Rota | O que faz |
|---|---|---|
| GET | `/` | Lista empresas não deletadas (`busca` por nome, fantasia, CPF/CNPJ ou domínio; `pagina`, `porPagina` ≤ 100, padrão 20). Resposta `{success,data,meta:{total}}`, cada item com `modulos` e `dominios` (na listagem, apenas domínios **ativos**; o detalhe mostra todos). |
| POST | `/` | `CadastrarEmpresaUsecase` — empresa + domínio + módulos + usuário admin numa transação. `201 {data:{uuid}}`. |
| GET | `/:uuid` | Detalhe: dados cadastrais, `modulos` e `dominios` (uuid, domain, active). |
| PUT | `/:uuid` | Reaproveita `EditarEmpresaUsecase` (mesmas regras de `PUT /empresa`, inclusive `layout`). |
| GET/POST | `/:uuid/dominios` | Reaproveita `ListarDominiosUsecase` / `CriarDominioUsecase`. |
| PUT/DELETE | `/:uuid/dominios/:dominioUuid` | Reaproveita `EditarDominioUsecase` / `DeletarDominioUsecase`. |
| PUT | `/:uuid/modulos` | `DefinirModulosEmpresaUsecase` — `{ modulos: string[] }`. |
| GET | `/:uuid/usuarios` | `ListarUsuariosUsecase` da empresa `:uuid` (`busca`, `pagina`, `porPagina`). `{success,data,meta:{total}}`. |
| GET | `/:uuid/usuarios/:usuarioUuid` | `DetalharUsuarioUsecase` + `outrasEmpresas: [{uuid,name}]` (outras empresas com vínculo ativo do usuário). |
| POST | `/:uuid/usuarios` | `CriarUsuarioUsecase` na empresa `:uuid`. `201`. |
| PUT | `/:uuid/usuarios/:usuarioUuid` | `EditarUsuarioUsecase` com `permitirAlterarAcessoCompartilhado: true`. |
| DELETE | `/:uuid/usuarios/:usuarioUuid` | `DeletarUsuarioUsecase` (remove só o vínculo com `:uuid`); não deixa remover o próprio acesso. |

## Usuários de qualquer empresa

Reaproveitam os use cases de [usuário](usuario.md) passando `companyUuid = :uuid` (a empresa da URL,
não a do token). `usuarioUuid` inválido → `404 "Usuário não encontrado"`.

- **Override do Admin:** na edição, o Admin pode alterar senha, e-mail, CPF e telefone mesmo quando o
  usuário tem vínculo com outra empresa (a proteção multiempresa de `/usuarios` retorna 403). Esses
  dados vivem em `auth_users` e mudam para todas as empresas; a tela avisa quais são
  (`outrasEmpresas`).
- **Último administrador:** remover, rebaixar de `admin` ou desativar (`is_accepted = false`) o último
  admin ativo da empresa → `A empresa precisa de pelo menos um administrador`. A regra vive nos use
  cases, então vale também em `/usuarios`.
- **Login:** exige vínculo ativo (`auth_users_companies.deleted_at IS NULL`). Usuário sem vínculo na
  empresa do domínio não entra; o token já emitido continua válido até expirar (ver
  [pendências](../../pendencias.md)).

## Cadastro de empresa (`POST /admin/empresas`)

Corpo: `{ empresa: {...}, dominio, modulos, admin: {...} }`. Tudo ocorre em **uma transação**
(`CadastrarEmpresaRepository.cadastrar`): `auth_companies` (com `tenant_id = uuid`),
`auth_company_domains` (ativo), `auth_company_modulos` (uma linha por módulo), `auth_users` (senha
em bcrypt) e `auth_users_companies` (`position = 'admin'`, `is_accepted = true`). Qualquer falha
desfaz tudo.

Validações, na ordem, com as mensagens (todas `ApiError` 400, exceto onde indicado):

| Regra | Mensagem |
|---|---|
| nome da empresa vazio | `O nome da empresa é obrigatório` |
| CPF/CNPJ vazio | `O CPF/CNPJ é obrigatório` |
| domínio vazio | `O domínio é obrigatório` |
| domínio fora do formato de origem | `Informe o domínio como origem, ex.: https://app.exemplo.com.br` |
| domínio já ativo em outra empresa (409) | `Este domínio já está em uso por outra empresa` |
| módulos vazios | `Informe pelo menos um módulo` |
| módulo desconhecido | `Módulo inválido: <valor>` |
| nome do admin vazio | `O nome do usuário é obrigatório` |
| sem CPF e sem e-mail | `Informe o CPF ou o e-mail do usuário` |
| CPF / e-mail inválidos | `CPF inválido` / `E-mail inválido` |
| senha com menos de 8 caracteres | `A senha deve ter pelo menos 8 caracteres` |

O usuário admin é **sempre uma nova linha** em `auth_users` (não reaproveita CPF/e-mail já
existente, e não há `UNIQUE` no banco — ver pendência B5).

## Regras de domínio (`dominioRegras.ts`)

Valem no Admin **e também em `/empresa/dominios`** (criar, editar, deletar):

- **Normalização** (`normalizarDominio`): `trim`, minúsculas, remove barras finais; precisa casar
  `^https?://[a-z0-9.-]+(:porta)?$` (origem, sem caminho). Ex.: `HTTP://Admin.localhost:9000/` →
  `http://admin.localhost:9000`. As portas padrão são removidas (`:443` em https, `:80` em http),
  pois o browser envia o `Origin` sem elas. Valor não-string → 400 `Campo domain inválido`.
- **Unicidade** (`garantirDominioLivre`): não pode existir outro domínio **ativo e não deletado**
  igual, comparando `lower(rtrim(domain, '/'))` (pega valores antigos salvos com barra/maiúscula).
  Ao editar, ignora o próprio registro; **também é checada ao reativar** (`active: true`) um domínio
  existente. Conflito → 409. **Não há índice único no banco**; a
  garantia é só da aplicação.
- **`active` booleano**: criar/editar com `active` que não seja `true`/`false` → 400
  `Campo active inválido`.
- **Último domínio ativo** (`garantirNaoEhUltimoAtivo`): desativar ou deletar o único domínio ativo
  da empresa → `A empresa precisa de pelo menos um domínio ativo`.

## Definir módulos (`PUT /:uuid/modulos`)

1. Valida a lista (`validarModulos`: não vazia, só valores válidos, remove duplicados).
2. Empresa inexistente → 404.
3. Se a empresa é a **própria** do token e a lista não tem `admin` → `Não é possível remover o
   módulo Admin da própria empresa` (evita a empresa-admin se trancar para fora).
4. Em transação: soft delete (`deleted_at = now()`) dos módulos que saíram e `INSERT` dos que
   entraram (módulo já ativo não é tocado; reativar = nova linha, por causa do índice único parcial).
5. Apaga `modulos:<companyUuid>` no Redis na hora (falha de cache só é logada). Devolve a lista.

> O **menu** do frontend vem de `company.modulos` no JWT: usuários dessa empresa só enxergam a
> mudança depois de **logar de novo**. O bloqueio das rotas no backend vale imediatamente.

## Comando `admin:criar`

Cria a primeira empresa-admin (módulo `admin` apenas) e seu usuário administrador.

```bash
cd backend
npm run admin:criar -- --dominio http://admin.localhost:9000 --email admin@exemplo.com
# produção (após o build):
npm run admin:criar:prod -- --dominio https://admin.exemplo.com --email admin@exemplo.com
```

| Flag | Obrigatória | Padrão |
|---|---|---|
| `--dominio` | sim | — |
| `--email` | sim | — |
| `--nome` | não | `Administrador` |
| `--empresa` | não | `empresa-admin` |
| `--cnpj` | não | `00000000000000` |

A senha vem de `ADMIN_SENHA` ou, se ausente, é perguntada no terminal (sem eco). Aceita
`--flag valor` e `--flag=valor`. **Idempotente:** se já existe empresa ativa com o módulo `admin`,
não grava nada e avisa. Usa o mesmo `CadastrarEmpresaUsecase` (mesmas validações).

## Limitações conhecidas

- Não há exclusão de empresa pelo Admin (nem endpoint nem tela).
- Unicidade de domínio e "último domínio ativo" são checadas antes de gravar, sem lock nem índice:
  duas requisições simultâneas podem passar pela janela de corrida.
- O usuário admin criado é sempre um `auth_users` novo.
- Rebaixar/remover admins simultaneamente pode burlar a regra do último admin (checagem sem lock).
- Remover o acesso de um usuário não invalida o token já emitido (vale até expirar).
