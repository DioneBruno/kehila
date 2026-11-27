# Pendências, riscos e dívidas técnicas

Levantamento feito durante o estudo dos módulos (nov/2026). Cada item aponta o arquivo para
facilitar a correção. Prioridade: 🔴 segurança/dinheiro · 🟠 bug/consistência · 🟡 manutenção.

## 🔴 Segurança e dados entre empresas

| # | Onde | Problema |
|---|---|---|
| S1 | `backend/src/@modules/bi/biRepostiory.ts` → `biListar` | Não filtra `company_uuid`: lista BIs de **todas** as empresas. |
| S2 | `backend/src/@modules/notificacao/notificacaoGateway.ts` → `salvarGateway` | `ON CONFLICT (uuid) DO UPDATE` sem checar empresa: com o uuid de outra empresa, sobrescreve o gateway (e a senha SMTP) dela. |
| S3 | `backend/src/@modules/portalEventos/pedidos/criarPedido/criarPedidoRepository.ts` e `portalEventos.query.ts` → `buscarEvento` | Evento buscado só por uuid, sem `company_uuid`. |
| S4 | `backend/src/@modules/aprisco/*` | Sem checagem de liderança: qualquer usuário interno altera qualquer aprisco e registra presença. |
| S5 | `backend/src/@modules/usuario/detalharUsuario/detalharUsuarioRepository.ts` | Devolve ao admin os códigos de login ativos do usuário (`randomCode`) — permite entrar como ele. Confirmar se é intencional (suporte) e, se for, registrar auditoria. A rota do Admin (`/admin/empresas/:uuid/usuarios/:usuarioUuid`) não expõe `randomCode`. |
| S6 | `backend/src/@modules/portalEventos/cadastrarUsuario/` | Cadastro público devolve token sem confirmar posse de CPF/e-mail. |
| S7 | `backend/src/@modules/usuario/usuario.query.ts` → `editarPerfilUsuario` | Usuário troca o próprio CPF/e-mail sem validação nem checagem de duplicidade (pode colidir com outro login). |
| S8 | `backend/src/@modules/auth/generateTokenAutenticationUsernamePassword/tokenGenerateRepository.ts` | Login já exige vínculo ativo (`deleted_at IS NULL`), mas **o token emitido continua válido após remover o acesso** (vale até expirar; não há revogação). `is_accepted` também não é checado no login. |
| S9 | `notificacao_gateways.senha`, `financeiro_contas_bancarias.chave_api` | Segredos em texto puro no banco. |
| S10 | `backend/src/@modules/notificacao/email/enviarEmailGateway.smtp.ts` | `tls.rejectUnauthorized: false`. |
| S11 | `backend/src/main.ts` | CORS `origin: "*"`. |
| S12 | `backend/src/@modules/portalEventos/portalEventos.query.ts` → `listaPublicaInscritos` | Busca pública por documento permite descobrir se um CPF está inscrito (resultado mascarado, mas a existência vaza). |
| S13 | Empresa removida (`DELETE /empresa`) | `DominioMiddleware` e JWT não checam `auth_companies.deleted_at`; a empresa continua acessível. |

## 🔴 Dinheiro / estoque

| # | Onde | Problema |
|---|---|---|
| D1 | `portalEventos/pedidos/criarPedido` | Checagem de vagas e `INSERT` fora de transação/lock → venda acima do limite em compras simultâneas. |
| D2 | `portalEventos/pedidos/cancelarPedido` | Cancelar não libera os ingressos (continuam contando como vendidos). |
| D3 | `portalEventos/pedidos/gerarCobranca` | Não verifica se o pedido já está `pagamento_gerado` → cobranças duplicadas. |
| D4 | `financeiro/gerarCobranca/gerarCobranca.usecase.ts` | Cobra no Asaas e só depois grava no banco, sem transação/compensação → cobrança órfã se o `INSERT` falhar. |
| D5 | `financeiro/gerarCobranca/gerarCorbancaGateway.asaas.ts` | Boleto: `vencimento` do input ignorado (sempre amanhã). Cartão: só a 1ª parcela é cobrada; as demais ficam `pendente` sem rotina que as cobre. |
| D6 | `criarPedido` | Não valida status do evento nem `ativo`/datas do lote. |
| D7 | `http/financeiro/pagamento.service.ts` | Cron roda em todas as réplicas → e-mails e verificações duplicados com >1 instância. |
| D8 | `financeiro/*Gateway.asaas.ts` | `buscarToken` pega a primeira conta ativa; várias contas ativas = escolha arbitrária. |

## 🟠 Bugs e inconsistências

