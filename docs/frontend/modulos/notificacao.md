# Notificação (frontend)

- HTTP: `src/@modules/notificacao/notificacao.http.ts`
- Tela: `pages/notificacao/home.vue` + `notificacao.service.ts` (rota `notificacao`, admin)
- Boot: `boot/notificacao.boot.ts`
- Backend: [notificacao](../../backend/modulos/notificacao.md)

A tela configura o gateway de **e-mail (SMTP)** da empresa — host, porta, segurança, usuário e
senha (`meta` + `usuario`/`senha`) — via `salvar-gateway`, e lista os gateways existentes
(sem senha). Sem gateway ativo, o backend usa o SMTP das variáveis de ambiente.

`enviarSms`/`enviarEmail` existem no cliente para testes de envio.
