# Gestão de Imóveis — Contas do imóvel (encargos, despesas e guias) — design

Data: 2026-11-26 · Tamanho: projeto (mesma ordem da etapa 1)

Continua o módulo [imóveis](../../backend/modulos/imoveis.md) (etapa 1:
[design](2026-11-24-gestao-imoveis-etapa1-design.md)).

## Intenção

O escritório de contabilidade opera o Kehila para vários proprietários (PF e PJ). Além do
aluguel, cada imóvel e cada proprietário têm contas com prazo: IPTU e taxas municipais,
condomínio, despesas de manutenção e as guias de impostos que o contador gera em outros
sistemas (Receita, prefeitura, estado). Hoje isso fica em planilha ou na cabeça.

Este documento cobre três dos nove itens pedidos:

- Controle de IPTU, taxas municipais, tributos e demais encargos.
- Controle das despesas de manutenção, conservação e serviços dos imóveis.
- Emissão e acompanhamento das guias e obrigações municipais, estaduais e federais.

O uso principal é a **agenda**: abrir o sistema e ver o que venceu e o que vai vencer, por
cliente, para não perder prazo. O segundo uso (prestação de contas por proprietário/imóvel/
período, ex.: para o IR) vem depois, mas os dados já são guardados para isso.

## Objetivos, não-objetivos, anti-objetivos

- **Objetivo:** cadastrar contas a pagar ligadas ao proprietário e, quando fizer sentido, a um
  imóvel e a um contrato; marcar como pagas; anexar o PDF da guia e o comprovante.
- **Objetivo:** agenda com vencidas, próximos 7 dias e 8–30 dias, filtrável por cliente.
- **Objetivo:** gerar várias parcelas de uma vez (IPTU em 10x, condomínio do ano).
- **Não-objetivo:** calcular impostos ou emitir guias (o contador gera fora; aqui só controle).
- **Não-objetivo:** e-mail, SMS ou qualquer aviso fora do sistema (decisão do usuário: só painel).
- **Não-objetivo:** repassar ao inquilino na cobrança do aluguel (etapa 2, ainda não existe);
  aqui só se registra *quem paga*.
- **Não-objetivo:** relatórios de prestação de contas (próxima fatia); recorrência automática;
  item "documentação cadastral, fiscal e patrimonial" (fica para outra fatia).
- **Anti-objetivo:** a agenda mostrar como "em dia" uma conta vencida e não paga.

## Decisões do usuário

- Guias: **só controle**; o contador gera em outro lugar.
- Os dois usos (agenda e prestação de contas), **agenda primeiro**.
- Alertas: **só no painel** (opção A), sem e-mail.
- Abordagem **1**: uma tabela única + ação "gerar parcelas".
- Sugestão do usuário: a conta pode ser **de um contrato específico**, porque o imóvel pode ter
  vários contratos anteriores.

## Abordagens consideradas

| | Abordagem | Troca | |
|---|---|---|---|
| **1** | Tabela única `imovel_contas` com `tipo` (encargo/despesa/guia) e `categoria`; ação "gerar parcelas" | Uma agenda, uma tela, uma soma para o relatório futuro; campos específicos de um tipo ficam opcionais para todos | **Escolhida** |
| 2 | Três tabelas (encargos, despesas, guias) | Campos sob medida; agenda e relatório viram UNION de três; ~3× o código | — |
| 3 | Regras de recorrência que geram parcelas sozinhas (job agendado) | Menos digitação; motor de recorrência, job e edição de regra com parcelas já geradas — exagero agora | — |

## Design

### 1. Modelo de dados (migrations em `migrations/imoveis/`, a partir de `1792000000500`)

**`imovel_contas`**

```
created_at, updated_at, deleted_at,
uuid PK,
company_uuid      -> auth_companies(uuid) ON DELETE CASCADE, NOT NULL
tipo              varchar NOT NULL CHECK IN ('encargo','despesa','guia')
categoria         varchar NOT NULL            -- lista por tipo, validada no código (abaixo)
esfera            varchar NULL CHECK IN ('municipal','estadual','federal')
                                              -- obrigatória quando tipo = 'guia'; NULL nos demais
descricao         varchar NULL                -- obrigatória quando categoria = 'outros'
proprietario_uuid -> imovel_pessoas(uuid), NOT NULL
imovel_uuid       -> imovel_imoveis(uuid), NULL
contrato_uuid     -> imovel_contratos(uuid), NULL
responsavel       varchar NOT NULL DEFAULT 'proprietario' CHECK IN ('proprietario','inquilino')
competencia       date NULL                   -- sempre dia 1 do mês de referência
vencimento        date NOT NULL
valor             decimal(12,2) NOT NULL CHECK (valor > 0)
pago_em           date NULL
valor_pago        decimal(12,2) NULL CHECK (valor_pago >= 0)   -- 0 = dispensada/isenta
fornecedor        varchar NULL                -- prestador / órgão emissor
documento_numero  varchar NULL                -- nº da guia, código de barras, nº da nota
grupo_uuid        uuid NULL                   -- parcelas geradas juntas
parcela_numero    smallint NULL, parcela_total smallint NULL
observacoes       text NULL
CHECK ((pago_em IS NULL) = (valor_pago IS NULL))
CHECK (contrato_uuid IS NULL OR imovel_uuid IS NOT NULL)
CHECK (responsavel = 'proprietario' OR contrato_uuid IS NOT NULL)
```

