# Contas do imóvel (encargos, despesas e guias) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Contas a pagar do módulo imóveis (encargos, despesas, guias) com pagamento, parcelas, anexos e agenda de vencimentos.

**Architecture:** Uma tabela `imovel_contas` + `imovel_conta_anexos`, regras numa `ContaEntity` pura, repositórios com transação e `FOR UPDATE`, leituras no `ImoveisQuery`, rotas em `http/imoveis/contas.controller.ts`. Frontend segue a receita de CRUD do módulo (http → boot → service → páginas).

**Tech Stack:** NestJS 11, SQL cru via `dataSource.query`/`manager.query` (TypeORM só migrations), PostgreSQL 17, Jest (integração com banco); Quasar 2 + Vue 3 + TypeScript.

**Spec:** `docs/superpowers/specs/2026-11-26-gestao-imoveis-contas-design.md`

## Global Constraints

- `company_uuid` sempre de `req.companyUuid`, nunca do corpo; todo SQL filtra por `company_uuid` e `deleted_at IS NULL`.
- UUID de rota, query ou corpo passa por `garantirUuid(valor, mensagem404)` (`@modules/imoveis/shared/garantirUuid.ts`) antes do SQL.
- Resposta `{ success, data, meta }`; paginação `pagina` (padrão 1) / `porPagina` (padrão 20, máx. 100).
- Erros com `ApiError(mensagem, status)`; mensagens em português, exatamente as da tabela "Mensagens" abaixo.
- Datas trafegam como `YYYY-MM-DD`; validar com `validarData` de `contratos/contrato.entity.ts`. `hoje` vem de `ApiDate.now("YYYY-MM-DD")` no controller e é passado como parâmetro.
- Dinheiro `decimal(12,2)`; devolver como `number` (padrão do `ImoveisQuery`).
- `TypeORM` + pg: `manager.query` de `UPDATE … RETURNING` devolve `[linhas, quantidade]`.
- Ordem de locks: contrato → imóvel → pessoa (`FOR UPDATE`, dentro de `connections.database.transaction`).
- Exclusão: soft delete, só admin (`exigirAdmin(req)` no controller).
- Migrations novas em `backend/src/@infra/database/migrations/imoveis/`, timestamps `1792000000500` e `1792000000600`.
- Testes de backend: integração contra o banco `kehila` em `localhost:5437` (container `kehila-database`). **Nunca** apontar para containers `flow-*`. O worktree precisa de `backend/.env` (git-ignored) copiado do checkout principal; rode `npm run migration:run` antes. Cada suíte usa `companyUuid` próprio e limpa no `afterAll`.
- Frontend: `vue-tsc` exige Node ≥ 22.22 (`/home/dione/.nvm/versions/node/v22.22.3/bin`); há erros antigos em outras páginas — o critério é **nenhum erro novo** em arquivos tocados. `npm run lint` sem erro novo.
- Commits terminam com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

### Mensagens (verbatim)

| Constante | Texto | Status |
|---|---|---|
| `MSG_CONTA_NAO_ENCONTRADA` | Conta não encontrada | 404 |
| `MSG_TIPO_INVALIDO` | Tipo de conta inválido | 400 |
| `MSG_CATEGORIA_INVALIDA` | Categoria inválida para o tipo | 400 |
| `MSG_INFORME_ESFERA` | Informe a esfera da guia | 400 |
| `MSG_ESFERA_SO_GUIA` | Esfera só se aplica a guias | 400 |
| `MSG_ESFERA_INVALIDA` | Esfera inválida | 400 |
| `MSG_INFORME_DESCRICAO` | Informe a descrição | 400 |
| `MSG_INFORME_PROPRIETARIO` | Informe o proprietário | 400 |
| `MSG_PROPRIETARIO_NAO_ENCONTRADO` | Proprietário não encontrado | 404 |
| `MSG_NAO_PROPRIETARIO` | A pessoa não é proprietária | 400 |
| `MSG_IMOVEL_NAO_ENCONTRADO` (já existe) | Imóvel não encontrado | 404 |
| `MSG_CONTRATO_NAO_ENCONTRADO` (já existe) | Contrato não encontrado | 404 |
| `MSG_CONTRATO_SEM_IMOVEL` | Informe o imóvel do contrato | 400 |
| `MSG_CONTRATO_OUTRO_IMOVEL` | O contrato não é deste imóvel | 400 |
| `MSG_INQUILINO_SEM_CONTRATO` | Informe o contrato quando o inquilino paga | 400 |
| `MSG_RESPONSAVEL_INVALIDO` | Responsável inválido | 400 |
| `MSG_VENCIMENTO_INVALIDO` | Vencimento inválido | 400 |
| `MSG_VALOR_INVALIDO` | Valor inválido | 400 |
| `MSG_COMPETENCIA_INVALIDA` | Competência inválida | 400 |
| `MSG_PAGO_EM_INVALIDO` | Data de pagamento inválida | 400 |
| `MSG_PAGO_EM_FUTURO` | A data de pagamento não pode ser futura | 400 |
| `MSG_VALOR_PAGO_INVALIDO` | Valor pago inválido | 400 |
| `MSG_CONTA_JA_PAGA` | Conta já está paga | 409 |
| `MSG_CONTA_NAO_PAGA` | Conta não está paga | 409 |
| `MSG_QUANTIDADE_PARCELAS` | A quantidade de parcelas deve ser entre 2 e 60 | 400 |
| `MSG_PESSOA_COM_CONTAS` | Não é possível excluir: há contas lançadas para esta pessoa | 409 |
| `MSG_IMOVEL_COM_CONTAS` | Não é possível excluir imóvel com contas lançadas | 409 |
| `MSG_ENVIE_ARQUIVO` | Envie um arquivo | 400 |
| `MSG_ARQUIVO_GRANDE` | O arquivo deve ter no máximo 10 MB | 400 |
| `MSG_FORMATO_ANEXO` | Formato inválido. Use PDF, PNG ou JPG | 400 |
| `MSG_TIPO_ANEXO_INVALIDO` | Tipo de anexo inválido | 400 |
| `MSG_ANEXO_NAO_ENCONTRADO` | Anexo não encontrado | 404 |

