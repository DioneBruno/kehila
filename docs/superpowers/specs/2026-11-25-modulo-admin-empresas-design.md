# Módulo Admin — gestão de empresas — design

Data: 2026-11-25 · Tamanho: projeto (design completo)

## Intenção

Hoje toda empresa nova do Kehila (igreja ou escritório) é cadastrada **direto no banco**:
`auth_companies`, `auth_company_domains`, `auth_company_modulos` e o primeiro usuário em
`auth_users` + `auth_users_companies`. O dono do sistema quer fazer isso por tela.

Para isso nasce o módulo **`admin`**, habilitado só para uma empresa especial, a
**empresa-admin**, acessada por um endereço próprio (ex.: `http://admin.localhost:9000`). Quem é
admin dentro dela cadastra e mantém todas as outras empresas.

## Objetivos, não-objetivos, anti-objetivos

- **Objetivo:** cadastrar uma empresa nova pronta para uso em um passo: dados, **domínio**,
  **usuário admin** e módulos. Depois disso alguém consegue logar no domínio dela.
- **Objetivo:** listar empresas; editar dados; incluir/editar/remover domínios; ligar/desligar
  módulos de qualquer empresa, com o bloqueio do backend valendo na hora.
- **Objetivo:** criar a empresa-admin inicial sem SQL manual (comando `npm run admin:criar`).
- **Não-objetivo:** excluir/desativar empresa (hoje o soft delete nem bloqueia acesso — ver
  pendências); gerenciar usuários de outras empresas além do admin inicial; editar layout da tela
  de login; usar `auth_users.is_super_admin`; trocar de empresa sem sair (impersonar).
- **Anti-objetivo:** alguém fora da empresa-admin (ou um usuário não-admin dela) acessar as
  rotas `/admin`; o cadastro deixar meia empresa gravada (empresa sem domínio ou sem usuário);
  dois tenants com o mesmo domínio ativo; a empresa-admin conseguir tirar o próprio módulo
  `admin` e se trancar fora.

## Decisões do usuário

- Abordagem 1: módulo `admin` no mesmo padrão dos módulos `igreja`/`imoveis` (por empresa),
  com rotas e telas próprias.
- No cadastro de empresa é obrigatório informar **domínio** e **usuário admin**.
- A empresa-admin tem rota/domínio próprio (ex.: `admin.localhost`).
- Empresa exemplo: **empresa-admin**, com o módulo Admin.

## Abordagens consideradas

| | Abordagem | Troca | |
|---|---|---|---|
| **1** | Módulo `admin` por empresa (middleware `ModuloAdmin` + `Admin`), rotas `/admin/empresas`, telas `/admin`, comando para a primeira empresa-admin | Mesmo padrão já existente; precisa do comando para o "ovo e a galinha" | **Escolhida** |
| 2 | Flag `auth_users.is_super_admin` libera o Admin em qualquer domínio | Mais simples de liberar; foge do pedido e mistura administração com o acesso das igrejas | — |
| 3 | Só comando/CLI, sem tela | Rápido; continua dependendo de terminal | — |

## Design

### 1. Módulo e proteção (backend)

- `ModuloChave` (`http/middleware/modulo.middleware.ts`) ganha `"admin"`; nova classe
  `ModuloAdminMiddleware`.
- Novo Nest module `http/admin/admin.module.ts` com `AdminEmpresaController` em
  `/admin/empresas`, protegido por `JwtAuthMiddleware` + `AdminMiddleware` +
  `ModuloAdminMiddleware`.
- Lista de módulos válidos centralizada em um só lugar do domínio
  (`@modules/empresa/modulos/modulos.ts`: `MODULOS_VALIDOS = ["igreja", "imoveis", "admin"]`),
  usada pela validação e pelo middleware.

### 2. Endpoints

Todos sob `/admin/empresas`, resposta `{ success, data, meta? }`. O `:uuid` é a empresa
**alvo** (vem do path, não do token — exceção consciente à regra de ouro, permitida só aqui).

