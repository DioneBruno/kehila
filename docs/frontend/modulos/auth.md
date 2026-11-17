# Auth (frontend)

- HTTP: `src/@modules/auth/login.http.ts` (`token-generate`, `random-code-authentication/*`),
  `auth.http.ts` (`auth/me`, `auth/editar-perfil`)
- Token: `authCookies.quasar.ts` — apesar do nome, grava no **localStorage**
  (`_kehila_token_bearer`; `_kehila_trusted_device` = token do dispositivo confiável;
  `_kehila_refresh_token` não é mais usado)
- Leitura do token: `tokenDecode.ts` (`jwt-decode`, sem validar assinatura) → `{ user, company }`
- Telas: `pages/auth/login/` (`home.vue`, `loginForm.vue`, `login.service.ts`)
- Boot: `boot/auth.boot.ts` → `provide("authHttp")`, `provide("loginHttp")`
- Backend: [auth](../../backend/modulos/auth.md)

## Fluxos

- **Painel** (`/login`): usuário (e-mail ou CPF) + senha → `LoginService.login` salva o token e
  vai para `home`. Os botões "recuperar" / "cadastrar" emitem eventos, mas não há tela ligada.
- **Dispositivo confiável**: o checkbox "Confiar neste dispositivo" envia `trustDevice` e guarda o
  `deviceToken` devolvido. Ao abrir `/login`, `home.vue` chama
  `LoginService.loginDispositivoConfiavel()` antes de mostrar o formulário: entra direto se o
  servidor aceitar; 401 apaga o `deviceToken`; erro de rede mantém.
- **Sessão expirada** (`boot/axios.ts`): um 401 tenta `loginComDispositivoConfiavel` (axios sem
  interceptors) e repete a requisição **uma vez** com o JWT novo (se for recusada de novo, vai para `/login`). Não tenta nas rotas de login
  (`token-generate`, `random-code-authentication`, `trusted-device`). Sem `deviceToken`, vai
  para `/login` como antes.
- **Portal de eventos** (`pages/portalEventos/pedido/LoginCadastro.vue`): login sem senha —
  envia código por e-mail (`randomCodeGenerate`) e valida (`randomCodeValidate`); ou cadastro
  rápido (`publico/eventos/novo-usuario`), que já devolve token.
- **Sair** (`MainLayout`): apaga só o JWT e vai para `login`; o dispositivo continua confiável.
  Marca `_kehila_saiu` no sessionStorage para a tela de login não entrar de volta na hora
  (vale uma vez, só nesta aba; a próxima visita entra direto).
- **Esquecer este dispositivo** (`MainLayout`, só aparece com `deviceToken`): revoga no servidor,
  apaga JWT e `deviceToken`, vai para `login`.

## Para saber quem está logado

```ts
import TokenDecode from "src/@modules/auth/tokenDecode";
const isAdmin = TokenDecode.execute()?.user?.position === "admin";
```

Para dados atualizados (endereço, cartões), use `authHttp.me()`. O store `useAuthStore` existe
mas quase não é usado.
