# Gestão de Imóveis — Etapa 1 (base: módulos por empresa, cadastros e contratos) — design

Data: 2026-11-24 · Tamanho: projeto (design completo)

## Intenção

Um **escritório de contabilidade** quer oferecer aos seus clientes — proprietários de imóveis,
pessoa física ou jurídica — a gestão dos imóveis que eles alugam. O pedido nasceu de um
proprietário, que pediu ao contador; o contador quer vender o sistema a outros clientes.

Quem opera o sistema é a **equipe do escritório**. O dinheiro dos aluguéis é **do proprietário**
(o escritório não recebe nem repassa). É um **público novo**, sem relação com igrejas: não usa
Membresia, Aprisco, Eventos nem o Financeiro/Asaas existentes.

O módulo completo foi pedido com nove itens. Ele foi fatiado em quatro etapas; **este documento
cobre só a etapa 1**:

1. **Base** (este doc): módulos habilitados por empresa; cadastro de pessoas (PF/PJ), imóveis,
   contratos; aditivos/renovações; painel de vencimentos.
2. Aluguel: aplicar reajuste anual, gerar cobrança mensal, baixa manual e por planilha do
   banco (CSV/Excel), inadimplência, multa, juros e descontos.
3. Encargos e despesas: IPTU, taxas, tributos; manutenção, conservação e serviços.
4. Fiscal e documentos: guias/obrigações (municipais, estaduais, federais) com prazos; arquivo
   de documentos cadastrais, fiscais e patrimoniais.

## Objetivos, não-objetivos, anti-objetivos

- **Objetivo:** uma empresa do Kehila do tipo "escritório" vê **apenas** o módulo Imóveis; as
  igrejas atuais continuam vendo exatamente o que veem hoje.
- **Objetivo:** cadastrar proprietários e inquilinos (PF/PJ), imóveis e contratos, com histórico
  de aditivos/renovações, e ver o que vence em 30/60/90 dias e os reajustes do mês.
- **Não-objetivo (etapa 1):** cobrança, boleto, forma de pagamento, cálculo/aplicação de
  reajuste, encargos, despesas, guias, upload de documentos, acesso do proprietário ao sistema,
  tela para ligar/desligar módulos, e-mail de aviso de vencimento.
- **Anti-objetivo:** um escritório (ou um usuário dele) enxergar dados de outro escritório; a
  igreja passar a ver telas de imóveis (ou o escritório, telas de igreja); menu escondido sem
  bloqueio real no backend.

## Decisões do usuário

- Público: escritório de contabilidade opera; vários proprietários por escritório.
- **Abordagem A:** módulo novo dentro do Kehila (mesmo backend NestJS e frontend Quasar), com
  **módulos habilitados por empresa**.
- O dinheiro é do proprietário; **sem Asaas**. Sem integração bancária no início; baixa será
  manual ou por CSV/Excel exportado do banco (etapa 2).
- Boleto e forma de pagamento ficam para depois; primeiro só a cobrança (etapa 2).
- **Um imóvel tem um único proprietário** (sem frações/coproprietários).

## Abordagens consideradas

| | Abordagem | Troca | |
|---|---|---|---|
| **A** | Módulo novo no Kehila + lista de módulos por empresa (menu, rotas e backend) | Reaproveita login, dispositivo confiável, usuários e multiempresa; exige criar o controle de módulos | **Escolhida** |
| B | Segundo frontend no mesmo repositório, mesmo backend | Marca própria e separação limpa; dois frontends e dois deploys | — |
| C | Sistema separado (cópia) | Liberdade total; duplica autenticação e cada correção de segurança | — |

## Design

### 1. Módulos por empresa

**Tabela** `auth_company_modulos` (migration em `migrations/auth/`):

```
auth_company_modulos (
  created_at, updated_at, deleted_at,
  uuid PK,
  company_uuid -> auth_companies(uuid) ON DELETE CASCADE,
  modulo varchar(40) NOT NULL,          -- chave do módulo
  UNIQUE (company_uuid, modulo) WHERE deleted_at IS NULL
)
```