| Método | Rota | Faz |
|---|---|---|
| GET | `/admin/empresas?busca=&pagina=&porPagina=` | lista (não deletadas): uuid, name, fantasyName, cpfCnpj, modulos[], dominios ativos[], createdAt; busca por nome/CNPJ/domínio; ordem por nome |
| GET | `/admin/empresas/:uuid` | detalhe: dados + domínios (todos, com `active`) + módulos |
| POST | `/admin/empresas` | cadastra empresa completa (abaixo) → `{ uuid }` 201 |
| PUT | `/admin/empresas/:uuid` | edita dados — reusa `EditarEmpresaUsecase` com `companyUuid = :uuid` |
| GET | `/admin/empresas/:uuid/dominios` | reusa `ListarDominiosUsecase` |
| POST | `/admin/empresas/:uuid/dominios` | reusa `CriarDominioUsecase` + normalização e unicidade (§4) |
| PUT | `/admin/empresas/:uuid/dominios/:dominioUuid` | reusa `EditarDominioUsecase` + §4 |
| DELETE | `/admin/empresas/:uuid/dominios/:dominioUuid` | reusa `DeletarDominioUsecase` |
| PUT | `/admin/empresas/:uuid/modulos` | `{ modulos: string[] }` → define a lista (§5) |

Rotas que recebem `:uuid` respondem 404 "Empresa não encontrada" se ela não existir/estiver
deletada. Controller monta o input campo a campo (whitelist), como no resto do projeto.

### 3. Cadastrar empresa (`CadastrarEmpresaUsecase`)

Body:

```json
{
  "empresa":  { "name", "cpfCnpj", "commercialName?", "fantasyName?", "stateRegistration?",
                "email?", "phone?", "uf?", "address?" },
  "dominio":  "https://app.igreja.com.br",
  "modulos":  ["igreja"],
  "admin":    { "name", "email?", "cpf?", "phone?", "password" }
}
```

Validação (mensagens em português, `ApiError` 400):
- `empresa.name` e `empresa.cpfCnpj` obrigatórios (mesma regra do `EditarEmpresa`, sem
  validação de dígito do CNPJ).
- `dominio` obrigatório, normalizado e único (§4).
- `modulos`: pelo menos um, todos em `MODULOS_VALIDOS`, sem repetição.
- `admin.name` obrigatório; CPF **ou** e-mail; CPF/e-mail válidos (`ApiValidate`, como no
  `CriarUsuarioUsecase`); `password` obrigatória com no mínimo 8 caracteres (a empresa nova não
  tem SMTP configurado, então o login por código não funciona no começo).

Gravação **em uma transação** (`queryRunner` do `DataSource`): `auth_companies`
(`tenant_id` = o próprio uuid da empresa, `layout` nulo → fallback padrão), 1 linha em
`auth_company_domains` (`active = true`), N linhas em `auth_company_modulos`, um `auth_users`
novo (senha bcrypt, `password_date_update = now()`) e `auth_users_companies`
(`position = 'admin'`, `roles = []`, `is_accepted = true`). Qualquer falha → rollback.

O usuário admin é sempre uma linha nova em `auth_users`, como já faz o `CriarUsuarioUsecase`
(o projeto não reaproveita usuário entre empresas).

### 4. Domínio: normalização e unicidade

Aplicado no cadastro e nas rotas de domínio do Admin:
- `trim`, minúsculas, remove barra final; precisa começar com `http://` ou `https://` e ser uma
  origem (sem caminho) — senão 400 "Informe o domínio como origem, ex.: https://app.exemplo.com.br".
- Rejeita (409 "Este domínio já está em uso por outra empresa") se já existe domínio **ativo e
  não deletado** igual em qualquer empresa (na edição, ignora o próprio registro).

**Também nas rotas antigas `/empresa/dominios`** (*decisão do construtor*): a normalização e a
unicidade ficam num helper compartilhado (`@modules/empresa/dominio/dominio.ts`) usado pelos
use cases `CriarDominio`/`EditarDominio`, então valem tanto no Admin quanto em "Minha Empresa".
Sem índice único no banco por ora: dados existentes podem ter duplicados ou valores não
normalizados, o que faria a migration falhar; o comparativo é feito com `lower(rtrim(domain, '/'))`.

**Último domínio ativo** (*decisão do construtor*): remover ou desativar o único domínio ativo
de uma empresa → 400 "A empresa precisa de pelo menos um domínio ativo". Vale nas duas rotas
(Admin e "Minha Empresa"), o que também impede a empresa-admin de se trancar fora.

### 5. Módulos (`DefinirModulosEmpresaUsecase`)

- Recebe a lista final; valida como no §3 (lista vazia é permitida aqui? **não** — mínimo um).
- Em transação: soft delete (`deleted_at = now()`) dos que saíram; `INSERT` dos que entraram
  (respeita o índice único parcial; não "limpa" `deleted_at`).
- Se a empresa alvo é a **do token** e a lista não contém `admin` → 400 "Não é possível remover
  o módulo Admin da própria empresa".
- Depois do commit apaga a chave Redis `modulos:<uuid>` (falha de cache só é logada). O bloqueio
  do backend muda na hora; o **menu** dos usuários daquela empresa só muda após novo login — a
  tela avisa isso.

