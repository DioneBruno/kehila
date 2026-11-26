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
| `admin.empresas.editar` (`/admin/empresas/:uuid`) | `empresaEditar.vue` | abas **Dados**, **Domínios** (incluir, editar, ativar/desativar, remover) e **Módulos** |

## Menu, home e acesso

- O item de menu e as rotas aparecem para o módulo `admin` (lido de `company.modulos` no JWT).
- Em `home.vue`, uma empresa sem módulo `igreja` nem `imoveis`, mas com `admin`, é redirecionada
  para `admin.empresas`.
- Mudanças de módulo só aparecem no menu dos usuários da empresa afetada após novo login.
- O backend recusa remover `admin` da própria empresa; a tela mostra a mensagem de erro.
