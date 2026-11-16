# Arquitetura do frontend

Quasar 2 (Vue 3.5, Vite) + TypeScript estrito + Pinia + vue-router (modo **hash**) + Axios.
Componentes em **Options API com `setup()`** (`defineComponent` + `reactive` + `toRefs`);
alguns arquivos usam `<script setup>`.

```
frontend/src
├── boot/                  plugins Quasar: axios.ts (instância api + interceptors) e um <modulo>.boot.ts por módulo
├── @modules/              clientes HTTP tipados (um por recurso) — sem Vue
│   ├── http/              HttpClient (interface) + AxiosAdapter
│   ├── auth/              login.http, auth.http, authCookies.quasar (token no localStorage), tokenDecode
│   └── <modulo>/<recurso>.http.ts
├── pages/<modulo>/        telas (.vue) + <modulo>.service.ts (orquestra http, loading, notify, router)
├── layouts/               MainLayout (menu, logado) e BlankLayout (login e página pública); cada um chama /ping
├── stores/                Pinia: auth (user), layout (layout do tenant), pedido (carrinho do portal de eventos)
├── shared/                ApiDate (moment), MessageConfirmation*(diálogos), sanitizeHtml
├── router/routes.ts       todas as rotas
└── css/                   app.scss, quasar.variables.scss
```

Módulos: [auth](modulos/auth.md) · [usuario](modulos/usuario.md) · [empresa](modulos/empresa.md) ·
[membresia](modulos/membresia.md) · [aprisco](modulos/aprisco.md) ·
[portalEventos](modulos/portalEventos.md) · [financeiro](modulos/financeiro.md) ·
[notificacao](modulos/notificacao.md) · [BI](modulos/bi.md)

## Fluxo de uma tela

```
Page.vue ──► <Modulo>Service (pages/<modulo>/<modulo>.service.ts)
               │  inject("<recurso>Http"), useQuasar(), useRouter()
               │  loading.show/hide, notify, router.push, try/catch → retorna null/false em erro
               ▼
             <Recurso>Http (@modules/<modulo>/<recurso>.http.ts)   ← tipos de entrada/saída
               ▼
             AxiosAdapter → api (boot/axios.ts) → backend
```

1. **Http** (`@modules`): uma classe por recurso, recebe `HttpClient` no construtor, só monta URL e
   body. Os **tipos** do domínio ficam aqui (ex.: `Aprisco`, `ApriscoInput`).
2. **Boot** (`boot/<modulo>.boot.ts`): instancia e registra com `app.provide("<recurso>Http", …)`.
   Novo boot precisa entrar na lista `boot` de `quasar.config.ts`.
3. **Service** (`pages/<modulo>/<modulo>.service.ts`): classe instanciada **dentro do `setup()`**
   (usa `inject`/`useQuasar`/`useRouter`, então não pode ser criada fora de componente). Também
   exporta constantes e helpers de exibição (labels, cores, formatação).
4. **Page/componente**: estado em `reactive`, chama o service, trata `null` como erro já
   notificado.

## HTTP e tratamento de erro (`boot/axios.ts`)

- `baseURL` = `window.__env.URL_API` (gerado em runtime por `docker-entrypoint.sh` em
  `public/env-config.js`) ou `process.env.URL_API` do build. No Electron, vem do
  `localStorage.URL_API`.
- Headers fixos: `platform` (`web` ou `electron`) e `tenant` (só Electron,
  `localStorage.FLOW_TENANT`). No navegador o tenant é o `Origin` — por isso o domínio
  cadastrado em `auth_company_domains` precisa bater com a URL do app.
- `validateStatus: () => true` — o Axios nunca rejeita por status; o interceptor decide:
  - `< 300` com `data.message` → `Notify` verde;
  - `> 299` com `data.message` → `Notify` vermelho, roda `AxiosErrorService` (tour do
    driver.js se `data.data` vier como `[{ element, title, description }]`) e **lança erro** —
    é isso que cai no `catch` do service;
  - `401` → tenta `POST /auth/refresh-token`; se falhar, limpa o token e vai para `#/login`
    (exceto em rotas `publico`).
- Token: `localStorage["_kehila_token_bearer"]`, enviado como `Authorization: Bearer`.

