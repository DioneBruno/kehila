# Módulo Auth (backend)

> Autenticação (login por senha e por código enviado por e-mail), emissão e leitura do JWT,
> e o perfil do usuário logado.

- Código: `backend/src/@modules/auth/`
- HTTP: `backend/src/http/auth/` (`AuthController` em `/`, `UserController` em `/auth`)
- Middlewares: `backend/src/http/middleware/` (descritos em [arquitetura](../arquitetura.md#autenticação-multiempresa-e-perfis))
- Frontend: [frontend › auth](../../frontend/modulos/auth.md)

## Endpoints

| Método | Rota | Middleware | Descrição |
|---|---|---|---|
| POST | `/token-generate` | `DominioMiddleware` | `{ username, password, trustDevice? }` → `{ token, deviceToken? }` |
| POST | `/trusted-device/login` | `DominioMiddleware` | `{ deviceToken }` → `{ token, deviceToken? }` (login sem senha) |
| POST | `/trusted-device/revoke` | `DominioMiddleware` | `{ deviceToken }` → `204` (sempre) |
| POST | `/random-code-authentication/generate` | `DominioMiddleware` | `{ username }` → envia código de 6 dígitos por e-mail; responde e-mail/telefone mascarados |
| POST | `/random-code-authentication/validate` | `DominioMiddleware` | `{ username, code }` → `{ token }` |
| POST | `/auth/me` | `JwtAuthMiddleware` | payload do token + dados atuais do usuário (`UsuarioQuery.buscarUsuarioPorUuid`) |
| POST | `/auth/editar-perfil` | `JwtAuthMiddleware` | o próprio usuário edita nome, CPF, e-mail, telefone e endereço |

`username` pode ser **e-mail ou CPF** (no login por código, também telefone).

## Fluxos

### Senha
`TokenGenerateUseCase` → `TokenGenerateRepository.findUser` (usuário ligado à empresa do
domínio) → `UserEntity.checkPassword` (bcrypt) → `GenerateTokenAuthenticationUserUsecase`.

### Código por e-mail
1. `EnviarCodigoValidadorUsecase`: gera código com `crypto.randomInt`, grava no Redis em
   `auth_random_code:<companyUuid>:<username>` (`{ code, userUuid, tentativas }`, TTL 15 min)
   e envia e-mail via SMTP da empresa (`EnviarEmailUsecase`, gateway `smtp`). Falha de envio é
   só logada.
2. `GerarTokenAuthenticationUsecase`: compara o código; errou → incrementa `tentativas`
   (5 erros apagam o código); acertou → apaga (uso único) e emite token.

O código **nunca** é devolvido na resposta.

### Dispositivo confiável
Código em `trustedDevice/`. Com `trustDevice: true` no `/token-generate`, o controller chama
`TrustedDeviceUsecase.emitir`: token aleatório (`randomBytes(32)`, base64url) devolvido como
`deviceToken`; no banco (`auth_trusted_devices`) fica **só o SHA-256**.

`/trusted-device/login` troca o `deviceToken` por um JWT. Regras (`TrustedDeviceUsecase.login`):
- precisa ser da empresa do domínio, não revogado, não expirado, usuário e vínculo sem `deleted_at`;
- a cada uso o token é **rotacionado** (novo `deviceToken` na resposta) e a validade renova
  para `AUTH_TRUSTED_DEVICE_DAYS` dias (padrão 30);
- o token anterior ainda vale por **60s** após a rotação (várias abas): responde só `{ token }`;
- a rotação é condicional (`WHERE token_hash = <anterior>`): se outra requisição rotacionou
  primeiro, também responde só `{ token }`.
Qualquer falha → `401 "Dispositivo não reconhecido"`. Testes sem banco em
`trustedDevice/__test__/`.

### Emissão do token
`generateTokenAuthenticationUser/` é o único ponto que monta o payload:

```json
{
  "user":    { "uuid", "cpf", "name", "email", "position", "roles" },
  "company": { "uuid", "name", "cpfCnpj" }
}
```

`position` e `roles` vêm de `auth_users_companies` (por empresa). Assinatura em
`shared/apiJwt.ts`: HS256, segredo `AUTH_JWT_SECRET`, expiração `AUTH_JWT_EXPIRES_IN`
(padrão `8h`). Sem `AUTH_JWT_SECRET`, gera um segredo aleatório por processo (tokens caem a
cada restart) e loga aviso.

> Mudou `position`/`roles` de alguém? O token antigo continua valendo até expirar — o
> backend confia no payload.

## Tabelas usadas

`auth_users` (global), `auth_users_companies` (`position`, `roles` json, `is_accepted`),
`auth_companies`, `auth_company_domains`, `auth_trusted_devices` (`token_hash`,
`previous_token_hash`, `rotated_at`, `device_name`, `last_used_at`, `expires_at`, `revoked_at`).

## Observações para quem for mexer

- Existem **duas** classes `UserEntity` (`generateTokenAutenticationUsernamePassword/user.entity.ts`
  com senha e `generateTokenAuthenticationUser/user.entity.ts` que gera token). Não confunda os
  imports.
- O método se chama `tokenGenegate()` (typo histórico).
- `findUser` não filtra `auth_users_companies.deleted_at` nem `is_accepted`; um vínculo removido
  com soft delete ainda permitiria login. Ver [pendências](../../pendencias.md).
- `/auth/me` relê o banco a cada chamada; é ele que o frontend usa para montar o perfil.