Chaves: `igreja` (agrupa Membros, Apriscos, Eventos/portal de eventos, Pedidos, Financeiro e
BI) e `imoveis`. **Fora de qualquer módulo (base, sempre disponíveis):** login/auth, `/ping`,
Minha Empresa, Usuários e **Notificações** — o gateway SMTP é usado pelo login por código, então
o escritório precisa configurá-lo. *(Decisão minha: uma chave "igreja" em vez de uma por módulo antigo — o escritório
nunca quer meio pacote de igreja, e isso evita mexer em todas as rotas antigas agora.)*

- A migration insere `igreja` para **todas as empresas existentes** — nada muda para elas.
- Empresa nova sem nenhuma linha: não vê nada além de Minha Empresa/Usuários (decisão minha;
  ativar é passo explícito).
- Ligar `imoveis` para o escritório: por SQL/seed, documentado no doc do módulo. Tela fica
  para depois.

**Backend**
- `ModuloMiddleware` (`http/middleware/modulo.middleware.ts`): fábrica
  `exigirModulo("imoveis")`; lê `req.companyUuid`, consulta `auth_company_modulos` (cache Redis
  curto, 5 min, chave por empresa) e responde `403 "Módulo não habilitado para esta empresa"`.
- Aplicado em **todas** as rotas `/imoveis/*`. As rotas de igreja recebem
  `exigirModulo("igreja")` (mesma PR), **inclusive as públicas/externas** (portal público de
  eventos, `/pedidos`, `/cartao-credito`, financeiro) — o `companyUuid` vem do domínio ou do JWT,
  tanto faz para o middleware — garante o anti-objetivo de o escritório não acessar
  `/membros`, `/apriscos` etc. pela API.
- `GET /auth/me` (ou `/ping` logado — o builder escolhe o que já devolve dados da empresa)
  passa a devolver `modulos: string[]`.

**Frontend**
- Store `auth` guarda `modulos`. `MENU_ITEMS` ganha `modulo?: "igreja" | "imoveis"`.
- Itens de `igreja` e da base: **regra de hoje mantida** (admin vê tudo; não-admin vê só Início).
  A igreja continua vendo exatamente o que vê hoje.
- Seção IMÓVEIS: visível a **qualquer usuário interno** da empresa com `imoveis`.
- Empresa com os dois módulos é suportada: os dois menus aparecem e a home é a atual (apriscos).
- Empresa só com `imoveis`: a home (`/`) mostra o Painel de imóveis.

### 2. Perfis e acesso

- Rotas `/imoveis/*`: `JwtAuthMiddleware` + `InternoMiddleware` + `exigirModulo("imoveis")`.
  Qualquer usuário interno do escritório opera o módulo; excluir registros exige admin
  (`exigirAdmin`). *(Decisão minha: a equipe toda trabalha nos cadastros; exclusão é rara.)*
- Regra de ouro mantida: `company_uuid` sempre do `req`, todo SQL filtra por ele e por
  `deleted_at IS NULL`.

### 3. Modelo de dados (prefixo `imovel_`, migrations em `migrations/imoveis/`)

Todas com `created_at`, `updated_at`, `deleted_at`, `uuid` PK, `company_uuid`.

