# Módulo Imóveis (backend)

> Gestão de imóveis para escritórios/imobiliárias (etapa 1): cadastro de pessoas
> (proprietários, inquilinos e fiadores), imóveis, contratos de locação com histórico de eventos
> (renovação, aditivo, encerramento, rescisão) e um painel de vencimentos e reajustes. Não há
> cobrança de aluguel nem repasse nesta etapa. Design completo em
> `docs/superpowers/specs/2026-11-24-gestao-imoveis-etapa1-design.md`.

- Código: `backend/src/@modules/imoveis/`
- HTTP: `backend/src/http/imoveis/` (`PessoasController`, `ImoveisController`, `ContratosController`, `PainelController`)
- Módulos por empresa: `backend/src/@modules/empresa/modulos/` e `backend/src/http/middleware/modulo.middleware.ts`
- Migrations: `backend/src/@infra/database/migrations/imoveis/` e `.../auth/1792000000000-create-auth_company_modulos`
- Frontend correspondente: [frontend › imóveis](../../frontend/modulos/imoveis.md)

## Módulos por empresa (habilitar o módulo)

Cada empresa tem uma lista de módulos em `auth_company_modulos` (`igreja`, `imoveis`). A migration
cria a tabela e dá `igreja` a todas as empresas existentes, então nada muda para as igrejas atuais.
Empresa nova **sem linhas** não acessa nenhum dos dois pacotes.

Habilitar o módulo para um escritório:

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
> Não há tela para ligar/desligar módulos (ver [pendências](../../pendencias.md)).

Bloqueio: `403 "Módulo não habilitado para esta empresa"`. Sem cache (Redis fora do ar) o
middleware consulta o banco a cada requisição; falha de cache nunca derruba a rota.

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
| `imovel_contrato_eventos` | `contrato_uuid` (cascade), `tipo` (`renovacao/aditivo/encerramento/rescisao`), `data`, `descricao`, `valor_anterior/novo`, `fim_anterior/novo`, `criado_por_uuid` (FK `auth_users`, `SET NULL`) |

Índice único parcial **`UQ_imovel_contratos_imovel_vigente`**: no máximo **um contrato vigente por
imóvel**. É a rede de segurança do lock (a violação vira `409 "Imóvel não está livre para locação"`).

## Regras de domínio

**Pessoa** (`pessoas/pessoa.entity.ts`)
- `tipo` (PF/PJ) define a validação do documento (CPF ou CNPJ) e **não pode ser alterado**;
  documento duplicado na empresa → `409 "Já existe uma pessoa com este documento"`.
- Os papéis são flags independentes (a mesma pessoa pode ser proprietária e inquilina). Criar
  contrato liga `eh_inquilino`/`eh_fiador` automaticamente; as flags nunca são desligadas sozinhas.

**Imóvel** (`imoveis/imovel.entity.ts`, `imoveis/situacaoImovel.ts`)
- `identificacao` obrigatória; proprietário precisa existir na empresa.
- A situação `alugado` **só é definida pelo contrato** (criar → `alugado`; encerrar/rescindir → `livre`).
  Via `PATCH` o usuário só alterna entre `livre`, `reforma`, `inativo`, e **não** muda a situação de
  imóvel com contrato vigente (409).
- Excluir (soft) imóvel com contrato vigente → 409.

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
| `GET /imoveis/pessoas` | `listarPessoas` | filtros `papel` (`proprietario`/`inquilino`/`fiador`), `busca` (nome, documento, e-mail) |
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

Controllers montam o input **campo a campo** (nunca `...body`); `company_uuid` vem do token.

## Painel (`GET /imoveis/painel`)

Só contratos `vigente`, em seis grupos:

| Chave | Critério (com `hoje`) |
|---|---|
| `vencidos` | `fim < hoje` |
| `vence0a30` / `vence31a60` / `vence61a90` | `fim` em `hoje..+30`, `+31..+60`, `+61..+90` dias |
| `reajustesMes` | índice ≠ `nenhum`, `mes_reajuste` = mês de `hoje` e `inicio` anterior ao mês atual |
| `imoveisLivres` | imóveis com `situacao = 'livre'` |

Ordenação: `fim`, identificação do imóvel, uuid.

> ⚠️ **Fuso horário.** `hoje` vem de `ApiDate.now("YYYY-MM-DD")`, que segue `process.env.TZ`. Em
> **produção `TZ` precisa estar definido** (o compose de dev usa `TZ=America/Cuiaba`); sem isso a
> data vira à meia-noite UTC e o painel adianta o dia no fim da tarde.

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
`http/middleware/__test__/modulo.middleware.test.ts` (unitário, sem banco). Cada arquivo usa um
`companyUuid` fixo e apaga por ele no `afterAll`. Não há testes HTTP dos controllers.

```bash
cd backend
npx jest src/@modules/imoveis src/http/middleware src/@modules/auth/generateTokenAuthenticationUser
npx tsc --noEmit --incremental false
```

## Pendências conhecidas

Ver seção "Imóveis (etapa 1)" em [pendências](../../pendencias.md).
