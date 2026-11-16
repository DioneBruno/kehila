# Aprisco (frontend)

- HTTP + tipos: `src/@modules/aprisco/aprisco.http.ts` (`Aprisco`, `Integrante`, `Presenca`,
  `DIAS_SEMANA`, `PapelIntegrante`, `TipoPresenca`)
- Service: `pages/aprisco/aprisco.service.ts` — além do CRUD, exporta `STATUS_APRISCO`,
  `PAPEIS_INTEGRANTE`, `statusAprisco()`, `papelIntegrante()`, `descricaoEncontro()`
  ("Quinta às 20:00") e `linkMapa()` (Google Maps por coordenada ou endereço)
- Boot: `boot/aprisco.boot.ts` → `provide("apriscoHttp")`
- Backend: [aprisco](../../backend/modulos/aprisco.md)

## Telas

| Rota | Arquivo | Conteúdo |
|---|---|---|
| `apriscos` | `apriscoListar.vue` | lista com busca e status |
| `apriscos.criar` | `apriscoIncluir.vue` + `apriscoForm.vue` | cadastro |
| `apriscos.detalhe` | `apriscoEditar.vue` | dados + `apriscoIntegrantes.vue`; excluir só para admin |
| `apriscos.lider` | `apriscoVisaoLider.vue` | visão do líder: dados do encontro + `apriscoPresencas.vue` |
| `home` | `pages/home.vue` | cards dos apriscos em que o usuário é LIDER (`/apriscos/liderados`) |

`apriscoForm.vue` exporta `novoApriscoForm()` e `apriscoFormParaInput()` (converte o form em
`ApriscoInput`, tratando vazio → `null`).

`apriscoPresencas.vue`: escolhe a data da reunião, carrega `GET presencas?data=`, marca
integrantes e informa quantidade de crianças/visitantes; salvar regrava a reunião inteira.

## Atenção

A visão do líder é só um filtro de UI: o backend permite a qualquer usuário interno registrar
presença em qualquer aprisco.