```
imovel_pessoas                      -- cadastro único PF/PJ (proprietário, inquilino, fiador)
  tipo            'PF' | 'PJ'
  eh_proprietario boolean default false  -- marcado ao cadastrar pela tela Proprietários e ao virar dono de um imóvel
  eh_inquilino    boolean default false  -- marcado ao cadastrar pela tela Inquilinos e ao entrar num contrato
  eh_fiador       boolean default false
  documento       CPF ou CNPJ, só dígitos, UNIQUE (company_uuid, documento) WHERE deleted_at IS NULL
  nome            nome / razão social
  nome_fantasia   NULL (PJ)
  rg_ie           NULL (RG para PF, inscrição estadual para PJ)
  email, telefone NULL
  endereco_*      cep, logradouro, numero, complemento, bairro, cidade, uf
  observacoes     text NULL

imovel_imoveis
  proprietario_uuid  -> imovel_pessoas  NOT NULL
  identificacao      varchar  -- ex.: "Ap 302 – Ed. Sol"
  tipo               'casa' | 'apartamento' | 'sala_comercial' | 'loja' | 'galpao' | 'terreno' | 'outro'
  finalidade         'residencial' | 'comercial'
  endereco_*         (igual a pessoas)
  inscricao_iptu     varchar NULL
  matricula          varchar NULL
  cartorio           varchar NULL
  area_m2            decimal NULL
  situacao           'livre' | 'alugado' | 'reforma' | 'inativo'
  observacoes        text NULL

imovel_contratos
  imovel_uuid        -> imovel_imoveis NOT NULL
  inquilino_uuid     -> imovel_pessoas NOT NULL
  numero             varchar NULL     -- número/identificação do contrato do escritório
  inicio             date NOT NULL
  fim                date NOT NULL    -- vigente (atualizado por renovação/aditivo)
  valor_aluguel      decimal(12,2) NOT NULL  -- vigente
  dia_vencimento     smallint 1..31
  indice_reajuste    'IGPM' | 'IPCA' | 'INPC' | 'IGPDI' | 'nenhum'
  mes_reajuste       smallint 1..12 NULL (padrão: mês do início)
  multa_atraso_pct   decimal(5,2)    -- padrão 2,00
  juros_mes_pct      decimal(5,2)    -- padrão 1,00
  desconto_pontualidade_pct decimal(5,2) NULL
  multa_rescisoria_meses decimal(4,1) NULL  -- ex.: 3 aluguéis
  garantia_tipo      'fiador' | 'caucao' | 'seguro_fianca' | 'titulo_capitalizacao' | 'nenhuma'
  garantia_valor     decimal(12,2) NULL  -- caução/seguro
  fiador_uuid        -> imovel_pessoas NULL
  status             'vigente' | 'encerrado' | 'rescindido'
  encerrado_em       date NULL
  observacoes        text NULL

imovel_contrato_eventos             -- histórico: aditivos e renovações
  contrato_uuid      -> imovel_contratos NOT NULL
  tipo               'renovacao' | 'aditivo' | 'encerramento' | 'rescisao'
  data               date NOT NULL   -- data de assinatura/efeito
  descricao          text NOT NULL
  valor_anterior / valor_novo   decimal NULL
  fim_anterior   / fim_novo     date NULL
  criado_por_uuid    -> auth_users
```

**Regras**
- Papel da pessoa: flags `eh_*` (acima). A tela Proprietários lista `eh_proprietario`, a de
  Inquilinos `eh_inquilino`; o formulário mostra as flags como checkboxes e a tela pré-marca a
  sua. Vincular a pessoa a um imóvel/contrato liga a flag correspondente (nunca desliga). Assim
  quem acabou de ser cadastrado não some da lista.
- Contrato só pode ser criado em imóvel `livre`. Encerrar/rescindir volta o imóvel para `livre`
  (se alguém quiser `reforma`, muda depois).
- **Contrato com `fim` vencido sem renovação continua `vigente`** — pela Lei do Inquilinato, o
  inquilino que permanece segue por prazo indeterminado. Nada muda de status sozinho (sem job).
  O painel mostra esses contratos como **"Vencidos / prazo indeterminado"** para o escritório
  decidir: renovar, aditivo ou encerrar.
- CPF/CNPJ validados por dígito verificador (`ApiValidate` se já tiver; senão helper novo em
  `@modules/shared`).
- Um imóvel tem no máximo **um contrato `vigente`** por vez (checado no use case, com
  `SELECT ... FOR UPDATE` dentro da transação).
- Criar contrato `vigente` → imóvel `alugado`; encerrar/rescindir → imóvel `livre`. Mesma
  transação.
- Inquilino ≠ proprietário do imóvel; fiador ≠ inquilino.
- `fim > inicio`. Valores ≥ 0.
- **Renovação/aditivo**: o use case `registrarEventoContrato` grava a linha em
  `imovel_contrato_eventos` com os valores anteriores e atualiza `fim`/`valor_aluguel` do
  contrato na mesma transação. Contrato nunca é editado "por fora" nesses dois campos depois
  de criado (a edição comum não aceita `fim` nem `valor_aluguel`).
- Não permite excluir pessoa com imóvel ou contrato ativo, nem imóvel com contrato vigente.

### 4. API (`http/imoveis/`, `@modules/imoveis/`)

Padrão `success/data/meta`, paginação `pagina`/`porPagina`, update parcial com mapa de colunas.

