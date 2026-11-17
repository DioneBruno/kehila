# Login com dispositivo confiável — Plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Usuário marca "Confiar neste dispositivo" no login do painel e, nas próximas vezes, entra sem senha.

**Architecture:** Token aleatório por dispositivo, guardado como SHA-256 em `auth_trusted_devices`, trocado por JWT em `POST /trusted-device/login` e rotacionado a cada uso (janela de 60s para o hash anterior). O frontend guarda o token no `localStorage`, tenta o login automático ao abrir `/login` e usa o mesmo endpoint para renovar o JWT expirado no interceptor do axios.

**Tech Stack:** NestJS + TypeORM (SQL cru via `ConnectionHub`), Jest (`@swc/jest`); Vue 3 + Quasar.

**Spec:** `docs/superpowers/specs/2026-11-16-trusted-device-login-design.md`

## Global Constraints

- Validade: `AUTH_TRUSTED_DEVICE_DAYS` (padrão `30`), deslizante a cada login.
- Janela do hash anterior: 60 segundos após `rotated_at`.
- Token: `crypto.randomBytes(32).toString("base64url")`; banco guarda só `sha256` hex.
- Erro de token inválido: `ApiError("Dispositivo não reconhecido", 401)`.
- Chave no `localStorage`: `_kehila_trusted_device`.
- "Sair" **não** apaga o token do dispositivo; "Esquecer este dispositivo" apaga.
- Os testes jest com banco **não podem rodar** aqui (ver memória: migrations quebradas em banco novo; nunca usar containers `flow-*`). Testes novos são sem banco (repositório falso em memória). Verificação de tipos: `npx tsc --noEmit --incremental false` no `backend/`.
- Antes de rodar algo no worktree, ligar dependências: `ln -s /home/dione/Projetos/kehila/backend/node_modules backend/node_modules` e o mesmo para `frontend/node_modules` (se não existirem).

## Review Focus

1. Duas abas renovam ao mesmo tempo com o mesmo token → a segunda recebe JWT sem novo `deviceToken`, ninguém é deslogado (teste na Task 1).
2. Usuário removido (`deleted_at`) ou desvinculado da empresa depois de confiar → login automático recusado (teste na Task 1).
3. Token de dispositivo da empresa A usado no domínio da empresa B → recusado (teste na Task 1).
4. Login automático falha por **rede/500** (não 401) → o `deviceToken` **não** é apagado e o formulário aparece (Task 3, passo explícito).
5. JWT expira sem `deviceToken` salvo → comportamento atual (vai para `/login`), sem loop (Task 4, passo explícito).

---

### Task 1: Regra de negócio do dispositivo confiável (sem banco)

**Files:**
- Create: `backend/src/@modules/auth/trustedDevice/trustedDevice.token.ts`
- Create: `backend/src/@modules/auth/trustedDevice/trustedDevice.repository.ts` (só tipos/interface nesta task)
- Create: `backend/src/@modules/auth/trustedDevice/trustedDevice.usecase.ts`
- Test: `backend/src/@modules/auth/trustedDevice/__test__/trustedDevice.usecase.test.ts`

**Interfaces:**
- Produces:
  - `gerarDeviceToken(): string`, `hashDeviceToken(token: string): string`
  - ```ts
    export type TrustedDeviceRow = {
      uuid: string; userUuid: string; companyUuid: string;
      tokenHash: string; previousTokenHash: string | null; rotatedAt: Date | null;
      expiresAt: Date; revokedAt: Date | null;
    };
    export interface TrustedDeviceRepository {
      criar(input: { uuid: string; userUuid: string; companyUuid: string; tokenHash: string; deviceName: string | null; expiresAt: Date }): Promise<void>;
      buscarPorHash(companyUuid: string, hash: string): Promise<TrustedDeviceRow | null>; // casa token_hash OU previous_token_hash
      rotacionar(input: { uuid: string; novoHash: string; hashAnterior: string; agora: Date; expiresAt: Date }): Promise<void>; // também seta last_used_at = agora
      revogarPorHash(companyUuid: string, hash: string, agora: Date): Promise<void>;
      usuarioAtivoNaEmpresa(companyUuid: string, userUuid: string): Promise<boolean>;
      gerarToken(companyUuid: string, userUuid: string): Promise<{ token: string }>;
    }
    ```
  - `class TrustedDeviceUsecase { constructor(repo: TrustedDeviceRepository, opts?: { dias?: number; agora?: () => Date }) }`
    - `emitir(input: { companyUuid: string; userUuid: string; deviceName?: string | null }): Promise<string>` → devolve o token cru; `deviceName` truncado em 255.
    - `login(input: { companyUuid: string; deviceToken: string }): Promise<{ token: string; deviceToken?: string }>`
    - `revogar(input: { companyUuid: string; deviceToken: string }): Promise<void>` (token vazio → não faz nada)
  - `dias` padrão: `Number(process.env.AUTH_TRUSTED_DEVICE_DAYS) || 30`.

