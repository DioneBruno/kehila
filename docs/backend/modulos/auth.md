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
| POST | `/token-generate` | `DominioMiddleware` | `{ username, password }` → `{ token }` |
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
`auth_companies`, `auth_company_domains`.

## Observações para quem for mexer

- Existem **duas** classes `UserEntity` (`generateTokenAutenticationUsernamePassword/user.entity.ts`
  com senha e `generateTokenAuthenticationUser/user.entity.ts` que gera token). Não confunda os
  imports.
- O método se chama `tokenGenegate()` (typo histórico).
- `findUser` não filtra `auth_users_companies.deleted_at` nem `is_accepted`; um vínculo removido
  com soft delete ainda permitiria login. Ver [pendências](../../pendencias.md).
- `/auth/me` relê o banco a cada chamada; é ele que o frontend usa para montar o perfil.
