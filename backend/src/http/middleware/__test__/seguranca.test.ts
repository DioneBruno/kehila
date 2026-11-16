// Testes de regressão de segurança (não dependem de banco de dados).
process.env.AUTH_JWT_SECRET = "segredo-de-teste";
import { sign } from "jsonwebtoken";
import { JwtAuthMiddleware } from "src/http/middleware/jwtAuth.middleware";
import { AdminMiddleware, InternoMiddleware } from "src/http/middleware/perfil.middleware";
import { ApiJwt } from "src/@modules/shared/apiJwt";
import { EventoEntity } from "src/@modules/portalEventos/pedidos/criarPedido/evento.entity";
import { TipoIngressoEntity } from "src/@modules/portalEventos/pedidos/criarPedido/tipoIngresso.entity";
import { GerarTokenAuthenticationUsecase } from "src/@modules/auth/generateTokenAuthenticationRandomCode/gerarTokenAuthentication.usecase";
import { EnviarCodigoValidadorUsecase } from "src/@modules/auth/generateTokenAuthenticationRandomCode/enviarCodigoValidador.usecase";
import { EditarUsuarioUsecase } from "src/@modules/usuario/editarUsuario/editarUsuario.usecase";
import { GerarCobrancaUsecase } from "src/@modules/portalEventos/pedidos/gerarCobranca/gerarCobranca.usecase";

const token = (user: any) => ApiJwt.tokenSigning({ user, company: { uuid: "c1" } });
const req = (auth?: string) => ({ headers: auth ? { authorization: auth } : {} }) as any;

describe("JwtAuthMiddleware", () => {
  const mw = new JwtAuthMiddleware();
  test("rejeita token inválido (antes passava)", () => {
    const next = jest.fn();
    expect(() => mw.use(req("Bearer qualquercoisa"), {}, next)).toThrow("inválido");
    expect(next).not.toHaveBeenCalled();
  });
  test("rejeita token assinado com o antigo segredo fixo", () => {
    const forjado = sign({ user: { uuid: "u", position: "admin" }, company: { uuid: "c1" } }, "404991d8-3ee3-49ee-96dd-b12122026af4");
    expect(() => mw.use(req(`Bearer ${forjado}`), {}, jest.fn())).toThrow();
  });
  test("aceita token válido e popula req", () => {
    const r = req(`Bearer ${token({ uuid: "u1", position: "admin", roles: [] })}`);
    const next = jest.fn();
    mw.use(r, {}, next);
    expect(next).toHaveBeenCalled();
    expect(r.userUuid).toBe("u1");
    expect(r.companyUuid).toBe("c1");
    expect(r.userPosition).toBe("admin");
  });
});

describe("Perfis", () => {
  const externo = { userPosition: null, userRoles: ["usuario-externo"] };
  const lider = { userPosition: null, userRoles: [] };
  const usuario = { userPosition: "usuario", userRoles: ["usuario-externo"] };
  const admin = { userPosition: "admin", userRoles: [] };
  test("AdminMiddleware só libera admin", () => {
    const mw = new AdminMiddleware();
    for (const r of [externo, lider, usuario]) expect(() => mw.use(r, {}, jest.fn())).toThrow();
    const next = jest.fn();
    mw.use(admin, {}, next);
    expect(next).toHaveBeenCalled();
  });
  test("InternoMiddleware bloqueia só o externo", () => {
    const mw = new InternoMiddleware();
    expect(() => mw.use(externo, {}, jest.fn())).toThrow();
    for (const r of [lider, usuario, admin]) {
      const next = jest.fn();
      mw.use(r, {}, next);
      expect(next).toHaveBeenCalled();
    }
  });
});

describe("montaPedido", () => {
  const evento = () =>
    new EventoEntity({
      companyUuid: "c1",
      uuid: "e1",
      tiposIngresso: [
        new TipoIngressoEntity({ uuid: "t1", nome: "Inteira", quantidade: 10, vendidos: 8, preco: 50, loteUuid: "l1", gerarQuantidadeIngressos: 1 }),
      ],
    });
  test("rejeita tipo de ingresso inexistente (antes gerava ingresso grátis)", () => {
    expect(() => evento().montaPedido("u1", [{ tipoIngressoUuid: "nao-existe", quantidade: 3 }])).toThrow("Tipo de ingresso não encontrado");
  });
  test("rejeita quantidade negativa, zero ou fracionada", () => {
    for (const q of [-1, 0, 1.5, "abc" as any]) {
      expect(() => evento().montaPedido("u1", [{ tipoIngressoUuid: "t1", quantidade: q }])).toThrow("Quantidade de ingressos inválida");
    }
  });
  test("não deixa burlar vagas repetindo o tipo em várias linhas", () => {
    expect(() =>
      evento().montaPedido("u1", [
        { tipoIngressoUuid: "t1", quantidade: 2 },
        { tipoIngressoUuid: "t1", quantidade: 1 },
      ]),
    ).toThrow("Não tem vaga");
  });
  test("pedido válido continua funcionando", () => {
    const pedido = evento().montaPedido("u1", [{ tipoIngressoUuid: "t1", quantidade: 2 }]);
    expect((pedido as any).props.valorBruto).toBe(100);
    expect((pedido as any).props.ingressos.length).toBe(2);
  });
});