Índices parciais (`deleted_at IS NULL`): `(company_uuid, vencimento)` para a agenda;
`proprietario_uuid`, `imovel_uuid`, `contrato_uuid`, `grupo_uuid`.

**`imovel_conta_anexos`**

```
created_at, deleted_at,
uuid PK,
company_uuid -> auth_companies(uuid) ON DELETE CASCADE
conta_uuid   -> imovel_contas(uuid) NOT NULL
tipo         varchar NOT NULL CHECK IN ('documento','comprovante')
nome_arquivo varchar NOT NULL    -- nome original, só para exibir
caminho      varchar NOT NULL    -- chave no bucket
content_type varchar NOT NULL
tamanho      integer NOT NULL
```

**Situação** não é coluna; é derivada (com `hoje` de `ApiDate`, como no painel da etapa 1):
`paga` se `pago_em` preenchido; `vencida` se `vencimento < hoje` e não paga; senão `a_pagar`.

**Categorias** (constante compartilhada backend/frontend; `outros` em todos os tipos):

| tipo | categorias |
|---|---|
| encargo | `iptu`, `taxa_lixo`, `taxa_municipal`, `condominio`, `agua`, `energia`, `gas`, `seguro`, `outros` |
| despesa | `manutencao`, `conservacao`, `reforma`, `limpeza`, `servico`, `outros` |
| guia | `carne_leao`, `darf`, `das`, `gps`, `iss`, `itbi`, `itcmd`, `outros` |

Na tela, a categoria da guia pré-preenche a esfera (carnê-leão/DARF/DAS/GPS → federal;
ITCMD → estadual; ISS/ITBI → municipal); o usuário pode trocar.

### 2. Regras

- `company_uuid` sempre do `req`; todo SQL filtra por ele e por `deleted_at IS NULL`.
  UUIDs de rota/corpo passam por `garantirUuid` (inválido → 404), como na etapa 1.
- **Proprietário:**
  - com `imovelUuid`: o servidor usa o **proprietário atual do imóvel** e ignora o
    `proprietarioUuid` enviado;
  - sem imóvel: `proprietarioUuid` é obrigatório e precisa ser uma pessoa da empresa com
    `eh_proprietario = true`.
  - Trocar o dono do imóvel depois **não** altera contas já lançadas (histórico).
- **Contrato:** se informado, precisa ser do mesmo `imovelUuid` (qualquer status, inclusive
  encerrado). `responsavel = 'inquilino'` exige contrato. Mensagens 400 claras para cada caso.
- `esfera` obrigatória para guia e rejeitada (400) para os outros tipos; `descricao`
  obrigatória quando `categoria = 'outros'`; categoria precisa pertencer ao tipo.
- **Pagamento:** registrar com `pagoEm` (obrigatório, não pode ser futuro) e `valorPago`
  (padrão = `valor`; pode diferir por multa/juros/desconto). Desfazer o pagamento limpa os dois.
  Uma despesa que já chega paga é lançada com `pagoEm`/`valorPago` no próprio cadastro.
- **Gerar parcelas:** mesma entrada do cadastro + `quantidade` (2–60) + `primeiroVencimento`
  + `valorParcela`. Cria N contas na mesma transação com o mesmo `grupo_uuid`,
  `parcela_numero` 1..N, `parcela_total` N, vencimentos mensais no mesmo dia do primeiro;
  em mês sem esse dia, usa o último dia do mês (sem "arrastar" o dia para as seguintes).
  `competencia`, se informada, avança um mês por parcela. Cada parcela depois é editável
  sozinha. Não aceita `pagoEm` na geração.
- **Competência:** o servidor normaliza qualquer data para o dia 1 do mesmo mês (na tela é um
  seletor de mês/ano).
