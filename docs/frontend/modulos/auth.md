# Auth (frontend)

- HTTP: `src/@modules/auth/login.http.ts` (`token-generate`, `random-code-authentication/*`),
  `auth.http.ts` (`auth/me`, `auth/editar-perfil`)
- Token: `authCookies.quasar.ts` — apesar do nome, grava no **localStorage**
  (`_kehila_token_bearer`, `_kehila_refresh_token`)
- Leitura do token: `tokenDecode.ts` (`jwt-decode`, sem validar assinatura) → `{ user, company }`
- Telas: `pages/auth/login/` (`home.vue`, `loginForm.vue`, `login.service.ts`)
- Boot: `boot/auth.boot.ts` → `provide("authHttp")`, `provide("loginHttp")`
- Backend: [auth](../../backend/modulos/auth.md)

## Fluxos

- **Painel** (`/login`): usuário (e-mail ou CPF) + senha → `LoginService.login` salva o token e
  vai para `home`. Os botões "recuperar" / "cadastrar" emitem eventos, mas não há tela ligada.
- **Portal de eventos** (`pages/portalEventos/pedido/LoginCadastro.vue`): login sem senha —
  envia código por e-mail (`randomCodeGenerate`) e valida (`randomCodeValidate`); ou cadastro
  rápido (`publico/eventos/novo-usuario`), que já devolve token.
- **Sair** (`MainLayout`): apaga token e refresh token e vai para `login`.

## Para saber quem está logado

```ts
import TokenDecode from "src/@modules/auth/tokenDecode";
const isAdmin = TokenDecode.execute()?.user?.position === "admin";
```

Para dados atualizados (endereço, cartões), use `authHttp.me()`. O store `useAuthStore` existe
mas quase não é usado.
