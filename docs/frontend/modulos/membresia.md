# Membresia (frontend)

- HTTP + tipos: `src/@modules/membresia/membresia.http.ts` (`Membro`, `MembroInput`, `Vinculo`,
  `VinculoInput`, `CriarUsuarioMembroInput`)
- Service: `pages/membresia/membresia.service.ts` (labels de tipos de vínculo, estado civil etc.)
- Boot: `boot/membresia.boot.ts` → `provide("membresiaHttp")`
- Backend: [membresia](../../backend/modulos/membresia.md)

## Telas

| Rota | Arquivo | Conteúdo |
|---|---|---|
| `membros` | `membroListar.vue` | lista completa (o backend não pagina; filtro é local) |
| `membros.criar` | `membroIncluir.vue` + `membroForm.vue` | cadastro |
| `membros.detalhe` | `membroEditar.vue` | dados + `membroVinculos.vue` + `membroUsuario.vue` |

- `membroVinculos.vue`: adiciona vínculos familiares (tipo + tipo inverso opcional) e remove o par.
- `membroUsuario.vue`: cria o usuário de acesso a partir do membro (senha, cargo, roles,
  aprisco opcional). Só admin; se `membro.usuarioUuid` já existe, mostra o vínculo.

## Dica

Campos de `meta` são mesclados no backend: envie só as chaves que mudaram.