## Review Focus

1. **Fronteiras da agenda e da situação** (`hoje`, `hoje+6`, `hoje+7`, `hoje+29`, `hoje+30`): uma conta não paga vencida ontem tem de aparecer em "vencidas", nunca em "a pagar" — teste na Task 4.
2. **Parcelas com dia 29/30/31** (31/jan → 28 ou 29/fev → 31/mar, sem arrastar o dia): teste de `calcularVencimentosParcelas` na Task 1.
3. **Troca de imóvel no PATCH** re-deriva o proprietário; imóvel → `null` sem `proprietarioUuid` → 400; contrato que não é do novo imóvel → 400 — testes na Task 3.
4. **Corrida incluir conta × excluir imóvel/pessoa** termina com uma das duas falhando de forma limpa (409/404), nunca com conta apontando para registro excluído — teste na Task 3.
5. **Valores como texto/vírgula/negativo/zero** (`"180,00"`, `-1`, `0` em `valor`; `0` aceito em `valorPago`) — testes na Task 1.

---

### Task 1: Migrations, tipos e `ContaEntity` (regras puras)

**Files:**
- Create: `backend/src/@infra/database/migrations/imoveis/1792000000500-create-imovel_contas.migration.ts`
- Create: `backend/src/@infra/database/migrations/imoveis/1792000000600-create-imovel_conta_anexos.migration.ts`
- Modify: `backend/src/@modules/imoveis/shared/imoveis.tipos.ts`
- Create: `backend/src/@modules/imoveis/contas/conta.entity.ts`
- Test: `backend/src/@modules/imoveis/contas/__test__/conta.entity.test.ts` (sem banco)

**Interfaces:**
- Produces (em `imoveis.tipos.ts`):
  - `ContaTipo = "encargo" | "despesa" | "guia"`, `CONTA_TIPOS`
  - `ContaEsfera = "municipal" | "estadual" | "federal"`, `CONTA_ESFERAS`
  - `ContaResponsavel = "proprietario" | "inquilino"`, `CONTA_RESPONSAVEIS`
  - `ContaSituacao = "a_pagar" | "vencida" | "paga"`, `CONTA_SITUACOES`
  - `AnexoTipo = "documento" | "comprovante"`, `ANEXO_TIPOS`
  - `CATEGORIAS_POR_TIPO: Record<ContaTipo, string[]>` (listas exatas do spec, seção 1)