### 6. Comando da empresa-admin inicial

`backend/src/@infra/database/scripts/criarEmpresaAdmin.ts`, com scripts:
- `npm run admin:criar` (dev, `ts-node -r tsconfig-paths/register`)
- `npm run admin:criar:prod` (`node dist/...`)

Parâmetros: `--dominio` (obrigatório), `--email` (obrigatório), `--nome` (padrão
"Administrador"), `--empresa` (padrão "empresa-admin"), `--cnpj` (padrão `00000000000000`).
A senha vem da variável `ADMIN_SENHA` ou é perguntada no terminal (sem eco). Usa o mesmo
`CadastrarEmpresaUsecase` com `modulos: ["admin"]`. Se já existe empresa com o módulo `admin`,
avisa e sai sem gravar (idempotente). Não usa o seeder (o seeder apaga tabelas inteiras).

### 7. Frontend

- `layouts/menu.ts`: `Modulo` ganha `"admin"`; nova seção `ADMIN` com o item
  **Empresas** (`admin.empresas`, ícone `domain`), visível com módulo `admin` **e** perfil admin.
- Os itens genéricos de ADMINISTRAÇÃO (Minha Empresa, Usuários, Notificações) continuam
  aparecendo para a empresa-admin (*decisão do construtor*): é por "Usuários" que se cadastram
  outros admins dela.
- `pages/home.vue`: empresa sem `igreja` e com `admin` vai para `admin.empresas` (a regra de
  imóveis continua antes).
- HTTP `src/@modules/admin/empresas.http.ts`; services em `pages/admin/`.
- Rotas (filhas do `MainLayout`, mesmo padrão das de imóveis):
  - `admin.empresas` → `pages/admin/empresaListar.vue`: busca, tabela (nome, CNPJ, domínios,
    módulos como chips), botão "Nova empresa".
  - `admin.empresas.criar` → `pages/admin/empresaIncluir.vue`: um formulário em seções —
    **Empresa**, **Acesso** (domínio, com dica "origem exata, sem barra final"), **Módulos**
    (checkboxes Igreja / Imóveis / Admin), **Usuário administrador** (nome, e-mail, CPF,
    telefone, senha). Ao salvar, mostra "Empresa criada. O admin entra em <domínio>" e vai
    para a edição.
  - `admin.empresas.editar` (`admin/empresas/:uuid`) → `pages/admin/empresaEditar.vue` com
    abas **Dados**, **Domínios** (mesma UX da tela "Minha Empresa"), **Módulos** (checkboxes +
    salvar + aviso de novo login).

```
┌ Empresas ─────────────────────────────── [ + Nova empresa ] ┐
│ [ buscar nome, CNPJ ou domínio ]                             │
│ Nome            CNPJ             Domínios          Módulos   │
│ Igreja Central  12.345.678/0001  app.igreja...     igreja    │
│ Escritório X    98.765.432/0001  imoveis.x...      imoveis   │
└──────────────────────────────────────────────────────────────┘
```

### 8. Documentação

Novas páginas `docs/backend/modulos/admin.md` e `docs/frontend/modulos/admin.md`; linha no
índice de `docs/README.md` e na tabela de proteção de `docs/backend/arquitetura.md`; atualizar
"Módulos por empresa" em `imoveis.md` (agora há tela) e remover o item correspondente de
`docs/pendencias.md`; seção "Começando" do README explica `npm run admin:criar`.

## Testes

- Testes sem banco (padrão `http/middleware/__test__/seguranca.test.ts`): `exigirModulo` com
  `admin`; validações do `CadastrarEmpresaUsecase` e do `DefinirModulosEmpresaUsecase` com
  repositório falso (dados obrigatórios, domínio malformado, módulo inválido, remover `admin`
  da própria empresa); normalização de domínio.
- Testes de integração com banco (cadastro transacional + rollback, unicidade de domínio,
  definir módulos) seguem o padrão dos de imóveis. **Atenção:** só rodar contra um banco
  indicado pelo usuário; nunca contra containers `flow-*` (pertencem a outro projeto).
- `npx tsc --noEmit` no backend; `npm run lint`/build no frontend.
- Verificação manual: rodar `admin:criar` com `--dominio http://admin.localhost:9000`, logar
  em `admin.localhost:9000`, cadastrar uma empresa com domínio `http://localhost:9000`, logar
  nela com o admin criado.

## Deixado para quem for construir

Nomes de arquivos internos, divisão em repositórios/queries, paginação padrão (20), layout fino
das telas seguindo os componentes já usados em `pages/empresa` e `pages/imoveis`.