describe("Login por código", () => {
  function repoFake() {
    const cache = new Map<string, any>();
    return {
      cache,
      buscarUsuarioPorUsername: jest.fn(async () => ({ uuid: "u1", email: "fulano@x.com", phone: "65999998888" })),
      salvarCodigoNoCache: jest.fn(
        async (c: string, u: string, code: string, userUuid: string) => void cache.set(`${c}:${u}`, { code, userUuid, tentativas: 0 }),
      ),
      buscarCodigoNoCache: jest.fn(async (c: string, u: string) => cache.get(`${c}:${u}`) ?? null),
      registrarTentativaInvalida: jest.fn(async (c: string, u: string, cached: any) => {
        const t = (cached.tentativas ?? 0) + 1;
        if (t >= 5) cache.delete(`${c}:${u}`);
        else cache.set(`${c}:${u}`, { ...cached, tentativas: t });
      }),
      removerCodigoDoCache: jest.fn(async (c: string, u: string) => void cache.delete(`${c}:${u}`)),
      gerarTokenAuthentication: jest.fn(async () => ({ token: "tk" })),
      enviarEmail: jest.fn(async () => undefined),
      enviarSms: jest.fn(async () => undefined),
    } as any;
  }
  test("não devolve o código na resposta, mas envia por e-mail", async () => {
    const repo = repoFake();
    const out: any = await new EnviarCodigoValidadorUsecase(repo).execute({ companyUuid: "c1", username: "fulano" });
    expect(out.code).toBeUndefined();
    const enviado = repo.enviarEmail.mock.calls[0][2];
    expect(enviado).toMatch(/^\d{6}$/);
    expect(repo.cache.get("c1:fulano").code).toBe(enviado);
  });
  test("código é de uso único e limitado a 5 tentativas", async () => {
    const repo = repoFake();
    const uc = new GerarTokenAuthenticationUsecase(repo);
    await repo.salvarCodigoNoCache("c1", "fulano", "123456", "u1");
    expect(await uc.execute({ companyUuid: "c1", username: "fulano", code: "123456" })).toEqual({ token: "tk" });
    await expect(uc.execute({ companyUuid: "c1", username: "fulano", code: "123456" })).rejects.toThrow("expirado");

    await repo.salvarCodigoNoCache("c1", "fulano", "123456", "u1");
    for (let i = 0; i < 5; i++) await expect(uc.execute({ companyUuid: "c1", username: "fulano", code: "000000" })).rejects.toThrow();
    await expect(uc.execute({ companyUuid: "c1", username: "fulano", code: "123456" })).rejects.toThrow("expirado");
  });
});

describe("Editar usuário compartilhado entre igrejas", () => {
  const repo = (outras: boolean) =>
    ({
      existe: jest.fn(async () => true),
      vinculadoAOutrasEmpresas: jest.fn(async () => outras),
      dadosDeAcesso: jest.fn(async () => [{ email: "a@x.com", cpf: null, phone: "659" }]),
      atualizar: jest.fn(async () => undefined),
    }) as any;
  test("bloqueia troca de senha se o usuário é de outra igreja também", async () => {
    const r = repo(true);
    await expect(new EditarUsuarioUsecase(r).execute({ companyUuid: "c1", usuarioUuid: "u1", password: "nova" } as any)).rejects.toThrow(
      "outra igreja",
    );
    expect(r.atualizar).not.toHaveBeenCalled();
  });
  test("permite salvar o formulário sem mudar dados de acesso", async () => {
    const r = repo(true);
    await new EditarUsuarioUsecase(r).execute({
      companyUuid: "c1",
      usuarioUuid: "u1",
      name: "Novo",
      email: "a@x.com",
      phone: "659",
      password: "",
    } as any);
    expect(r.atualizar).toHaveBeenCalled();
  });
  test("usuário só desta igreja continua editável normalmente", async () => {
    const r = repo(false);
    await new EditarUsuarioUsecase(r).execute({ companyUuid: "c1", usuarioUuid: "u1", password: "nova", email: "b@x.com" } as any);
    expect(r.atualizar).toHaveBeenCalled();
  });
});

describe("Gerar cobrança de pedido", () => {
  test("bloqueia cobrança de pedido de outro usuário", async () => {
    const repo = { buscarPedido: jest.fn(async () => ({ userUuid: () => "dono", dataLimitePagamento: () => null })) } as any;
    await expect(
      new GerarCobrancaUsecase(repo).execute({ companyUuid: "c1", userUuid: "atacante", pedidoUuid: "p1", tipoPagador: "usuarioLogado" }),
    ).rejects.toThrow("Pedido não encontrado");
  });
});