- Produces (em `conta.entity.ts`): todas as constantes `MSG_*` novas da tabela; e
  - `type ContaDados = { tipo; categoria; esfera: ContaEsfera | null; descricao: string | null; proprietarioUuid: string | null; imovelUuid: string | null; contratoUuid: string | null; responsavel; competencia: string | null; vencimento: string; valor: number; fornecedor: string | null; documentoNumero: string | null; observacoes: string | null }`
  - `validarDadosConta(input: Record<string, unknown>): ContaDados` — valida tipo, categoria∈tipo, esfera (obrigatória p/ guia, proibida nos outros), descrição (obrigatória se `outros`), uuids (`garantirUuid`, 404 com a mensagem da entidade), `contratoUuid` sem `imovelUuid` → `MSG_CONTRATO_SEM_IMOVEL`, `responsavel` (padrão `proprietario`; `inquilino` sem contrato → `MSG_INQUILINO_SEM_CONTRATO`), vencimento, valor (`> 0`, `< 1e10`, 2 casas; aceita número ou string numérica com ponto; rejeita vírgula, boolean, vazio), competência normalizada para dia 1, textos opcionais com `textoOpcional`. **Não** exige proprietário (quem decide é o repositório, porque depende do imóvel).
  - `validarPagamento(input: { pagoEm: unknown; valorPago?: unknown }, valorConta: number, hoje: string): { pagoEm: string; valorPago: number }` — `valorPago` padrão = `valorConta`; aceita `0`.
  - `calcularVencimentosParcelas(primeiro: string, quantidade: number): string[]` — mesmo dia do primeiro, mês a mês; mês sem o dia → último dia do mês.
  - `avancarCompetencia(competencia: string, meses: number): string`
  - `situacaoConta(c: { pagoEm: string | null; vencimento: string }, hoje: string): ContaSituacao`

- [ ] **Step 1: Escrever os testes de `conta.entity.test.ts`**

```ts
describe("validarDadosConta", () => {
  it("aceita encargo IPTU com imóvel", ...);                       // responsavel padrão 'proprietario', esfera null
  it("rejeita categoria de outro tipo", ...);                      // {tipo:'encargo', categoria:'darf'} -> MSG_CATEGORIA_INVALIDA
  it("exige esfera em guia", ...);                                 // MSG_INFORME_ESFERA
  it("rejeita esfera fora de guia", ...);                          // MSG_ESFERA_SO_GUIA
  it("exige descrição em 'outros'", ...);                          // MSG_INFORME_DESCRICAO
  it("rejeita contrato sem imóvel", ...);                          // MSG_CONTRATO_SEM_IMOVEL
  it("exige contrato quando o inquilino paga", ...);               // MSG_INQUILINO_SEM_CONTRATO
  it.each(["180,00", -1, 0, "", true, null])("rejeita valor %p", ...); // MSG_VALOR_INVALIDO
  it("aceita valor '180.5' e arredonda para 180.5", ...);
  it("normaliza competência 2026-03-15 para 2026-03-01", ...);
  it("rejeita vencimento 2026-02-30", ...);                        // MSG_VENCIMENTO_INVALIDO
  it("uuid malformado de imóvel vira 404", ...);                   // ApiError status 404, MSG_IMOVEL_NAO_ENCONTRADO
});
describe("validarPagamento", () => {
  it("valorPago padrão é o valor da conta", ...);
  it("aceita valorPago 0", ...);
  it("rejeita pagoEm depois de hoje", ...);                        // MSG_PAGO_EM_FUTURO
});
describe("calcularVencimentosParcelas", () => {
  it("31/01/2027 x3 -> ['2027-01-31','2027-02-28','2027-03-31']", ...);
  it("31/01/2028 x2 -> ['2028-01-31','2028-02-29']", ...);
  it("10/11/2026 x3 cruza o ano -> ['2026-11-10','2026-12-10','2027-01-10']", ...);
});
describe("situacaoConta", () => {
  it("paga quando pagoEm preenchido, mesmo vencida", ...);
  it("vencida quando vencimento < hoje", ...);
  it("a_pagar quando vencimento == hoje", ...);
});
```

- [ ] **Step 2: Rodar e ver falhar** — `cd backend && npx jest src/@modules/imoveis/contas/__test__/conta.entity.test.ts` → FAIL (módulo não existe).
- [ ] **Step 3: Implementar tipos e `conta.entity.ts`** com as assinaturas acima. Reaproveitar `validarData` e `textoOpcional`.
- [ ] **Step 4: Escrever as duas migrations** exatamente com as colunas, CHECKs e índices parciais da seção 1 do spec (com `valor_pago >= 0`). Padrão de `1792000000300-create-imovel_contratos.migration.ts` (`CREATE TABLE IF NOT EXISTS`, `CONSTRAINT "PK_…"`, `down` com `DROP TABLE IF EXISTS`; a de anexos derruba antes da de contas). Nomes de índice `IDX_imovel_contas_<coluna>`.
- [ ] **Step 5: Rodar testes e migrations** — `npx jest …conta.entity.test.ts` PASS; `npm run migration:run` aplica as duas sem erro; `npm run build` compila.
- [ ] **Step 6: Commit** — `Adiciona tabelas e regras das contas do imóvel`.

---

### Task 2: Incluir conta e gerar parcelas

