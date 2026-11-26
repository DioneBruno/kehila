# Admin (frontend)

- HTTP + tipos: `src/@modules/admin/empresa.http.ts` (`AdminEmpresaHttp`)
- Service: `pages/admin/admin.service.ts` — chamadas com loading/notify, `MODULOS_EMPRESA`
  (Igreja, Imóveis, Admin), `UFS`, `labelModulo`
- Boot: `boot/admin.boot.ts` → `provide("adminEmpresaHttp")` (registrado em `quasar.config.ts`)
- Backend: [admin](../../backend/modulos/admin.md)

## Telas

| Rota | Arquivo | Conteúdo |
|---|---|---|
| `admin.empresas` (`/admin/empresas`) | `empresaListar.vue` | lista paginada com busca (nome, fantasia, CPF/CNPJ, domínio), módulos e domínios; botão "Nova empresa" |
| `admin.empresas.criar` | `empresaIncluir.vue` | cadastro: dados da empresa, domínio, módulos e usuário administrador |
| `admin.empresas.editar` (`/admin/empresas/:uuid`) | `empresaEditar.vue` | abas **Dados**, **Layout** (título/subtítulo do cabeçalho e da tela de login; salva só `{ layout }`), **Domínios** (incluir, editar, ativar/desativar, remover), **Módulos** e **Usuários** |

## Menu, home e acesso

- O item de menu e as rotas aparecem para o módulo `admin` (lido de `company.modulos` no JWT).
- Em `home.vue`, uma empresa sem módulo `igreja` nem `imoveis`, mas com `admin`, é redirecionada
  para `admin.empresas`.
- Mudanças de módulo só aparecem no menu dos usuários da empresa afetada após novo login.
- O backend recusa remover `admin` da própria empresa; a tela mostra a mensagem de erro.

## Aba Usuários

- `empresaUsuarios.vue` (prop `empresaUuid`): busca com debounce e `q-table` paginada no servidor
  (Nome, E-mail, Cargo, Ativo, ações); botão "Novo usuário"; remover pede confirmação e recarrega a lista.
- `empresaUsuarioDialog.vue` (props `empresaUuid`, `usuarioUuid?`; emite `salvo`): nome, e-mail, CPF,
  telefone, cargo (`admin`/`usuario`), ativo (só ao editar) e senha (obrigatória ao incluir; ao editar,
  "Nova senha" só é enviada se preenchida). Se o usuário também acessa outras empresas, mostra um aviso
  de que senha, e-mail, CPF e telefone mudam lá também.
- Regras e erros (ex.: "A empresa precisa de pelo menos um administrador") vêm do backend e aparecem
  pelo interceptor do axios.
- Métodos em `AdminEmpresaHttp`/`AdminEmpresaService`: `listarUsuarios`, `detalharUsuario`,
  `criarUsuario`, `editarUsuario`, `deletarUsuario`.