| Rota | Uso |
|---|---|
| `GET/POST /imoveis/pessoas`, `GET/PATCH/DELETE /imoveis/pessoas/:uuid` | busca por nome/documento, filtro `papel=proprietario|inquilino` (derivado de vínculos) |
| `GET/POST /imoveis/imoveis`, `GET/PATCH/DELETE /imoveis/imoveis/:uuid` | filtro por proprietário, situação, busca |
| `GET/POST /imoveis/contratos`, `GET/PATCH /imoveis/contratos/:uuid` | filtro por proprietário, imóvel, inquilino, status |
| `POST /imoveis/contratos/:uuid/eventos` | renovação, aditivo, encerramento, rescisão |
| `GET /imoveis/contratos/:uuid/eventos` | histórico |
| `GET /imoveis/painel` | contagens e listas: **vencidos** (`fim < hoje`, vigente), vencem em **faixas separadas** 0–30, 31–60 e 61–90 dias, reajustes do mês corrente (`mes_reajuste = mês atual` e `indice_reajuste <> 'nenhum'`), imóveis livres |

### 5. Telas (frontend, `pages/imoveis/`, rotas `imoveis.*`)

Menu (seção **IMÓVEIS**): Painel · Proprietários · Imóveis · Contratos · Inquilinos.
(Proprietários e Inquilinos são a mesma tela de pessoas, com filtro de papel; o cadastro de
pessoa é um só.)

```
Painel
┌─────────────────────────────────────────────────────────┐
│ Vencidos (1) │ 0–30d (2) │ 31–60d (5) │ 61–90d (1) │ Reajustes no mês (3) │ Livres (4) │
├─────────────────────────────────────────────────────────┤
│ Imóvel            Proprietário   Inquilino   Valor     Fim       │
│ Ap 302 – Centro   João P.        Maria S.    2.100,00  15/01/27 ⚠│
└─────────────────────────────────────────────────────────┘

Contrato (detalhe)
  Dados vigentes (imóvel, inquilino, valor, fim, reajuste, multa/juros, garantia)
  [Renovar] [Aditivo] [Encerrar] [Rescindir]
  Histórico: 15/01/26 Renovação — fim 15/01/26 → 15/01/27, valor 2.000 → 2.100
```

Seguem a receita de CRUD do frontend (`*.http.ts`, boot, service, `*Listar/Incluir/Editar/Form`).
Formulário de pessoa alterna campos PF/PJ; CEP pode preencher endereço (ViaCEP) — **fica a
critério do builder**, não é obrigatório.

### 6. Testes

- Backend: integração por use case (padrão do projeto, `companyUuid` próprio, limpeza no
  `afterAll`). Cobrir: isolamento por empresa, um contrato vigente por imóvel, transição de
  situação do imóvel, renovação/aditivo grava histórico e atualiza contrato, bloqueios de
  exclusão, validação CPF/CNPJ.
- Unitário (sem banco) para `ModuloMiddleware`: empresa sem módulo → 403; com módulo → passa.
  Matriz: escritório (só `imoveis`) recebe 403 em `/membros`, `/apriscos`, `/eventos`, portal
  público e financeiro; igreja recebe 403 em `/imoveis/*`; ambos acessam login, `/ping`,
  Usuários, Minha Empresa e Notificações.
- Ver memória do projeto: testes precisam de banco; migrations em banco vazio estão quebradas
  (B1) — rodar sobre um banco de dev já migrado.

### 7. Documentação

Novo `docs/backend/modulos/imoveis.md` e `docs/frontend/modulos/imoveis.md`; linha na tabela
de módulos de `docs/README.md`; tabela de middlewares em `docs/backend/arquitetura.md`
atualizada com `exigirModulo`. Como ligar o módulo para um escritório (SQL) fica no doc do
módulo.

## Deixado para o builder

- Onde devolver `modulos` (`/auth/me` vs. `/ping`), desde que o frontend tenha a lista após o
  login e após o login automático por dispositivo confiável.
- Nomes exatos de arquivos/use cases, seguindo a convenção em português.
- ViaCEP no formulário (opcional).
- Ordem das PRs (sugestão: módulos por empresa → pessoas → imóveis → contratos/eventos → painel).