**Files:**
- Create: `backend/src/@modules/imoveis/contas/incluirConta/incluirConta.usecase.ts`, `incluirContaRepository.ts`
- Create: `backend/src/@modules/imoveis/contas/gerarParcelas/gerarParcelas.usecase.ts`
- Create: `backend/src/@modules/imoveis/contas/vinculosConta.ts`
- Test: `backend/src/@modules/imoveis/contas/__test__/contas.test.ts`

**Interfaces:**
- Consumes: `validarDadosConta`, `validarPagamento`, `calcularVencimentosParcelas`, `avancarCompetencia` (Task 1).
- Produces:
  - `resolverVinculosConta(manager: Consultavel, companyUuid: string, d: ContaDados): Promise<{ proprietarioUuid: string }>` em `vinculosConta.ts` — trava, nesta ordem e com `FOR UPDATE`, contrato (se houver; 404 se não existe; `MSG_CONTRATO_OUTRO_IMOVEL` se `imovel_uuid` difere), imóvel (se houver; 404) e proprietário. Com imóvel: proprietário = `imovel_imoveis.proprietario_uuid` (ignora o enviado). Sem imóvel: exige `d.proprietarioUuid` (`MSG_INFORME_PROPRIETARIO`), 404 se não existe, `MSG_NAO_PROPRIETARIO` se `eh_proprietario = false`.
  - `IncluirContaRepository.incluir(companyUuid: string, contas: ContaLinha[]): Promise<void>` — uma transação; chama `resolverVinculosConta` uma vez (todas as linhas têm os mesmos vínculos) e insere todas.
  - `ContaLinha = ContaDados & { uuid; proprietarioUuid: string; pagoEm: string | null; valorPago: number | null; grupoUuid: string | null; parcelaNumero: number | null; parcelaTotal: number | null }`
  - `IncluirContaUsecase.execute(input: { companyUuid: string; hoje: string } & Record<string, unknown>): Promise<{ uuid: string }>` — se `pagoEm` vier, valida com `validarPagamento`.
  - `GerarParcelasUsecase.execute(input: { companyUuid: string } & Record<string, unknown>): Promise<{ uuids: string[]; grupoUuid: string }>` — usa `primeiroVencimento`, `quantidade` (inteiro 2–60, `MSG_QUANTIDADE_PARCELAS`), `valorParcela` (como `valor`); ignora/rejeita `pagoEm` (não grava pagamento); mesma `IncluirContaRepository.incluir`.

- [ ] **Step 1: Testes de integração em `contas.test.ts`** (helpers `pessoa/imovel/contrato` como em `__test__/painel.query.test.ts`, com `eh_proprietario` ligado no dono):
  - `inclui encargo com imóvel e usa o dono do imóvel, ignorando proprietarioUuid enviado`
  - `inclui guia sem imóvel com proprietário informado`
  - `sem imóvel e sem proprietário -> 400 MSG_INFORME_PROPRIETARIO`
  - `proprietário sem eh_proprietario -> 400 MSG_NAO_PROPRIETARIO`
  - `contrato de outro imóvel -> 400 MSG_CONTRATO_OUTRO_IMOVEL`
  - `aceita contrato encerrado do mesmo imóvel`
  - `imóvel de outra empresa -> 404`
  - `despesa já paga grava pago_em e valor_pago`
  - `gera 10 parcelas com mesmo grupo, numeração 1..10, competência avançando`
  - `gerar parcelas com imóvel inexistente não grava nenhuma linha`
- [ ] **Step 2: Rodar e ver falhar** — `npx jest src/@modules/imoveis/contas/__test__/contas.test.ts`.
- [ ] **Step 3: Implementar** `vinculosConta.ts`, repositório e os dois use cases.
- [ ] **Step 4: Rodar e ver passar.**
- [ ] **Step 5: Commit** — `Inclui contas do imóvel e geração de parcelas`.

---

### Task 3: Alterar, pagar, desfazer, excluir conta e bloqueios de exclusão

**Files:**
- Create: `backend/src/@modules/imoveis/contas/alterarConta/alterarConta.usecase.ts`, `alterarContaRepository.ts`
- Create: `backend/src/@modules/imoveis/contas/pagamentoConta/pagamentoConta.usecase.ts` (registrar e desfazer), `pagamentoContaRepository.ts`
- Create: `backend/src/@modules/imoveis/contas/deletarConta/deletarConta.usecase.ts`, `deletarContaRepository.ts`
- Modify: `backend/src/@modules/imoveis/pessoas/deletarPessoa/deletarPessoaRepository.ts`, `backend/src/@modules/imoveis/imoveis/deletarImovel/deletarImovelRepository.ts`
- Test: `backend/src/@modules/imoveis/contas/__test__/contas.test.ts` (mesma suíte), `pessoas/__test__/pessoas.test.ts`, `imoveis/__test__/imoveis.test.ts`