- **Edição (PATCH):** todos os campos do cadastro são editáveis, inclusive em conta paga
  (correção de lançamento). Não são editáveis: `grupo_uuid`, `parcela_numero`,
  `parcela_total`, `pago_em`/`valor_pago` (mudam só pelas rotas de pagamento). As validações
  do cadastro valem para o estado final da conta; se `imovelUuid` mudar, o proprietário é
  derivado de novo do imóvel; se o imóvel virar `null`, `proprietarioUuid` passa a ser
  obrigatório.
- **Proprietário em conta de contrato antigo:** o contrato não guarda o proprietário, então
  vale o proprietário atual do imóvel no momento do lançamento (mesma regra de sempre). Em
  imóvel vendido, o usuário ajusta tirando o imóvel e escolhendo o proprietário à mão.
- **Exclusão:** soft delete, só admin (`exigirAdmin`), igual à etapa 1. Uma de cada vez.
  Contratos continuam sem rota de exclusão.
- **Bloqueios novos na etapa 1:** excluir pessoa ou imóvel que tenha contas (não excluídas,
  pagas ou não) ligadas → 409 com mensagem explicando o motivo; para excluir, o admin exclui
  as contas antes. Uma pessoa conta como ligada se for `proprietario_uuid` de alguma conta.
- **Locks:** incluir/alterar conta trava com `FOR UPDATE`, na ordem contrato → imóvel →
  pessoa, os registros a que a conta vai apontar (contrato se houver, imóvel se houver,
  proprietário). Excluir pessoa/imóvel já trava o próprio registro (etapa 1); a checagem de
  contas roda depois do lock. Assim não há corrida entre incluir conta e excluir.
- **Anexos:** PDF, PNG ou JPG, até 10 MB, formato conferido pelos bytes (como
  `validarImagemLogin`). Caminho `empresas/<company>/imoveis/contas/<conta>/<anexo>.<ext>`.
  Download por URL assinada de curta duração (5 min) gerada sob demanda. Remover anexo é soft
  delete do registro (o `StorageInterface` não tem delete; o arquivo fica no bucket).
  Qualquer usuário interno anexa e remove. Ordem: envia ao bucket e depois grava o registro;
  se a gravação falhar, o arquivo fica órfão no bucket (aceito, já que não há delete).

### 3. API (`http/imoveis/contas.controller.ts`, `@modules/imoveis/contas/`)

Mesmos middlewares das rotas `/imoveis/*` (JWT + interno + `exigirModulo("imoveis")`).
Padrão `success/data/meta`, paginação `pagina`/`porPagina` (máx. 100), update parcial com mapa
de colunas.

| Rota | Uso |
|---|---|
| `GET /imoveis/contas` | lista com filtros `tipo`, `categoria`, `proprietarioUuid`, `imovelUuid`, `contratoUuid`, `situacao` (`a_pagar`/`vencida`/`paga`), `responsavel`, `vencimentoDe`/`vencimentoAte`, `busca` (descrição/fornecedor/nº do documento); ordem por vencimento; `meta` traz, para o filtro inteiro, `totalValor` (soma de `valor` de todas as linhas) e `totalPago` (soma de `valor_pago` das pagas) |
| `POST /imoveis/contas` | inclui uma conta |
| `POST /imoveis/contas/parcelas` | gera N parcelas; devolve `{ uuids, grupoUuid }` |
| `GET/PATCH/DELETE /imoveis/contas/:uuid` | detalhe (com anexos e dados de imóvel/contrato/proprietário), edição parcial, exclusão (admin) |
| `POST/DELETE /imoveis/contas/:uuid/pagamento` | registra / desfaz pagamento |
| `POST /imoveis/contas/:uuid/anexos` | multipart, campos `arquivo` e `tipo` |
| `GET /imoveis/contas/:uuid/anexos/:anexoUuid/url` | URL assinada para abrir/baixar |
| `DELETE /imoveis/contas/:uuid/anexos/:anexoUuid` | remove anexo |
| `GET /imoveis/contas/agenda` | três grupos de contas não pagas: **vencidas**, **próximos 7 dias** (`hoje` a `hoje+6`), **8 a 30 dias** (`hoje+7` a `hoje+29`); cada grupo com contagem, soma e as contas (as 50 primeiras por vencimento); filtros `proprietarioUuid`, `imovelUuid`, `tipo`, que valem também para contagem e soma |

`GET /imoveis/painel` (etapa 1) ganha só a contagem de contas vencidas da empresa toda, para o
card que leva à agenda.

### 4. Telas (frontend, `pages/imoveis/`)

Menu IMÓVEIS: Painel · **Agenda** · Proprietários · Imóveis · Contratos · **Contas** · Inquilinos.

