# Usuário (frontend)

- HTTP + tipos: `src/@modules/usuario/usuario.http.ts` (listar paginado, `cargos`, CRUD)
- Service: `pages/usuario/usuario.service.ts`
- Boot: `boot/usuario.boot.ts` → `provide("usuarioHttp")`
- Backend: [usuario](../../backend/modulos/usuario.md)

## Telas

| Rota | Arquivo | Conteúdo |
|---|---|---|
| `usuarios` | `usuarioListar.vue` | `q-table` com busca e paginação no servidor (`pagina`, `porPagina`, `meta.total`) |
| `usuarios.criar` | `usuarioIncluir.vue` | nome, CPF/e-mail, telefone, senha, cargo, roles |
| `usuarios.detalhe` | `usuarioEditar.vue` | dados pessoais, endereço, cargo/roles/aceite, troca de senha; mostra os **códigos de acesso ativos** (`randomCode`) para suporte |

Cargos vêm de `GET usuarios/cargos` (`admin`, `usuario`).

Se o usuário também pertence a outra igreja, o backend recusa (403) troca de senha, e-mail,
CPF e telefone — a mensagem aparece pelo interceptor.
