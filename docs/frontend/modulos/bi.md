# BI (frontend)

- Cliente: `src/@modules/BI/bi.gateway.ts` (`POST bi`, `POST bi/salvar`, `DELETE bi/:uuid`,
  `GET bi/:uuid/montar`)
- Tela: `pages/BI/home.vue` + `pages/BI/bi.service.ts` (rota `bi`)
- Backend: [bi](../../backend/modulos/bi.md)

## Como funciona

1. Lista os painéis cadastrados (busca full-text no backend).
2. Ao abrir um item, pede o token (`montar`) e monta o iframe:
   `${METABASE_URL}/embed/${referencia.tipo}/${token}#bordered=true&titled=true`.
   O script `${METABASE_URL}/app/embed.js` é injetado na página.
3. Admin cadastra/edita: título, descrição, `referencia` (`dashboard` ou `question` + id do
   Metabase).

`METABASE_URL` vem de `window.__env` ou do build. O token expira em 10 minutos; reabra o painel
para renovar.