**Interfaces:**
- Consumes: `validarDadosConta`, `validarPagamento`, `resolverVinculosConta`.
- Produces:
  - `AlterarContaUsecase.execute(input: { companyUuid; uuid } & Record<string, unknown>): Promise<void>` — trava a conta (`FOR UPDATE`, 404), mescla os campos enviados sobre os atuais (mapa camelCase → coluna; ignora `grupoUuid`, `parcela*`, `pagoEm`, `valorPago`, `companyUuid`), revalida o resultado com `validarDadosConta`, chama `resolverVinculosConta` (re-deriva o proprietário se houver imóvel) e grava.
  - `PagamentoContaUsecase.registrar(input: { companyUuid; uuid; hoje; pagoEm; valorPago? }): Promise<void>` — 409 `MSG_CONTA_JA_PAGA` se já paga.
  - `PagamentoContaUsecase.desfazer(input: { companyUuid; uuid }): Promise<void>` — 409 `MSG_CONTA_NAO_PAGA` se não paga.
  - `DeletarContaUsecase.execute(input: { companyUuid; uuid }): Promise<void>` — soft delete da conta e dos anexos dela.
  - `DeletarPessoaRepository`/`DeletarImovelRepository`: depois do lock existente e da checagem atual, `EXISTS` em `imovel_contas` não excluídas (`proprietario_uuid = $2` / `imovel_uuid = $2`) → 409 `MSG_PESSOA_COM_CONTAS` / `MSG_IMOVEL_COM_CONTAS`.

- [ ] **Step 1: Testes**
  - `altera valor e categoria de conta paga mantendo o pagamento`
  - `trocar imovelUuid re-deriva o proprietário`
  - `imovelUuid null sem proprietarioUuid -> 400 MSG_INFORME_PROPRIETARIO`
  - `trocar imóvel mantendo contrato do imóvel antigo -> 400 MSG_CONTRATO_OUTRO_IMOVEL`
  - `PATCH não altera grupo_uuid, parcela_numero, pago_em`
  - `registrar pagamento com valorPago 0 e desfazer`
  - `registrar em conta paga -> 409; desfazer em conta aberta -> 409`
  - `excluir conta some da listagem e dos anexos` (verificar `deleted_at` via SQL)
  - `excluir pessoa proprietária de conta (sem imóvel) -> 409 MSG_PESSOA_COM_CONTAS` (em `pessoas.test.ts`)
  - `excluir imóvel com conta paga -> 409 MSG_IMOVEL_COM_CONTAS` (em `imoveis.test.ts`)
  - `corrida: incluir conta e excluir imóvel em paralelo -> exatamente um sucesso; se a conta entrou, o imóvel não foi excluído` (`Promise.allSettled`, padrão dos testes de corrida de `contratos.test.ts`)
- [ ] **Step 2: Rodar e ver falhar.**
- [ ] **Step 3: Implementar.**
- [ ] **Step 4: Rodar as três suítes e ver passar** — `npx jest src/@modules/imoveis`.
- [ ] **Step 5: Commit** — `Altera, paga e exclui contas; bloqueia exclusão com contas`.

---

### Task 4: Leituras — lista, detalhe, agenda e painel

**Files:**
- Modify: `backend/src/@modules/imoveis/imoveis.query.ts`
- Test: `backend/src/@modules/imoveis/__test__/contas.query.test.ts`, `__test__/painel.query.test.ts`

