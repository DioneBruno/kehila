# Documentação de desenvolvimento — Kehila

Guia técnico para quem vai desenvolver no Kehila (gestão de igrejas: membros, apriscos/células,
eventos com bilheteria, financeiro, BI). Escrito a partir da leitura do código em nov/2026.

## Visão geral

```
┌────────────── frontend (Quasar/Vue 3) ──────────────┐        ┌──────── backend (NestJS) ────────┐
│ MainLayout (painel)      BlankLayout (login/público) │  HTTP  │ http/ (controllers, middlewares)  │
│ pages/<modulo> → service → @modules/<x>.http ────────┼───────►│ @modules/ (use cases, SQL)        │
└──────────────────────────────────────────────────────┘ JSON   │ @infra/ (Postgres, Redis)         │
                                                                 └──┬──────────┬──────────┬────────┘
                                                                    │          │          │
                                                          PostgreSQL 17     Redis     Asaas · SMTP · Vonage · Metabase
```

- **Módulos por empresa:** `auth_company_modulos` (`igreja`, `imoveis`) liga/desliga pacotes de
  rotas e itens de menu (ver [backend › imóveis](backend/modulos/imoveis.md)).
- **Multiempresa:** cada igreja é uma `auth_companies`. Rotas públicas descobrem a empresa pelo
  domínio (`Origin`); rotas logadas, pelo JWT.
- **Perfis:** `admin` (position), **interno** (qualquer usuário da igreja) e **externo**
  (participante cadastrado pelo portal de eventos).

## Índice

### Arquitetura
- [Backend — camadas, DI, autenticação, erros, banco, testes, receita de caso de uso](backend/arquitetura.md)
- [Frontend — boot, HTTP/interceptors, services, rotas, receita de tela](frontend/arquitetura.md)

### Módulos

| Módulo | O que é | Backend | Frontend |
|---|---|---|---|
| Auth | login por senha/código, JWT, perfil | [backend](backend/modulos/auth.md) | [frontend](frontend/modulos/auth.md) |
| Usuário | contas de acesso por empresa | [backend](backend/modulos/usuario.md) | [frontend](frontend/modulos/usuario.md) |
| Empresa | dados da igreja, domínios, layout | [backend](backend/modulos/empresa.md) | [frontend](frontend/modulos/empresa.md) |
| Membresia | pessoas, vínculos familiares, gerar usuário | [backend](backend/modulos/membresia.md) | [frontend](frontend/modulos/membresia.md) |
| Aprisco | células, integrantes, presença | [backend](backend/modulos/aprisco.md) | [frontend](frontend/modulos/aprisco.md) |
| Portal de Eventos | eventos, lotes, pedidos, ingressos | [backend](backend/modulos/portalEventos.md) | [frontend](frontend/modulos/portalEventos.md) |
| Financeiro | Asaas: cobranças, boleto, cartão, baixa | [backend](backend/modulos/financeiro.md) | [frontend](frontend/modulos/financeiro.md) |
| Imóveis | pessoas, imóveis, contratos de locação, painel (módulo por empresa) | [backend](backend/modulos/imoveis.md) | [frontend](frontend/modulos/imoveis.md) |
| Notificação | e-mail SMTP, SMS Vonage | [backend](backend/modulos/notificacao.md) | [frontend](frontend/modulos/notificacao.md) |
| BI | painéis Metabase embutidos | [backend](backend/modulos/bi.md) | [frontend](frontend/modulos/bi.md) |

### Riscos e dívidas
- [Pendências, riscos e dívidas técnicas](pendencias.md) — lista priorizada do que foi encontrado.

## Começando

```bash
# backend
cd backend
cp .env.example .env            # defina AUTH_JWT_SECRET e REDIS_URL
docker compose -f docker-compose-dev.yml up -d database redis
npm install
npm run migration:run-dev
npm run start:dev               # :3000

# frontend
cd frontend
npm install
npm run dev                     # :9000 — URL_API em .env / public/env-config.js
```

Cadastre em `auth_company_domains` a origem exata do frontend (ex.: `http://localhost:9000`)
para a empresa de teste; sem isso o login responde "Empresa não encontrada para o domínio
informado".

## Mapa rápido das dependências entre módulos

```
portalEventos ──► financeiro (GerarCobrancaUsecase) ──► notificacao (e-mail de pagamento)
auth ──► notificacao (código de login por e-mail)
auth ──► usuario (UsuarioQuery em /auth/me)
membresia ──► usuario/auth (cria auth_users) e aprisco (vincula integrante)
aprisco ──► membresia (auth_pessoas)
bi ──► Metabase (token de embed)
imoveis ──► empresa/modulos (ModuloImoveisMiddleware; igreja usa ModuloIgrejaMiddleware)
imoveis (contratos) ──► imoveis (imóveis e pessoas); eventos ──► auth_users (criado_por_uuid)
```

## Mantendo esta documentação

Ao criar/alterar um caso de uso, endpoint, tabela ou tela, atualize a página do módulo no mesmo
PR. Ao corrigir um item de [pendências](pendencias.md), remova-o da lista.