```
Agenda                         [Proprietário ▾] [Imóvel ▾] [Tipo ▾]
┌──────────────────────────────────────────────────────────────────┐
│ Vencidas (3) R$ 1.240,00 │ Próximos 7 dias (5) R$ 830,00 │ 8–30 dias (12) │
├──────────────────────────────────────────────────────────────────┤
│ Venc.     Tipo     Categoria  Proprietário  Imóvel        Valor  │
│ 20/11/26  Guia     Carnê-leão João P.       —           312,00 ⚠│  [Pagar]
│ 25/11/26  Encargo  IPTU 3/10  João P.       Ap 302      180,00 ⚠│  [Pagar]
└──────────────────────────────────────────────────────────────────┘
```

- **Agenda:** cards com contagem e soma; lista do grupo selecionado; ação rápida **Pagar**
  (diálogo com data e valor pago, padrão hoje e o valor da conta). Se o grupo tiver mais de
  50, a lista avisa "mostrando 50 de N" com link para a tela Contas já filtrada.
- **Contas:** lista com os filtros da API e totais do filtro; incluir, editar, gerar parcelas.
- **Formulário:** tipo → categoria (e esfera, se guia) → imóvel (opcional) → contrato
  (pré-preenchido com o vigente do imóvel, trocável por um anterior ou vazio) → proprietário
  (preenchido pelo imóvel e travado; livre se não houver imóvel) → quem paga → vencimento,
  valor, competência, fornecedor, nº do documento, observações. Opção "já está paga".
  Opção "gerar em parcelas" troca valor/vencimento por quantidade/primeiro vencimento/valor
  da parcela.
- **Detalhe da conta:** dados, situação, pagamento (registrar/desfazer), anexos (enviar com
  tipo documento ou comprovante, abrir, remover), link para as outras parcelas do grupo.
- **Imóvel (editar) e contrato (detalhe):** seção "Contas" listando as contas ligadas, com
  "Nova conta" pré-preenchida.
- **Painel (etapa 1):** card "Contas vencidas (N)" que abre a agenda.

Seguem a receita de CRUD do frontend (`conta.http.ts`, boot, `imoveis.service.ts`,
`conta*.vue`).

### 5. Testes

- Backend, integração por use case (padrão do projeto, `companyUuid` próprio, limpeza no
  `afterAll`): isolamento por empresa; proprietário derivado do imóvel; contrato de outro
  imóvel → 400; inquilino sem contrato → 400; esfera/categoria/descrição; gerar parcelas
  (dia 31 em fevereiro, competência avançando, transação inteira ou nada); pagar e desfazer;
  situação derivada nas fronteiras (`hoje`, `hoje+6`, `hoje+7`, `hoje+29`); bloqueio de
  exclusão de pessoa/imóvel com contas; anexo com bytes inválidos → 400; storage falso nos
  testes.
- Testes usam o banco `kehila` em `kehila-database:5437`; nunca containers `flow-*`.
- Frontend: verificação manual no navegador (agenda, pagar, parcelas, anexo).

### 6. Documentação

Atualizar `docs/backend/modulos/imoveis.md` e `docs/frontend/modulos/imoveis.md` (contas,
agenda, anexos, regras); rotas novas em `docs/frontend/arquitetura.md`; lacunas em
`docs/pendencias.md`.

## Decisões minhas (pode corrigir)

- Nome da tabela `imovel_contas` e da tela "Contas".
- Lista fixa de categorias (no código, não em tabela) e o campo `esfera` só para guias.
- Faixas da agenda: vencidas, 7 dias, 8–30 dias.
- Proprietário sempre derivado do imóvel quando há imóvel; trocar o dono não reescreve contas
  antigas.
- Anexos de até 10 MB (PDF/PNG/JPG), URL assinada de 5 min.
- Exclusão só por admin; pagamento e anexos por qualquer usuário interno.
- Sem exclusão em lote de parcelas (uma de cada vez).
- Conta paga continua editável (correção); pagamento só muda pelas rotas próprias.
- `valorPago` pode ser 0 (dispensa/isenção).
- Conta ligada a contrato antigo usa o proprietário atual do imóvel; em imóvel vendido, o
  ajuste é manual.
- Pessoa ou imóvel com qualquer conta não pode ser excluído enquanto as contas existirem.

## Deixado para o builder

- Nomes exatos de arquivos e use cases, seguindo a convenção em português.
- Se a agenda reaproveita a query da lista ou tem a sua.
- Layout fino das telas (seção de contas no imóvel/contrato como aba ou bloco).