**Interfaces:**
- Produces (em `ImoveisQuery`):
  - `ContaItem = { uuid; tipo; categoria; esfera; descricao; proprietarioUuid; proprietarioNome; imovelUuid; imovelIdentificacao; contratoUuid; contratoNumero; inquilinoNome; responsavel; competencia; vencimento; valor: number; pagoEm; valorPago: number | null; fornecedor; documentoNumero; grupoUuid; parcelaNumero; parcelaTotal; observacoes; situacao: ContaSituacao; createdAt }`
  - `ContaAnexoItem = { uuid; tipo: AnexoTipo; nomeArquivo; contentType; tamanho: number; createdAt }`
  - `ListarContasFiltro = { tipo?; categoria?; proprietarioUuid?; imovelUuid?; contratoUuid?; situacao?; responsavel?; vencimentoDe?; vencimentoAte?; busca?; pagina; porPagina }`
  - `listarContas(companyUuid, filtro, hoje): Promise<{ data: ContaItem[]; total: number; totalValor: number; totalPago: number }>` — ordem `vencimento, created_at`; `busca` com `ILIKE` em descrição/fornecedor/documento_numero; `situacao` traduzida em SQL com `hoje`.
  - `buscarConta(companyUuid, uuid, hoje): Promise<(ContaItem & { anexos: ContaAnexoItem[]; parcelas: { uuid; parcelaNumero; vencimento; situacao }[] }) | null>` — `parcelas` = outras contas do mesmo `grupo_uuid`.
  - `AgendaContas = { vencidas: GrupoAgenda; proximos7: GrupoAgenda; proximos30: GrupoAgenda }`, `GrupoAgenda = { total: number; soma: number; contas: ContaItem[] }`
  - `agendaContas(companyUuid, hoje, filtro: { proprietarioUuid?; imovelUuid?; tipo? }): Promise<AgendaContas>` — só não pagas; vencidas `< hoje`; proximos7 `hoje..hoje+6`; proximos30 `hoje+7..hoje+29`; até 50 por grupo.
  - `PainelImoveis` ganha `contasVencidas: number` (empresa toda).

- [ ] **Step 1: Testes** (`HOJE = "2026-11-24"`):
  - `agenda separa vencimentos 2026-11-23 / 24 / 30 / 12-01 / 12-23 / 12-24` → vencidas[23], 7d[24,30], 30d[12-01,12-23], fora[12-24]
  - `agenda ignora pagas e excluídas e outra empresa`
  - `agenda limita a 50 contas mas total e soma contam todas` (51 contas)
  - `agenda filtra por proprietário e os totais respeitam o filtro`
  - `listarContas filtra por situacao=vencida, tipo, imóvel, contrato e período; meta soma valor e valor_pago`
  - `buscarConta traz anexos não excluídos e as outras parcelas do grupo`
  - `painel conta contas vencidas da empresa` (em `painel.query.test.ts`)
- [ ] **Step 2: Rodar e ver falhar.**
- [ ] **Step 3: Implementar.**
- [ ] **Step 4: Rodar e ver passar.**
- [ ] **Step 5: Commit** — `Lista contas, agenda de vencimentos e contador no painel`.

---

### Task 5: Anexos

**Files:**
- Create: `backend/src/@modules/imoveis/contas/anexos/anexosConta.ts` (validação, repositório e use cases, no estilo de `@modules/empresa/layout/imagemLogin/imagemLogin.ts`)
- Test: `backend/src/@modules/imoveis/contas/__test__/anexos.test.ts`

**Interfaces:**
- Consumes: `StorageInterface` (`@modules/shared/connections/connectionStorage.interface.ts`).
- Produces:
  - `ANEXO_TAMANHO_MAXIMO = 10 * 1024 * 1024`
  - `validarArquivoAnexo(buffer: unknown): { tipo: string; ext: string }` — PDF (`%PDF`), PNG, JPG pelos bytes.
  - `EnviarAnexoContaUsecase(repo, storage).execute({ companyUuid; contaUuid; tipo; buffer; nomeArquivo }): Promise<{ uuid: string }>` — valida tipo do anexo (`MSG_TIPO_ANEXO_INVALIDO`), confere conta (404), envia para `empresas/<company>/imoveis/contas/<conta>/<anexoUuid>.<ext>`, depois grava o registro.
  - `UrlAnexoContaUsecase(repo, storage).execute({ companyUuid; contaUuid; anexoUuid }): Promise<{ url: string; nomeArquivo: string }>` — `generatePresignerUrl(caminho, 300)`.
  - `RemoverAnexoContaUsecase(repo).execute({ companyUuid; contaUuid; anexoUuid }): Promise<void>` — soft delete; 404 se não existe nessa conta.
- [ ] **Step 1: Testes com storage falso** (objeto que guarda `upload` em memória e devolve `url-fake:<path>`):
  - `envia PDF e grava registro com caminho da empresa e da conta`
  - `rejeita bytes de texto com extensão .pdf -> MSG_FORMATO_ANEXO`
  - `rejeita 10 MB + 1 -> MSG_ARQUIVO_GRANDE`
  - `conta de outra empresa -> 404 e não envia ao storage`
  - `url de anexo removido -> 404`
- [ ] **Step 2–4: falhar, implementar, passar.**
- [ ] **Step 5: Commit** — `Anexos das contas do imóvel`.

---

### Task 6: Rotas HTTP

**Files:**
- Create: `backend/src/http/imoveis/contas.controller.ts`
- Modify: `backend/src/http/imoveis/imoveis.module.ts` (providers e `forRoutes`), `backend/src/http/middleware/__test__/modulo.middleware.test.ts` (o teste da pilha de middlewares do `ImoveisModule` passa a incluir `ContasController`)

