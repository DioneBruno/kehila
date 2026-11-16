# Login com dispositivo confiável — design

Data: 2026-11-16 · Tamanho: mudança pequena/média (design curto)

## Intenção

No login do painel (`/login`), o usuário marca **"Confiar neste dispositivo"**. Nas próximas
vezes, nesse navegador, ele entra direto, sem digitar usuário e senha. Objetivo: conveniência
para quem usa o painel sempre no mesmo aparelho, sem abrir mão de poder cortar o acesso.

## Objetivos / não-objetivos

- **Objetivo:** login automático por até 30 dias sem uso (janela deslizante), revogável.
- **Objetivo:** JWT expirado (8h) é renovado em silêncio, sem mandar para a tela de login.
- **Não-objetivo:** portal de eventos (`LoginCadastro.vue`), tela "meus dispositivos",
  cookie httpOnly, revogar tudo ao trocar senha (não há fluxo de troca de senha hoje).
- **Anti-objetivo:** token de longa duração que não possa ser revogado no servidor.

## Decisões do usuário

- **"Sair" mantém a confiança.** Sair só apaga o JWT. Para remover, existe a opção
  **"Esquecer este dispositivo"** no menu do usuário.
- **Abordagem A:** tabela no Postgres (não Redis, não JWT longo).

## Abordagens consideradas

| | Abordagem | Troca | |
|---|---|---|---|
| **A** | Tabela `auth_trusted_devices`, token aleatório guardado como hash, rotacionado a cada uso | Revogável, durável, permite listar depois; precisa de migration | **Escolhida** |
| B | Chave no Redis com TTL (como o login por código) | Sem migration; perde tudo se o Redis for limpo, ruim para listar/revogar por usuário | — |
| C | JWT de longa duração | Não revoga — descartada | — |

## Design

### Backend (`backend/src/@modules/auth/trustedDevice/`, rotas no `AuthController`)

**Migration** `migrations/auth/<ts>-create-auth_trusted_devices.migration.ts`:

```
auth_trusted_devices (
  created_at, updated_at,
  uuid PK,
  user_uuid  -> auth_users(uuid) ON DELETE CASCADE,
  company_uuid -> auth_companies(uuid) ON DELETE CASCADE,
  token_hash varchar UNIQUE,            -- sha256 hex do token atual
  previous_token_hash varchar NULL,     -- hash anterior (janela de 60s, ver abaixo)
  rotated_at timestamp NULL,
  device_name varchar NULL,             -- user-agent truncado
  last_used_at timestamp,
  expires_at timestamp,
  revoked_at timestamp NULL
)
```

**Token:** `crypto.randomBytes(32).toString("base64url")`. Só o SHA-256 vai para o banco.

**Endpoints** (todos com `DominioMiddleware`, que fornece `companyUuid`):

| Rota | Entrada | Saída |
|---|---|---|
| `POST /token-generate` | `+ trustDevice?: boolean` | `{ token, deviceToken? }` — `deviceToken` só quando `trustDevice` |
| `POST /trusted-device/login` | `{ deviceToken }` | `{ token, deviceToken? }` |
| `POST /trusted-device/revoke` | `{ deviceToken }` | `204` (sempre, mesmo se não existir) |

**`/trusted-device/login`:**
1. Busca por `token_hash = hash` **ou** (`previous_token_hash = hash` e `rotated_at > now() - 60s`),
   com `company_uuid` do domínio, `revoked_at IS NULL`, `expires_at > now()`.
2. Confere que o usuário existe (`deleted_at IS NULL`) e ainda está ligado à empresa.
3. Não achou / inválido → `401 "Dispositivo não reconhecido"`.
4. Achou pelo hash atual → gera novo token, move o atual para `previous_token_hash`,
   `rotated_at = now()`, `expires_at = now() + 30 dias`, `last_used_at = now()`; devolve
   `{ token, deviceToken: novo }`.
5. Achou pelo hash anterior (outra aba já rotacionou) → devolve só `{ token }`; o cliente
   mantém o token que a outra aba já gravou no `localStorage`.
6. JWT gerado pelo `GenerateTokenAuthenticationUserUsecase` (único ponto que monta o payload).

**Validade:** `AUTH_TRUSTED_DEVICE_DAYS` (padrão 30), deslizante.

### Frontend

- `AuthCookiesQuasar`: `setDeviceToken/getDeviceToken/deleteDeviceToken`
  (`localStorage`, chave `_kehila_trusted_device`).
- `LoginHttp`: `trustedDeviceLogin(deviceToken)`, `trustedDeviceRevoke(deviceToken)`.
- `loginForm.vue`: checkbox "Confiar neste dispositivo" (desmarcado por padrão) → envia
  `trustDevice`; guarda `deviceToken` se vier.
- `home.vue` (tela de login): ao montar, se houver `deviceToken`, tenta
  `trustedDeviceLogin` com loading; sucesso → grava token(s) e vai para `home`; `401` →
  apaga o `deviceToken` e mostra o formulário normal.
- `boot/axios.ts`: o `tryRefreshToken` hoje chama `/auth/refresh-token`, que **não existe** no
  backend. Passa a chamar `/trusted-device/login` com o `deviceToken`. Sem `deviceToken` →
  vai para o login como hoje. `redirectToLogin` apaga o `deviceToken` só quando a renovação
  foi recusada (401).
- `MainLayout.vue`: "Sair" para de apagar o `deviceToken`. Novo item
  **"Esquecer este dispositivo"** (aparece só se houver `deviceToken`): chama `revoke`,
  apaga JWT e `deviceToken`, vai para `/login`.
- A chave antiga `_kehila_refresh_token` deixa de ser usada.

### Testes

- Use cases do backend com testes no padrão de `__test__/` (repositório falso): emissão com
  `trustDevice`, login válido com rotação, hash anterior dentro/fora da janela, expirado,
  revogado, empresa diferente, usuário removido.
- Frontend: verificação manual no navegador (marcar, recarregar, sair e voltar, esquecer).

## Decisões minhas (pode corrigir)

- 30 dias deslizantes, configurável por env.
- Rotação a cada uso + janela de 60s para várias abas abertas.
- Checkbox desmarcado por padrão.
- `revoke` não exige JWT: quem tem o `deviceToken` pode revogá-lo.
- Atualizar `docs/backend/modulos/auth.md` e `docs/frontend/modulos/auth.md`.