- [ ] **Step 1: Escrever os testes com um `FakeRepo` em memória** (implementa a interface; `buscarPorHash` filtra por `companyUuid` e casa `tokenHash` ou `previousTokenHash`; `gerarToken` devolve `{ token: "jwt-" + userUuid }`; `usuarioAtivoNaEmpresa` lê um `Set`). Relógio controlado por `let agora = new Date("2026-01-01T00:00:00Z")`.
  - `emitir grava só o hash e expira em 30 dias` — `repo.rows[0].tokenHash === hashDeviceToken(t)`, `!== t`, `expiresAt` = agora + 30d.
  - `login com token atual devolve JWT e novo deviceToken` — `token === "jwt-u1"`, `deviceToken` definido e `!== t`; o token antigo continua válido 59s depois mas devolve sem `deviceToken`.
  - `hash anterior fora da janela é recusado` — agora + 61s → rejects `"Dispositivo não reconhecido"`.
  - `token rotacionado vira o válido` — login com o novo funciona; `expiresAt` renovado para agora + 30d.
  - `token expirado é recusado` — agora + 31d.
  - `token revogado é recusado` — após `revogar`.
  - `outra empresa é recusada` — `companyUuid: "c2"`.
  - `usuário inativo na empresa é recusado` — remove do Set.
  - `token vazio é recusado` — `deviceToken: ""`.
  - Todas as recusas com `statusCode === 401`.

- [ ] **Step 2: Rodar e ver falhar**
  Run: `cd backend && npx jest src/@modules/auth/trustedDevice`
  Expected: FAIL (módulos não existem).

- [ ] **Step 3: Implementar `trustedDevice.token.ts`, os tipos do repositório e `TrustedDeviceUsecase`.** Regra do `login`: busca por hash; recusa se não achou, `revokedAt`, `expiresAt <= agora`, ou se casou só pelo `previousTokenHash` e `agora - rotatedAt > 60s`; recusa se `!usuarioAtivoNaEmpresa`. Casou pelo atual → gera novo token, `rotacionar`, devolve `{ token, deviceToken }`. Casou pelo anterior → só `{ token }`.

- [ ] **Step 4: Rodar e ver passar**
  Run: `cd backend && npx jest src/@modules/auth/trustedDevice`
  Expected: PASS (todos).

- [ ] **Step 5: Commit** — `Adiciona regra do dispositivo confiável`

### Task 2: Banco, repositório Postgres e rotas

**Files:**
- Create: `backend/src/@infra/database/migrations/auth/1790800000000-create-auth_trusted_devices.migration.ts`
- Modify: `backend/src/@modules/auth/trustedDevice/trustedDevice.repository.ts` (adiciona `TrustedDeviceRepositoryPg implements TrustedDeviceRepository`)
- Modify: `backend/src/http/auth/auth.controller.ts`, `backend/src/http/auth/auth.module.ts`
- Modify: `docs/backend/modulos/auth.md`

**Interfaces:**
- Consumes: Task 1 (`TrustedDeviceUsecase`, `TrustedDeviceRepository`).
- Produces (HTTP, todas com `DominioMiddleware`):
  - `POST /token-generate` `{ username, password, trustDevice?: boolean }` → `{ token, deviceToken? }`
  - `POST /trusted-device/login` `{ deviceToken }` → `{ token, deviceToken? }`
  - `POST /trusted-device/revoke` `{ deviceToken }` → `204`

- [ ] **Step 1: Migration** `MigrationCreateAuthTrustedDevices1790800000000`, no estilo de `1790700000000-create-auth_pessoas_vinculos`: colunas do spec; `token_hash varchar NOT NULL UNIQUE`; FKs `ON DELETE CASCADE` para `auth_users(uuid)` e `auth_companies(uuid)`; índices em `(company_uuid, previous_token_hash)` e `(user_uuid)`; `down` faz `DROP TABLE IF EXISTS`.

- [ ] **Step 2: `TrustedDeviceRepositoryPg(connectionHub: ConnectionHub)`** com SQL parametrizado (`$1…`). `usuarioAtivoNaEmpresa`: `auth_users.deleted_at IS NULL` + vínculo em `auth_users_companies` com `deleted_at IS NULL`. `gerarToken`: reusa `GenerateTokenAuthenticationUserUsecase` como `TokenGenerateRepository.generateToken` faz.

- [ ] **Step 3: Wiring.** Provider `TrustedDeviceUsecase` (factory com `ConnectionHub`). No controller: `tokenGenerate` — se `body.trustDevice === true`, pega `userUuid` de `ApiJwt.tokenDecoding(token).user.uuid` e chama `emitir` com `deviceName: req.headers["user-agent"]`; novas rotas `trusted-device/login` (200) e `trusted-device/revoke` (204). No `configure`: `consumer.apply(DominioMiddleware).forRoutes("trusted-device/login", "trusted-device/revoke")`.

