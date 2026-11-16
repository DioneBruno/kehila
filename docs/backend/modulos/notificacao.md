# Módulo Notificação (backend)

> Envio de e-mail (SMTP) e SMS (Vonage), e cadastro dos gateways de envio de cada empresa.
> Também é usado internamente por Auth (código de login) e Financeiro (aviso de vencimento).

- Código: `backend/src/@modules/notificacao/`
- HTTP: `backend/src/http/notificacao/` (`NotificacaoController`, base `/notificacoes`)
- Tabela: `notificacao_gateways` (`uuid`, `company_uuid`, `type`, `name`, `usuario`, `senha`,
  `meta`, `status`, soft delete)
- Frontend: [frontend › notificacao](../../frontend/modulos/notificacao.md)

## Acesso

`JwtAuthMiddleware` + `AdminMiddleware`.

## Endpoints

| Método | Rota | O que faz |
|---|---|---|
| POST | `/notificacoes/salvar-gateway` | Upsert do gateway (`ON CONFLICT (uuid)`) |
| GET | `/notificacoes/listar-gateways` | Lista sem a `senha` |
| POST | `/notificacoes/enviar-sms` | `{ gateway, destinatario, mensagem }` |
| POST | `/notificacoes/enviar-email` | `{ gateway, destinatario, titulo, mensagem (HTML) }` |

## E-mail

`EnviarEmailUsecase` → `EnviarEmailRepository.buscarGatewaty` procura em
`notificacao_gateways` um registro `type = 'email'`, `status = 'ativo'` da empresa:

- encontrado → SMTP com `meta.host`, `meta.port`, `meta.secure`, `usuario`, `senha`;
- não encontrado → SMTP com as variáveis `NOTIFICACAO_SMTP_HOST|PORT|SECURE|USER|PASS`.

O parâmetro `gateway` do input é ignorado na escolha (sempre SMTP). `nomeAmigavel` vira o
nome do remetente.

Uso interno (instanciando direto, sem DI):

```ts
const usecase = new EnviarEmailUsecase(new EnviarEmailRepository(connectionHub));
await usecase.execute({ companyUuid, destinatario, titulo, mensagem: html });
```

## SMS

`EnviarSmsUsecase` → sempre Vonage (`NOTIFICACAO_VONAGE_APIKEY`, `NOTIFICACAO_VONAGE_APISECRET`).
O número recebe prefixo `55` se não tiver. Hoje o envio por SMS está desligado no login
(chamada comentada).

## Atenção

- `salvarGateway` faz `ON CONFLICT (uuid) DO UPDATE` sem checar `company_uuid`: com o uuid de
  outra empresa, sobrescreve o gateway dela. Também não atualiza `type`/`name` no update.
- `senha` é gravada em texto puro.
- SMTP com `tls.rejectUnauthorized: false`.
- `EnviarSmsUsecase` não faz `await` em `gateway.enviar` (erros se perdem).
- Templates de e-mail são HTML inline dentro de cada repositório (auth, financeiro).