**Interfaces:**
- Consumes: todos os use cases das Tasks 2–5, `ImoveisQuery` (Task 4), `ConnectionStorageAwsS3` (como em `http/empresa/empresa.module.ts`).
- Produces: as rotas da tabela da seção 3 do spec, com `@Controller("imoveis/contas")`. **Declarar `@Get("agenda")` e `@Post("parcelas")` antes de `@Get(":uuid")`**. Upload com `FileInterceptor("arquivo", { limits: { fileSize: ANEXO_TAMANHO_MAXIMO + 1 } })` e `tipo` no corpo; `nomeArquivo` = `arquivo.originalname`. Status: 201 em POST de criação/anexo, 200 no resto. `DELETE /:uuid` chama `exigirAdmin(req)`. Filtros de enum inválidos → 400 (como `status` em `contratos.controller.ts`). `hoje` = `ApiDate.now("YYYY-MM-DD")`.
- [ ] **Step 1: Atualizar o teste da pilha de middlewares** para esperar `ContasController` entre as rotas com `JwtAuth + Interno + ModuloImoveis`; rodar e ver falhar.
- [ ] **Step 2: Implementar controller e registro no módulo.**
- [ ] **Step 3: Verificar** — `npx jest src/http src/@modules/imoveis` PASS; `npm run build` OK; subir o backend e um `curl` sem token em `GET /imoveis/contas/agenda` → 401.
- [ ] **Step 4: Commit** — `Rotas das contas do imóvel`.

---

### Task 7: Frontend — cliente HTTP, boot e service

**Files:**
- Create: `frontend/src/@modules/imoveis/conta.http.ts`
- Modify: `frontend/src/boot/imoveis.boot.ts` (`app.provide("contaHttp", …)`), `frontend/src/@modules/imoveis/painel.http.ts` (`contasVencidas`), `frontend/src/pages/imoveis/imoveis.service.ts`

**Interfaces:**
- Produces:
  - Tipos `Conta`, `ContaDetalhe`, `ContaAnexo`, `ContaInput`, `GerarParcelasInput`, `ListarContasFiltro`, `AgendaContas` espelhando a Task 4 e as entradas das Tasks 2–5.
  - `ContaHttp`: `listar(filtro)`, `buscar(uuid)`, `incluir(input)`, `gerarParcelas(input)`, `alterar(uuid, input)`, `deletar(uuid)`, `registrarPagamento(uuid, { pagoEm, valorPago })`, `desfazerPagamento(uuid)`, `enviarAnexo(uuid, arquivo: File, tipo)` (FormData), `urlAnexo(uuid, anexoUuid)`, `removerAnexo(uuid, anexoUuid)`, `agenda(filtro)`.
  - Em `imoveis.service.ts`: constantes `CONTA_TIPOS`, `CATEGORIAS_POR_TIPO` (com rótulos: "IPTU", "Taxa de lixo", "Taxa municipal", "Condomínio", "Água", "Energia", "Gás", "Seguro", "Manutenção", "Conservação", "Reforma", "Limpeza", "Serviço", "Carnê-leão", "DARF", "DAS", "GPS", "ISS", "ITBI", "ITCMD", "Outros"), `CONTA_ESFERAS`, `ESFERA_PADRAO_POR_CATEGORIA` (carne_leao/darf/das/gps → federal; itcmd → estadual; iss/itbi → municipal), `CONTA_SITUACOES` (cores: a_pagar `primary`, vencida `negative`, paga `positive`), `labelCategoria`, `labelConta(c)` (categoria ou descrição + " 3/10" se parcela); métodos do service para cada chamada, no padrão existente (loading, notify de sucesso, `null`/`false` em erro).
- [ ] **Step 1: Implementar.**
- [ ] **Step 2: Verificar** — `npx vue-tsc --noEmit` sem erro novo nos arquivos tocados; `npm run lint`.
- [ ] **Step 3: Commit** — `Cliente HTTP e service das contas no frontend`.

---

### Task 8: Frontend — telas de contas

**Files:**
- Create: `frontend/src/pages/imoveis/contaListar.vue`, `contaIncluir.vue`, `contaEditar.vue` (detalhe + edição + pagamento + anexos), `contaForm.vue`, `contaPagamentoDialog.vue`
- Modify: `frontend/src/router/routes.ts` (`imoveis/contas` → `imoveis.contas`, `imoveis/contas/criar` → `imoveis.contas.criar`, `imoveis/contas/:uuid` → `imoveis.contas.detalhe`), `frontend/src/layouts/menu.ts` (item "Contas", ícone `receipt_long`, `modulo: "imoveis"`, depois de Contratos)