- [ ] **Step 4: Verificar tipos**
  Run: `cd backend && npx tsc --noEmit --incremental false`
  Expected: sem erros. Rodar também `npx jest src/@modules/auth/trustedDevice src/http/middleware/__test__/seguranca.test.ts` → PASS.

- [ ] **Step 5: Documentar** os três endpoints e a tabela em `docs/backend/modulos/auth.md`.

- [ ] **Step 6: Commit** — `Adiciona tabela e rotas de dispositivo confiável`

### Task 3: Frontend — checkbox e login automático

**Files:**
- Modify: `frontend/src/@modules/auth/authCookies.quasar.ts`, `frontend/src/@modules/auth/login.http.ts`
- Modify: `frontend/src/pages/auth/login/login.service.ts`, `loginForm.vue`, `home.vue`

**Interfaces:**
- Consumes: HTTP da Task 2.
- Produces:
  - `AuthCookiesQuasar.setDeviceToken(t: string) / getDeviceToken(): string | null / deleteDeviceToken()` (chave `_kehila_trusted_device`)
  - `LoginHttp.trustedDeviceLogin(deviceToken: string)` / `trustedDeviceRevoke(deviceToken: string)`
  - `LoginService.loginDispositivoConfiavel(): Promise<boolean>`

- [ ] **Step 1:** Métodos novos em `AuthCookiesQuasar` e `LoginHttp`.
- [ ] **Step 2:** `loginForm.vue`: `q-checkbox` "Confiar neste dispositivo" (`input.trustDevice`, padrão `false`) entre a senha e "Recuperar conta". `LoginService.login` grava `response.deviceToken` quando vier.
- [ ] **Step 3:** `LoginService.loginDispositivoConfiavel()`: sem token → `false`. Chama `trustedDeviceLogin` usando um axios com `validateStatus: () => true` (para não cair no interceptor global). 200 → grava JWT, grava `deviceToken` novo se vier, `router.push({ name: "home" })`, `true`. **401 → apaga o `deviceToken`**, `false`. Qualquer outro erro → **mantém o `deviceToken`**, `false`.
- [ ] **Step 4:** `home.vue`: no `onMounted`, mostra loading e chama `loginDispositivoConfiavel()`; o formulário só aparece quando retornar `false` (`v-if`).
- [ ] **Step 5: Verificar** — `cd frontend && npm run lint` sem erros novos nos arquivos tocados.
- [ ] **Step 6: Commit** — `Adiciona opção de confiar no dispositivo no login`

### Task 4: Frontend — renovação silenciosa, Sair e Esquecer

**Files:**
- Modify: `frontend/src/boot/axios.ts`, `frontend/src/layouts/MainLayout.vue`
- Modify: `docs/frontend/modulos/auth.md`

**Interfaces:**
- Consumes: Task 3 (`AuthCookiesQuasar` device token, `LoginHttp.trustedDeviceRevoke`).

- [ ] **Step 1:** `tryRefreshToken`: troca `getRefreshToken()` por `getDeviceToken()` e `/auth/refresh-token` + `{ refreshToken }` por `/trusted-device/login` + `{ deviceToken }`; lê `response.data.deviceToken`. Recusa 401 → `deleteDeviceToken()` e `redirectToLogin()`. Sem `deviceToken` → `redirectToLogin()` como hoje (sem tentar).
- [ ] **Step 2:** `redirectToLogin` deixa de apagar o token do dispositivo (só JWT). Remover usos de `getRefreshToken`/`setRefreshToken`/`deleteRefreshToken` em `axios.ts` e `MainLayout.vue`.
- [ ] **Step 3:** `MainLayout.vue`: `sair()` apaga só o JWT. Novo item "Esquecer este dispositivo" (ícone `phonelink_erase`) nos dois menus onde há "Sair", com `v-if` quando há `deviceToken`; chama `trustedDeviceRevoke` (ignora erro), apaga JWT e `deviceToken`, vai para `login`.
- [ ] **Step 4: Verificar** — `npm run lint` sem erros novos.
- [ ] **Step 5:** Atualizar `docs/frontend/modulos/auth.md` (chave nova, fluxos Sair/Esquecer, refresh).
- [ ] **Step 6: Commit** — `Renova sessão com dispositivo confiável e adiciona Esquecer dispositivo`

### Task 5: Verificação no navegador (se houver banco de dev)

- [ ] Perguntar ao usuário qual banco/servidor usar (nunca `flow-*`). Se houver: rodar a migration, marcar o checkbox e entrar, recarregar `/login` (entra direto), Sair → `/login` entra direto, Esquecer → pede senha. Se não houver: registrar que só tipos, lint e testes sem banco foram verificados.