> O backend **não tem** `/auth/refresh-token` nem emite refresh token: na prática todo 401 leva
> ao login. O interceptor também carrega mensagens de 401 herdadas de outro projeto
> ("verify-account", "settings/home"). Ver [pendências](../pendencias.md).

Como o interceptor já mostra a mensagem do backend, **o service não deve notificar erro de
novo** — só sucesso.

## Autorização na interface

- Não há *navigation guard* no router. Quem não tem token cai no login pelo 401 da primeira
  chamada.
- `MainLayout` mostra o menu completo só se `TokenDecode.execute().user.position === "admin"`
  (avaliado uma vez no `setup`). Não-admin vê apenas "Sair" e a home (apriscos que lidera).
- Esconder no menu não protege nada: a regra real está nos middlewares do backend.

## Multiempresa / layout

`MainLayout` e `BlankLayout` chamam `GET /ping` ao montar e guardam o retorno em
`useLayoutStore().layout` (`telaLogin.titulo/subTitulo`, `header.titulo/subTitulo`). O título
da aba vem de `layout.telaLogin.titulo`.

## Rotas

| Caminho | Nome | Tela |
|---|---|---|
| `/login` | `login` | `pages/auth/login/home.vue` (BlankLayout) |
| `/` | `home` | `pages/home.vue` — apriscos liderados |
| `/eventos`, `/eventos/criar`, `/eventos/:uuid`, `/eventos/:uuid/lotes` | `eventos*` | portal de eventos (admin) |
| `/bi` | `bi` | `pages/BI/home.vue` |
| `/empresa` | `empresa` | `pages/empresa/empresaEditar.vue` |
| `/financeiro/contas-bancarias[/criar\|/:uuid]`, `/financeiro/cobrancas`, `/financeiro/pagamentos` | `financeiro.*` | financeiro |
| `/usuarios[/criar\|/:uuid]` | `usuarios*` | usuários |
| `/membros[/criar\|/:uuid]` | `membros*` | membresia |
| `/apriscos[/criar\|/:uuid\|/:uuid/lider]` | `apriscos*` | apriscos |
| `/notificacao` | `notificacao` | gateways e teste de envio |
| `/publico/eventos/:eventoUuid` | `eventos.publico` | página pública de compra (BlankLayout) |

Padrão de nomes: `<modulo>` (lista), `<modulo>.criar`, `<modulo>.detalhe`. Telas de inclusão
e edição compartilham um `*Form.vue` com `novo<X>Form()` e `<x>FormParaInput()` exportados.

## Comandos

```bash
cd frontend
npm install
npm run dev        # quasar dev (porta 9000)
npm run build      # dist/spa
npm run lint
npm run format
```

`vite-plugin-checker` roda `vue-tsc` + ESLint no dev (desligue com `SKIP_TYPE_CHECK=1`).
Não há testes automatizados no frontend (`npm test` é um placeholder).

Variáveis: `URL_API`, `METABASE_URL`, `VITE_SOCKET_URL` (não usada), `URL_APP` (host do dev
server). Em produção (Dockerfile + nginx) são injetadas por `docker-entrypoint.sh`.

## Receita: nova tela de CRUD

1. `src/@modules/<modulo>/<recurso>.http.ts` com tipos + classe `<Recurso>Http`.
2. `src/boot/<modulo>.boot.ts` com `app.provide("<recurso>Http", new <Recurso>Http(new AxiosAdapter()))`
   e registre o boot em `quasar.config.ts`.
3. `src/pages/<modulo>/<modulo>.service.ts` (loading + notify de sucesso + `try/catch` retornando `null`).
4. Páginas `<x>Listar.vue`, `<x>Incluir.vue`, `<x>Editar.vue` e `<x>Form.vue`.
5. Rotas em `router/routes.ts` (filhas de `MainLayout`) e item em `MENU_ITEMS` do `MainLayout.vue`.
6. HTML vindo do usuário só com `v-html="sanitizeHtml(...)"`.

## Convenções

- Prettier com `printWidth` 100 no frontend (`.prettierrc.json`).
- Textos e nomes de domínio em português.
- Datas trafegam como `AAAA-MM-DD`; exibição via `ApiDate.format`.
- Itens de exemplo do template Quasar ainda presentes (`ExampleComponent.vue`,
  `EssentialLink.vue`, `stores/example-store.ts`) — não são usados.
