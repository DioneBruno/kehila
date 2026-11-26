# Empresa (frontend)

- HTTP: `src/@modules/empresa/empresa.http.ts` (`GET/PUT empresa`), `dominio.http.ts` (CRUD de domínios)
- Services: `pages/empresa/empresa.service.ts`, `pages/empresa/dominio.service.ts`
- Layout público: `src/@modules/shared/public.http.ts` (`GET ping`) + `stores/layout.ts`
- Boot: `boot/empresa.boot.ts`, `boot/shared.boot.ts`
- Backend: [empresa](../../backend/modulos/empresa.md)

## Tela `empresa` (`empresaEditar.vue`)

Dados cadastrais (razão social, nome comercial/fantasia, CPF/CNPJ, IE, e-mail, telefone,
endereço, UF), o card **Layout** (título/subtítulo do cabeçalho e da tela de login, salvo junto
com os dados no modo edição; ao salvar, chama `/ping` para atualizar o topo e o título da aba)
e a lista de **domínios** (incluir, ativar/desativar, remover).

No mesmo card fica a **imagem de fundo do login** (`src/components/EmpresaImagemLogin.vue`):
prévia, escolher arquivo e "Enviar imagem" / "Usar imagem padrão". O envio é imediato, fora do
modo edição. A tela de login (`pages/auth/login/home.vue`) usa `layout.telaLogin.imagemUrl` do
`/ping` ou, se vier vazia, `IMAGEM_LOGIN_PADRAO`; antes do `/ping` responder não mostra imagem.

O formulário de layout é o componente compartilhado `src/components/EmpresaLayoutForm.vue`
(helpers em `src/components/empresaLayout.ts`), usado também na aba **Layout** do Admin.

Cuidado ao editar domínios: o domínio é como o backend identifica a empresa nas rotas
públicas. Remover/desativar o domínio em uso derruba o login e a página pública daquele
endereço. O valor deve ser a origem exata (`https://app.igreja.com.br`, sem barra final).

O layout (títulos da tela de login e do cabeçalho) ainda não tem tela; é editado direto em
`auth_companies.layout`.