**Interfaces:**
- Consumes: `ImoveisService` (Task 7); `contaIncluir.vue` aceita query `imovelUuid` e `contratoUuid` para pré-preencher (usado pela Task 9).
- Produces: `contaPagamentoDialog.vue` com props `conta: { uuid; valor; ... }` e evento `pago` (reusado pela agenda na Task 9).
- Comportamento do formulário (spec seção 4): tipo → categoria (opções de `CATEGORIAS_POR_TIPO`) → esfera (só guia, pré-preenchida por `ESFERA_PADRAO_POR_CATEGORIA`) → imóvel (opcional) → contrato (opções = contratos do imóvel; pré-seleciona o vigente; pode limpar) → proprietário (travado e preenchido quando há imóvel) → quem paga (inquilino desabilitado sem contrato) → vencimento, valor, competência (seletor mês/ano, envia `AAAA-MM-01`), fornecedor, nº do documento, observações; "já está paga" (data + valor pago); "gerar em parcelas" (quantidade 2–60, primeiro vencimento, valor da parcela) só na inclusão.
- Detalhe: situação com cor; botões Pagar / Desfazer pagamento; anexos (enviar com tipo, abrir em nova aba via `urlAnexo`, remover); lista das outras parcelas do grupo com link; Excluir só para admin (mesmo critério das telas de imóvel).
- Lista: filtros (tipo, categoria, situação, proprietário, imóvel, período), lê filtros iniciais da query string (a agenda linka com eles), totais `totalValor`/`totalPago` do `meta`.
- [ ] **Step 1: Implementar.**
- [ ] **Step 2: Verificar** — `vue-tsc` sem erro novo; `npm run lint`.
- [ ] **Step 3: Commit** — `Telas de contas do imóvel`.

---

### Task 9: Frontend — agenda, painel e seções no imóvel/contrato

**Files:**
- Create: `frontend/src/pages/imoveis/agenda.vue`, `frontend/src/components/ContasDoVinculo.vue` (lista compacta de contas por `imovelUuid` ou `contratoUuid` + botão "Nova conta")
- Modify: `frontend/src/router/routes.ts` (`imoveis/agenda` → `imoveis.agenda`), `frontend/src/layouts/menu.ts` ("Agenda", ícone `event`, logo após Painel), `frontend/src/pages/imoveis/painel.vue` (card "Contas vencidas (N)" → `imoveis.agenda`), `imovelEditar.vue` e `contratoDetalhe.vue` (seção "Contas" com `ContasDoVinculo`)

**Interfaces:**
- Consumes: `ImoveisService.agenda`, `contaPagamentoDialog.vue` (Task 8), rota `imoveis.contas` com query de filtros, `imoveis.contas.criar?imovelUuid=&contratoUuid=`.
- Agenda: filtros proprietário/imóvel/tipo; três cards (contagem + soma) — o selecionado mostra a lista; colunas vencimento, tipo, categoria (`labelConta`), proprietário, imóvel, valor, ação **Pagar**; ao pagar, recarrega. Se `total > contas.length`, mostrar "mostrando 50 de N" com link para `imoveis.contas` filtrada (situação/período e filtros atuais).
- [ ] **Step 1: Implementar.**
- [ ] **Step 2: Verificar** — `vue-tsc` sem erro novo; `npm run lint`; no navegador (backend + frontend locais, empresa só com módulo imóveis): incluir IPTU em 10x num imóvel, ver na agenda, pagar uma parcela, anexar PDF e abrir, ver seção Contas no imóvel e no contrato, card no painel.
- [ ] **Step 3: Commit** — `Agenda de contas e seções no imóvel e no contrato`.

---

### Task 10: Documentação

**Files:**
- Modify: `docs/backend/modulos/imoveis.md` (tabelas, regras, rotas, anexos, mensagens 409 novas), `docs/frontend/modulos/imoveis.md` (telas, rotas, componente), `docs/frontend/arquitetura.md` (linha de rotas `imoveis.*` inclui agenda e contas), `docs/pendencias.md` (seção "Imóveis — contas": arquivo órfão no bucket ao remover anexo ou falhar gravação; sem exclusão em lote de parcelas; conta de contrato antigo usa o dono atual do imóvel; sem testes HTTP do controller)
- [ ] **Step 1: Escrever.**
- [ ] **Step 2: Conferir links relativos** (`grep -o "](.*)" ` nos arquivos tocados e abrir cada caminho).
- [ ] **Step 3: Commit** — `Documenta as contas do imóvel`.
