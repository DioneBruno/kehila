# Módulo Imóveis (backend)

> Gestão de imóveis para escritórios/imobiliárias (etapa 1): cadastro de pessoas
> (proprietários, inquilinos e fiadores), imóveis, contratos de locação com histórico de eventos
> (renovação, aditivo, encerramento, rescisão) e um painel de vencimentos e reajustes. Não há
> cobrança de aluguel nem repasse nesta etapa. Design completo em
> `docs/superpowers/specs/2026-11-24-gestao-imoveis-etapa1-design.md`.
>
> **Contas do imóvel** (encargos, despesas e guias, com agenda de vencimentos e anexos): design em
> `docs/superpowers/specs/2026-11-26-gestao-imoveis-contas-design.md`; ver a seção [Contas do imóvel](#contas-do-imóvel).

- Código: `backend/src/@modules/imoveis/`
- HTTP: `backend/src/http/imoveis/` (`PessoasController`, `ImoveisController`, `ContratosController`, `PainelController`, `ContasController`)
- Módulos por empresa: `backend/src/@modules/empresa/modulos/` e `backend/src/http/middleware/modulo.middleware.ts`
- Migrations: `backend/src/@infra/database/migrations/imoveis/` e `.../auth/1792000000000-create-auth_company_modulos`
- Frontend correspondente: [frontend › imóveis](../../frontend/modulos/imoveis.md)

## Módulos por empresa (habilitar o módulo)

Cada empresa tem uma lista de módulos em `auth_company_modulos` (`igreja`, `imoveis`, `admin`). A migration
cria a tabela e dá `igreja` a todas as empresas existentes, então nada muda para as igrejas atuais.
Empresa nova **sem linhas** não acessa nenhum dos dois pacotes.

Habilitar o módulo para um escritório: pela tela **Admin** (aba Módulos da empresa, ver
[módulo admin](admin.md)), que já limpa o cache Redis. Alternativa por SQL:

```sql
INSERT INTO auth_company_modulos (uuid, company_uuid, modulo) VALUES (gen_random_uuid(), '<company_uuid>', 'imoveis');
-- escritório puro: remover o pacote de igreja
UPDATE auth_company_modulos SET deleted_at = now() WHERE company_uuid = '<company_uuid>' AND modulo = 'igreja';
```

(Índice único parcial `(company_uuid, modulo) WHERE deleted_at IS NULL`: para reativar um módulo
removido, insira de novo; não "limpe" o `deleted_at`.)

> ⚠️ **Efeito não é imediato.**
> 1. **Cache do backend:** `ModuloIgrejaMiddleware`/`ModuloImoveisMiddleware` guardam os módulos da
>    empresa no Redis sob a chave `modulos:<companyUuid>` por **300 s** (valor: string separada por
>    vírgula, ex.: `igreja,imoveis`). Depois de mexer em `auth_company_modulos` por SQL, espere até
>    5 min ou apague a chave (`DEL modulos:<companyUuid>`).
> 2. **Token:** o menu do frontend lê `company.modulos` do JWT (gerado no login por
>    `GenerateTokenAuthenticationUserRepository`). O usuário precisa **logar de novo**.
>
> A tela Admin limpa o cache do backend na hora; o relogin do usuário continua necessário.

Bloqueio: `403 "Módulo não habilitado para esta empresa"`. Sem cache (Redis fora do ar) o
middleware consulta o banco a cada requisição; falha de cache nunca derruba a rota.

## Deploy

`ModuloImoveisMiddleware`/`ModuloIgrejaMiddleware` consultam `auth_company_modulos` em toda
requisição de igreja ou imóveis, e as migrations **não** rodam sozinhas (`backend/start.sh`).
Se o código subir antes da migration `1792000000000-create-auth_company_modulos`, todas as rotas
de igreja respondem 500. Passo obrigatório do release: rodar `npm run migration:run` antes (ou
junto) do deploy e confirmar o `TZ` em produção (as regras de vencimento usam datas locais).

Contas do imóvel: o release também traz as migrations `1792000000500-create-imovel_contas` e
`1792000000600-create-imovel_conta_anexos`; sem elas as rotas `/imoveis/contas*`, o painel
(`contasVencidas`) e a exclusão de pessoa/imóvel (checagem de contas) falham com 500. Os **anexos**
precisam do storage S3 já usado pela imagem de login da empresa (mesmas variáveis de ambiente); sem
ele o envio e a URL assinada falham, o resto das contas funciona.

## Acesso

`JwtAuthMiddleware` + `InternoMiddleware` + `ModuloImoveisMiddleware` em todos os controllers do
módulo (`ImoveisModule.configure`). Qualquer usuário **interno** da empresa com o módulo habilitado
acessa tudo (não exige `admin`). Rotas sob `/imoveis/...`.

## Tabelas

Todas com `uuid`, `company_uuid` (FK `auth_companies`, `ON DELETE CASCADE`), `created_at`,
`updated_at` e soft delete (`deleted_at`). Toda consulta filtra `company_uuid` e `deleted_at IS NULL`.

| Tabela | Observações |
|---|---|
| `auth_company_modulos` | `company_uuid`, `modulo` (`igreja`/`imoveis`); único por (empresa, módulo) ativo |
| `imovel_pessoas` | `tipo` `PF`/`PJ`, `documento` (só dígitos, até 14; CPF ou CNPJ), `nome`, `nome_fantasia`, `rg_ie`, contato, endereço (`endereco_*`, `endereco_uf` 2 letras), flags `eh_proprietario`/`eh_inquilino`/`eh_fiador`. Único `(company_uuid, documento)` entre ativas |
| `imovel_imoveis` | `proprietario_uuid` (FK pessoa), `identificacao`, `tipo`, `finalidade`, endereço, `inscricao_iptu`, `matricula`, `cartorio`, `area_m2 decimal(12,2)`, `situacao` (`livre`/`alugado`/`reforma`/`inativo`, padrão `livre`) |
| `imovel_contratos` | `imovel_uuid`, `inquilino_uuid`, `fiador_uuid` opc., `numero`, `inicio`/`fim` `date` (CHECK `fim > inicio`), `valor_aluguel`, `dia_vencimento` 1–31, `indice_reajuste` (`IGPM/IPCA/INPC/IGPDI/nenhum`), `mes_reajuste` 1–12, `multa_atraso_pct` (2,00), `juros_mes_pct` (1,00), `desconto_pontualidade_pct`, `multa_rescisoria_meses`, `garantia_tipo` (`fiador/caucao/seguro_fianca/titulo_capitalizacao/nenhuma`), `garantia_valor`, `status` (`vigente/encerrado/rescindido`), `encerrado_em` |
| `imovel_contas` | ver [Contas do imóvel](#contas-do-imóvel) |
| `imovel_conta_anexos` | idem |
| `imovel_contrato_eventos` | `contrato_uuid` (cascade), `tipo` (`renovacao/aditivo/encerramento/rescisao`), `data`, `descricao`, `valor_anterior/novo`, `fim_anterior/novo`, `criado_por_uuid` (FK `auth_users`, `SET NULL`) |

Índice único parcial **`UQ_imovel_contratos_imovel_vigente`**: no máximo **um contrato vigente por
imóvel**. É a rede de segurança do lock (a violação vira `409 "Imóvel não está livre para locação"`).

## Regras de domínio

**Pessoa** (`pessoas/pessoa.entity.ts`)
- `tipo` (PF/PJ) define a validação do documento (CPF ou CNPJ) e **não pode ser alterado**;
  documento duplicado na empresa → `409 "Já existe uma pessoa com este documento"`.
- Os papéis são flags independentes (a mesma pessoa pode ser proprietária e inquilina). Criar
  contrato liga `eh_inquilino`/`eh_fiador` automaticamente; as flags nunca são desligadas sozinhas.
- Excluir pessoa que é `proprietario_uuid` de alguma conta não excluída →
  `409 "Não é possível excluir: há contas lançadas para esta pessoa"`.

**Imóvel** (`imoveis/imovel.entity.ts`, `imoveis/situacaoImovel.ts`)
- `identificacao` obrigatória; proprietário precisa existir na empresa.
- A situação `alugado` **só é definida pelo contrato** (criar → `alugado`; encerrar/rescindir → `livre`).
  Via `PATCH` o usuário só alterna entre `livre`, `reforma`, `inativo`, e **não** muda a situação de
  imóvel com contrato vigente (409).
- Excluir (soft) imóvel com contrato vigente → 409.
- Excluir imóvel com **qualquer conta** não excluída (paga ou não) → `409 "Não é possível excluir imóvel com contas lançadas"`.

**Contrato** (`contratos/contrato.entity.ts`)
- Só cria contrato para imóvel `livre`; inquilino ≠ proprietário do imóvel.
- `fim > inicio`; datas `AAAA-MM-DD` reais.
- `garantia_tipo = fiador` exige `fiadorUuid` (≠ inquilino). Com outra garantia o `fiadorUuid`
  enviado é **ignorado em silêncio** (fica `null`).
- Com índice ≠ `nenhum` e sem `mesReajuste`, o mês de reajuste padrão é o mês do `inicio`.
- `PATCH` edita só: `numero`, `inicio`, `diaVencimento`, `indiceReajuste`, `mesReajuste`, percentuais,
  `garantia*`, `fiadorUuid`, `observacoes`. Enviar `fim`/`valorAluguel` → 400 ("Use renovação ou
  aditivo…"); `status`/`imovelUuid`/`inquilinoUuid` → 400. Só contrato `vigente` pode ser alterado.
- **Valor e data de fim só mudam por evento** (histórico auditável).

**Eventos** (`registrarEventoContrato`) — só em contrato `vigente`; `descricao` obrigatória:

| Tipo | Efeito |
|---|---|
| `renovacao` | exige `fimNovo` > fim atual; opcional `valorNovo`; atualiza o contrato |
| `aditivo` | exige `valorNovo` e/ou `fimNovo` (`fimNovo` > início); atualiza o contrato |
| `encerramento` | contrato → `encerrado`, `encerrado_em = data`, imóvel → `livre` |
| `rescisao` | idem, contrato → `rescindido` |

O evento guarda `valor_anterior`/`fim_anterior` quando houve mudança, e `criado_por_uuid` (usuário do token).

> **Contrato vencido continua `vigente`.** Passada a data de `fim` o status **não muda sozinho**
> (Lei do Inquilinato: prazo indeterminado). Ele aparece no painel em **"Vencidos"** até alguém
> renovar ou encerrar. Não há job que mude status.

## Endpoints

Resposta: `{ success: true, data, meta? }`. Listas: `pagina` (1-based, padrão 1) e `porPagina`
(padrão 20, máx. 100); `meta.total`. `:uuid` malformado → 404 com a mensagem da entidade.

| Método e rota | Use case / query | Notas |
|---|---|---|
| `GET /imoveis/pessoas` | `listarPessoas` | filtros `papel` (`proprietario`/`inquilino`/`fiador`), `busca` (nome, nome fantasia, documento) |
| `GET /imoveis/pessoas/:uuid` | `buscarPessoa` | |
| `POST /imoveis/pessoas` | `IncluirPessoaUsecase` | 201 `{ uuid }` |
| `PATCH /imoveis/pessoas/:uuid` | `AlterarPessoaUsecase` | update parcial |
| `DELETE /imoveis/pessoas/:uuid` | `DeletarPessoaUsecase` | 409 se proprietária de imóvel ativo ou inquilina/fiadora de contrato vigente |
| `GET /imoveis/imoveis` | `listarImoveis` | filtros `proprietarioUuid`, `situacao`, `busca` |
| `GET /imoveis/imoveis/:uuid` | `buscarImovel` | detalhe com proprietário e contrato vigente |
| `POST` / `PATCH` / `DELETE /imoveis/imoveis[/:uuid]` | `Incluir/Alterar/DeletarImovelUsecase` | |
| `GET /imoveis/contratos` | `listarContratos` | filtros `proprietarioUuid`, `imovelUuid`, `inquilinoUuid`, `status`, `busca` |
| `GET /imoveis/contratos/:uuid` | `buscarContrato` | |
| `POST /imoveis/contratos` | `IncluirContratoUsecase` | corpo: `imovelUuid`, `inquilinoUuid`, `inicio`, `fim`, `valorAluguel`, `diaVencimento`, `indiceReajuste`, `garantiaTipo` + opcionais |
| `PATCH /imoveis/contratos/:uuid` | `AlterarContratoUsecase` | ver regras acima |
| `GET /imoveis/contratos/:uuid/eventos` | `listarEventosContrato` | histórico |
| `POST /imoveis/contratos/:uuid/eventos` | `RegistrarEventoContratoUsecase` | `{ tipo, data, descricao, valorNovo?, fimNovo? }` |
| `GET /imoveis/painel` | `ImoveisQuery.painel` | ver abaixo |
| `/imoveis/contas/...` | `ContasController` | 12 rotas, ver [Contas do imóvel](#contas-do-imóvel) |

Controllers montam o input **campo a campo** (nunca `...body`); `company_uuid` vem do token. Exceção: o `ContasController` espalha o corpo primeiro (`...body`) e coloca `companyUuid`, `uuid` e `hoje` por último, para que o cliente nunca os sobrescreva.

## Painel (`GET /imoveis/painel`)

Só contratos `vigente`, em seis grupos:

| Chave | Critério (com `hoje`) |
|---|---|
| `vencidos` | `fim < hoje` |
| `vence0a30` / `vence31a60` / `vence61a90` | `fim` em `hoje..+30`, `+31..+60`, `+61..+90` dias |
| `reajustesMes` | índice ≠ `nenhum`, `mes_reajuste` = mês de `hoje` e `inicio` anterior ao mês atual |
| `imoveisLivres` | imóveis com `situacao = 'livre'` |

Além dos seis grupos, o painel devolve `contasVencidas`: **contagem** (número) das contas não pagas
com `vencimento < hoje` da empresa toda, para o card que leva à agenda.

Ordenação: `fim`, identificação do imóvel, uuid.

> ⚠️ **Fuso horário.** `hoje` vem de `ApiDate.now("YYYY-MM-DD")`, que segue `process.env.TZ`. Em
> **produção `TZ` precisa estar definido** (o compose de dev usa `TZ=America/Cuiaba`); sem isso a
> data vira à meia-noite UTC e o painel adianta o dia no fim da tarde.

## Contas do imóvel

Contas a pagar ligadas ao proprietário e, opcionalmente, a um imóvel e a um contrato: encargos (IPTU,
condomínio…), despesas (manutenção…) e guias de impostos que o contador gera fora (aqui só controle,
sem cálculo nem emissão). Uso principal: a **agenda** de vencimentos. Código em
`@modules/imoveis/contas/` (`conta.entity.ts` com validações e mensagens, um diretório por use case,
`anexos/anexosConta.ts`, `vinculosConta.ts` com as travas); leitura em `ImoveisQuery`
(`listarContas`, `buscarConta`, `agendaContas`); HTTP em `http/imoveis/contas.controller.ts`.
Listas fixas (tipos, categorias, esferas, responsáveis, situações) em `shared/imoveis.tipos.ts`.

### Tabelas

Migrations `1792000000500-create-imovel_contas` e `1792000000600-create-imovel_conta_anexos`
(`migrations/imoveis/`). Também com `uuid`, `company_uuid`, `created_at` e `deleted_at`.

| Tabela | Observações |
|---|---|
| `imovel_contas` | `tipo` (`encargo/despesa/guia`), `categoria`, `esfera` (`municipal/estadual/federal`, só guia), `descricao`, `proprietario_uuid` (NOT NULL), `imovel_uuid` e `contrato_uuid` opc., `responsavel` (`proprietario`/`inquilino`, padrão `proprietario`), `competencia` (dia 1 do mês), `vencimento`, `valor` decimal(12,2) > 0, `pago_em`/`valor_pago` (`valor_pago` ≥ 0; 0 = dispensada/isenta), `fornecedor`, `documento_numero`, `grupo_uuid`/`parcela_numero`/`parcela_total`, `observacoes`. CHECKs: `pago_em` e `valor_pago` nascem juntos; contrato exige imóvel; `responsavel = inquilino` exige contrato. Índices parciais por `(company_uuid, vencimento)`, proprietário, imóvel, contrato e grupo |
| `imovel_conta_anexos` | `conta_uuid`, `tipo` (`documento`/`comprovante`), `nome_arquivo` (só exibição), `caminho` (chave no bucket), `content_type`, `tamanho` |

**Situação** não é coluna: derivada na consulta com `hoje` (`ApiDate`) — `paga` se há `pago_em`;
`vencida` se `vencimento < hoje` e não paga; senão `a_pagar`. Conta vencida e não paga nunca aparece
como "a pagar".

**Categorias** (validadas no código; `outros` existe em todos os tipos e exige `descricao`):

| Tipo | Categorias |
|---|---|
| encargo | `iptu`, `taxa_lixo`, `taxa_municipal`, `condominio`, `agua`, `energia`, `gas`, `seguro`, `outros` |
| despesa | `manutencao`, `conservacao`, `reforma`, `limpeza`, `servico`, `outros` |
| guia | `carne_leao`, `darf`, `das`, `gps`, `iss`, `itbi`, `itcmd`, `outros` |

### Regras

- **Proprietário.** Com `imovelUuid`, o dono vem **sempre do imóvel** (o `proprietarioUuid` enviado é
  ignorado). Sem imóvel, `proprietarioUuid` é obrigatório e precisa ser pessoa da empresa com
  `eh_proprietario`. No `PATCH`, o dono é **re-derivado só quando o `imovelUuid` muda** (para outro
  imóvel); alterar outros campos mantém o dono já gravado. Se o imóvel passa a `null`, é preciso
  informar `proprietarioUuid`. Trocar o dono do imóvel depois **não** reescreve contas já lançadas.
- **Contrato.** Se informado, tem de ser do mesmo imóvel (qualquer status, inclusive encerrado) e
  exige `imovelUuid`. `responsavel = inquilino` exige contrato.
- **Esfera e descrição.** `esfera` obrigatória em guia e rejeitada nos demais tipos; categoria tem de
  pertencer ao tipo; `descricao` obrigatória quando `categoria = outros`.
- **Competência.** Qualquer data é normalizada para o dia 1 do mês.
- **Pagamento.** `POST .../pagamento` com `pagoEm` (obrigatório, não futuro) e `valorPago` (padrão =
  `valor`; pode diferir; 0 vale). `DELETE .../pagamento` limpa os dois. Pagar conta já paga →
  `409 "Conta já está paga"`; desfazer conta não paga → `409 "Conta não está paga"`. Conta que já chega
  paga é lançada com `pagoEm`/`valorPago` no cadastro.
- **Gerar parcelas** (`POST /imoveis/contas/parcelas`): mesmos campos do cadastro + `quantidade`
  (2–60, senão `400 "A quantidade de parcelas deve ser entre 2 e 60"`), `primeiroVencimento` e
  `valorParcela`. Cria N contas numa transação, com o mesmo `grupo_uuid`, `parcela_numero` 1..N e
  `parcela_total` N. Vencimento mensal no dia do primeiro; em mês sem esse dia usa o último dia, sem
  arrastar o dia para as seguintes (31/jan → 28 ou 29/fev → 31/mar). A competência, se informada,
  avança um mês por parcela. Não aceita `pagoEm`. Depois cada parcela é editável sozinha.
- **Edição.** `PATCH` aceita os campos do cadastro, inclusive em conta paga (correção). Não mudam por
  aqui: `grupo_uuid`, `parcela_*`, `pago_em`/`valor_pago`. As validações valem para o estado final.
- **Exclusão.** Soft delete, só admin (`exigirAdmin`), uma conta por vez; **não há exclusão em lote de
  parcelas**.
- **Conta de contrato antigo** usa o dono **atual** do imóvel no lançamento (o contrato não guarda
  proprietário). Em imóvel vendido, o usuário tira o imóvel e escolhe o proprietário à mão.
- **Travas.** Incluir/alterar travam (`FOR UPDATE`) contrato → imóvel → pessoa, os registros a que a
  conta aponta (a mesma ordem da seção de concorrência abaixo); excluir pessoa/imóvel checa as contas
  depois de travar o próprio registro. Assim incluir conta × excluir termina com um dos dois falhando
  de forma limpa (409/404).

### Anexos

PDF, PNG ou JPG, até **10 MB**, formato conferido pelos bytes (`%PDF`, PNG, JPEG), não pela extensão.
Chave no bucket: `empresas/<company>/imoveis/contas/<conta>/<anexo>.<ext>`.

- Upload `multipart` em `POST /imoveis/contas/:uuid/anexos` (campos `arquivo` e `tipo`). O multer corta
  em 10 MB + 1 byte e o Nest responderia 413 em inglês; o `ArquivoGrandeInterceptor` do controller
  converte em `400 "O arquivo deve ter no máximo 10 MB"`. Sem arquivo → `400 "Envie um arquivo"`; formato
  inválido → `400 "Formato inválido. Use PDF, PNG ou JPG"`; `tipo` fora de `documento`/`comprovante` →
  `400 "Tipo de anexo inválido"`.
- Download por **URL assinada de 5 min** gerada sob demanda (`GET .../anexos/:anexoUuid/url`).
- Remover anexo é soft delete do registro: o `StorageInterface` não tem delete, então o **arquivo
  permanece no bucket**. Mesmo efeito se o registro falhar depois do upload (arquivo órfão).
- Qualquer usuário interno envia e remove anexos.

### Rotas

Mesmos middlewares das demais (`/imoveis/...`). `agenda` e `parcelas` são declaradas antes de `:uuid`.

| Método e rota | Notas |
|---|---|
| `GET /imoveis/contas` | filtros `tipo`, `categoria`, `proprietarioUuid`, `imovelUuid`, `contratoUuid`, `situacao` (`a_pagar/vencida/paga`), `responsavel`, `vencimentoDe`/`vencimentoAte`, `busca` (descrição, fornecedor, nº do documento); ordem por vencimento; `meta`: `total`, `totalValor` (soma de `valor` do filtro inteiro) e `totalPago` (soma de `valor_pago` das pagas) |
| `GET /imoveis/contas/agenda` | só contas **não pagas**, em `vencidas` (`< hoje`), `proximos7` (`hoje..hoje+6`) e `proximos30` (`hoje+7..hoje+29`); cada grupo `{ total, soma, contas }` com as **50 primeiras** por vencimento (total e soma cobrem o grupo inteiro); filtros `proprietarioUuid`, `imovelUuid`, `tipo` |
| `POST /imoveis/contas` | 201, inclui uma conta |
| `POST /imoveis/contas/parcelas` | 201, gera N parcelas e devolve `{ uuids, grupoUuid }` |
| `GET /imoveis/contas/:uuid` | detalhe com anexos, dados de imóvel/contrato/proprietário e as demais parcelas do grupo |
| `PATCH /imoveis/contas/:uuid` | update parcial |
| `DELETE /imoveis/contas/:uuid` | só admin |
| `POST` / `DELETE /imoveis/contas/:uuid/pagamento` | registra / desfaz pagamento |
| `POST /imoveis/contas/:uuid/anexos` | 201, upload (ver acima) |
| `GET /imoveis/contas/:uuid/anexos/:anexoUuid/url` | URL assinada |
| `DELETE /imoveis/contas/:uuid/anexos/:anexoUuid` | remove o anexo |

Filtros com valor inválido (`tipo`, `situacao`, datas, `categoria` fora do tipo) → 400 com mensagem
própria; query repetida (`?tipo=a&tipo=b`) também é 400; UUID malformado → 404 da entidade.

## Concorrência e travas (mantenha a ordem)

Criação de contrato, eventos, exclusão de imóvel/pessoa e mudança de situação do imóvel rodam em
transação com `SELECT … FOR UPDATE`. **Ordem de travas: contrato → imóvel → pessoa**, e quando há
mais de uma pessoa (inquilino + fiador) elas são travadas **em ordem de uuid** (`ORDER BY uuid`),
senão dois contratos com papéis trocados dão deadlock (40P01). Ao criar novo caso de uso que mexa
nessas tabelas, respeite essa ordem.

- `IncluirContrato`: trava imóvel → exige `livre` → trava pessoas → liga flags → insere → imóvel `alugado`.
- `RegistrarEventoContrato`: trava o contrato → decide sobre o estado travado → grava evento →
  (se encerra) contrato e imóvel.
- `DeletarImovel`/`AlterarImovel` travam o imóvel; `DeletarPessoa` trava a pessoa e checa vínculos.
  Incluir/alterar imóvel e contrato tocam a pessoa (flags) antes de gravar o vínculo, o que os
  serializa com a exclusão.

## Testes

Integração contra Postgres real (ver [arquitetura › testes](../arquitetura.md#testes)):
`imoveis/__test__/imoveis.test.ts`, `pessoas/__test__/pessoas.test.ts`,
`contratos/__test__/contratos.test.ts`, `__test__/painel.query.test.ts`,
`contas/__test__/contas.test.ts`, `contas/__test__/anexos.test.ts` (storage falso),
`contas/__test__/conta.entity.test.ts` (unitário),
`http/middleware/__test__/modulo.middleware.test.ts` (unitário, sem banco) e
`http/imoveis/__test__/contas.controller.test.ts` (o único teste HTTP: upload grande vira 400 e
paginação). Cada arquivo de integração usa um `companyUuid` fixo e apaga por ele no `afterAll`.
Os demais controllers não têm testes HTTP.

```bash
cd backend
npx jest src/@modules/imoveis src/http/middleware src/@modules/auth/generateTokenAuthenticationUser
npx tsc --noEmit --incremental false
```

## Pendências conhecidas

Ver seções "Imóveis (etapa 1)" e "Imóveis — contas" em [pendências](../../pendencias.md).