| # | Onde | Problema |
|---|---|---|
| B1 | Migrations | Banco novo falha em `MigrationCreatePagamentosMigration1779555472216` ("multiple primary keys for table financeiro_cobrancas"). |
| B2 | Migrations financeiro | Duas migrations com o mesmo timestamp `1781222400001`. |
| B3 | `backend/src/@infra/database/seeders/auth/*` | `seed:run` apaga **todos** os `auth_users`, `auth_users_companies` e `auth_company_domains`. |
| B4 | `auth_users.estado_civil varchar(10)` × `auth_pessoas.estado_civil` sem limite | Criar usuário a partir de membro quebra com valor longo; os vocabulários também diferem (`usuario` aceita `solteiro, casado…`, membresia aceita texto livre). |
| B5 | `usuario/criarUsuario` × `membresia/criarUsuario` | Um sempre cria `auth_users` novo; o outro reaproveita usuário global. Sem `UNIQUE` no banco → CPFs duplicados entre empresas. |
| B6 | `portalEventos/eventos/atualizarStatusEvento` | Status `em_vendas`/`esgotado` nunca são atingidos por nenhuma transição. |
| B7 | `portalEventos/pedidos/editarFormIngresso` | `throw new Error` em vez de `ApiError` → 500. |
| B8 | `portalEventos/lotes/criarLote/criarLote.usecase.ts` | Mensagens de erro trocadas ("Quantidade permitida"; preço negativo diz "data de início…"). |
| B9 | `financeiro/gerarBoletoPagamento` | Status HTTP 450 para "pagamento não encontrado". |
| B10 | `notificacao/sms/enviarSms.usecase.ts` | `gateway.enviar` sem `await`. |
| B11 | `bi/biIncluir.usecase.ts` | `roles` ignorado no create. |
| B12 | `frontend/src/boot/axios.ts` | Chama `/auth/refresh-token`, que não existe; mensagens de 401 herdadas de outro projeto. |
| B13 | `frontend/src/layouts/MainLayout.vue` | `isAdmin` calculado uma vez; trocar de usuário sem recarregar mantém o menu anterior. |
| B14 | `membresia/alterarMembro`, `deletarMembro` (repos) | `UPDATE` sem `deleted_at IS NULL` (o `existe` antes protege, mas o padrão difere do resto). |

## 🟡 Manutenção

- `makeProvider` duplicado em cada `*.module.ts` → extrair para `http/shared`.
- `buscarToken`/`buscarCliente` do Asaas copiados em 4 gateways → um `AsaasClient` em `financeiro/shared`.
- Templates de e-mail HTML inline nos repositórios (auth, financeiro).
- Adaptadores não usados em `@infra` (RabbitMQ, Socket.io, S3, `ConnectionHttpAxios` — este último ainda
  compartilha `config.headers` entre chamadas, o que vazaria headers se fosse usado).
- Formatos de resposta diferentes entre módulos (`{success,data,meta}` × `{data}` × `{token}` × `{message}`).
- Leituras via `POST` no portal de eventos e em `/bi`.
- `.env.example` sem `REDIS_URL`, `METABASE_SECRET_KEY` e `NOTIFICACAO_*`.
- `strictNullChecks: false` no backend.
- Frontend sem testes; backend quase só com testes de integração dependentes de banco.
- Arquivos de exemplo do Quasar não usados (`ExampleComponent.vue`, `EssentialLink.vue`, `example-store.ts`).
- `README.md` da raiz ainda lista funcionalidades como "planejadas" e "Tecnologias: a definir".

## Imóveis (etapa 1)

Lacunas conhecidas do módulo [imóveis](backend/modulos/imoveis.md) (não são falhas de segurança):

- `IncluirContrato`/`AlterarContrato`: com `garantiaTipo ≠ fiador`, o `fiadorUuid` enviado é descartado em silêncio (não avisa).
- Trocar `indiceReajuste` para `nenhum` mantém o `mes_reajuste` antigo (o painel ignora, mas o dado fica).
- Aditivo aceita evento sem mudança real (mesmo valor/mesmo fim que o atual).
- Encerramento/rescisão não valida a data do evento contra o `inicio` do contrato.
- Sem testes HTTP dos controllers de `http/imoveis` (só use cases, query e middleware).

## Imóveis — contas

Lacunas conhecidas das [contas do imóvel](backend/modulos/imoveis.md#contas-do-imóvel):

- Arquivo órfão no bucket: remover um anexo só faz soft delete do registro (o `StorageInterface` não tem
  delete), e se a gravação do registro falhar depois do upload o arquivo também fica no bucket.
- Sem exclusão em lote de parcelas: cada parcela é excluída (admin) uma a uma.
- Conta de contrato antigo usa o proprietário **atual** do imóvel (o contrato não guarda o dono); em
  imóvel vendido o ajuste é manual.
- O filtro `contratoUuid` da tela Contas (vindo de "Ver todas") não tem chip visível.
- `<input type="month">` da competência degrada para texto no Firefox desktop.
- A agenda não tem guarda contra resposta fora de ordem (filtros trocados rápido podem mostrar o
  resultado antigo).
- Sem testes HTTP além de `contas.controller.test.ts` (os demais controllers de `http/imoveis` seguem sem).

## Admin (empresas)

- Domínio: unicidade e "último domínio ativo" são validados na aplicação, sem índice único no banco
  (janela de corrida em requisições simultâneas).
- Não há exclusão de empresa pelo Admin.
- O build do frontend (`vue-tsc`) tem ~32 erros de tipo pré-existentes em páginas de BI, financeiro,
  portalEventos e usuario.
