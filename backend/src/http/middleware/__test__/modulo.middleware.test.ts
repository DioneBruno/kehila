// Os módulos importam SDKs ESM (Vonage) que o Jest não transforma; só precisamos do configure().
jest.mock("@vonage/server-sdk", () => ({ Vonage: class {} }));
jest.mock("@vonage/messages", () => ({}));

import { exigirModulo, ModuloIgrejaMiddleware, ModuloImoveisMiddleware } from "src/http/middleware/modulo.middleware";
import { ApriscoModule } from "src/http/aprisco/aprisco.module";
import { MembresiaModule } from "src/http/membresia/membresia.module";
import { BiModule } from "src/http/bi/bi.module";
import { FinanceiroModule } from "src/http/financeiro/financeiro.module";
import { PortalEventosModule } from "src/http/portalEventos/portalEventos.module";
import { NotificacaoModule } from "src/http/notificacao/notificacao.module";
import { UsuarioModule } from "src/http/usuario/usuario.module";
import { EmpresaModule } from "src/http/empresa/empresa.module";
import { AuthModule } from "src/http/auth/auth.module";
import { PublicModule } from "src/http/public/public.module";
import { ApriscoController } from "src/http/aprisco/aprisco.controller";
import { MembresiaController } from "src/http/membresia/membresia.controller";
import { BiController } from "src/http/bi/bi.controller";
import { ImoveisModule } from "src/http/imoveis/imoveis.module";
import { PessoasController } from "src/http/imoveis/pessoas.controller";
import { ImoveisController } from "src/http/imoveis/imoveis.controller";
import { ContratosController } from "src/http/imoveis/contratos.controller";
import { PainelController } from "src/http/imoveis/painel.controller";
import { JwtAuthMiddleware } from "src/http/middleware/jwtAuth.middleware";
import { InternoMiddleware } from "src/http/middleware/perfil.middleware";

const fakeCache = () => {
  const store: Record<string, any> = {};
  return {
    store,
    saveObject: jest.fn(async (k: string, o: any) => {
      store[k] = o;
    }),
    findKey: jest.fn(async (k: string) => store[k] ?? null),
    deleteKey: jest.fn(),
  };
};

describe("exigirModulo", () => {
  test("bloqueia empresa sem o módulo", async () => {
    const repo = { listarModulos: jest.fn().mockResolvedValue(["imoveis"]) };
    const promise = exigirModulo(repo, undefined, "c1", "igreja");
    await expect(promise).rejects.toThrow("Módulo não habilitado para esta empresa");
    await expect(promise).rejects.toMatchObject({ statusCode: 403 });
  });

  test("módulo admin: libera com admin e bloqueia sem", async () => {
    await expect(exigirModulo({ listarModulos: jest.fn().mockResolvedValue(["admin"]) }, undefined, "c1", "admin")).resolves.toBeUndefined();
    const promise = exigirModulo({ listarModulos: jest.fn().mockResolvedValue(["igreja"]) }, undefined, "c1", "admin");
    await expect(promise).rejects.toMatchObject({ statusCode: 403 });
  });

  test("libera empresa com o módulo", async () => {
    const repo = { listarModulos: jest.fn().mockResolvedValue(["igreja"]) };
    await expect(exigirModulo(repo, undefined, "c1", "igreja")).resolves.toBeUndefined();
  });

  test("usa o cache na segunda chamada", async () => {
    const repo = { listarModulos: jest.fn().mockResolvedValue(["igreja", "imoveis"]) };
    const cache = fakeCache();
    await exigirModulo(repo, cache, "c1", "igreja");
    await exigirModulo(repo, cache, "c1", "imoveis");
    expect(repo.listarModulos).toHaveBeenCalledTimes(1);
    expect(cache.saveObject).toHaveBeenCalledWith("modulos:c1", expect.anything(), 300);
  });

  test("funciona sem cache", async () => {
    const repo = { listarModulos: jest.fn().mockResolvedValue(["igreja"]) };
    await exigirModulo(repo, undefined, "c1", "igreja");
    await exigirModulo(repo, undefined, "c1", "igreja");
    expect(repo.listarModulos).toHaveBeenCalledTimes(2);
  });

  test("erro no cache consulta direto", async () => {
    const repo = { listarModulos: jest.fn().mockResolvedValue(["igreja"]) };
    const cache = {
      saveObject: jest.fn().mockRejectedValue(new Error("x")),
      findKey: jest.fn().mockRejectedValue(new Error("x")),
      deleteKey: jest.fn(),
    };
    await expect(exigirModulo(repo, cache, "c1", "igreja")).resolves.toBeUndefined();
  });

  test("companyUuid ausente retorna 403", async () => {
    const repo = { listarModulos: jest.fn() };
    await expect(exigirModulo(repo, undefined, "", "igreja")).rejects.toMatchObject({ statusCode: 403 });
    expect(repo.listarModulos).not.toHaveBeenCalled();
  });
});

describe("middlewares de módulo", () => {
  const hubCom = (modulos: string[]) =>
    ({ cache: undefined, database: { query: jest.fn().mockResolvedValue(modulos.map((modulo) => ({ modulo }))) } }) as any;

  test("bloqueia sem chamar next", async () => {
    const next = jest.fn();
    await expect(new ModuloIgrejaMiddleware(hubCom(["imoveis"])).use({ companyUuid: "c1" }, {}, next)).rejects.toMatchObject({ statusCode: 403 });
    expect(next).not.toHaveBeenCalled();
  });

  test("libera chamando next uma vez", async () => {
    const next = jest.fn();
    await new ModuloImoveisMiddleware(hubCom(["imoveis"])).use({ companyUuid: "c1" }, {}, next);
    expect(next).toHaveBeenCalledTimes(1);
  });
});

describe("matriz de rotas", () => {
  const configurar = (modulo: any) => {
    const aplicados: { middlewares: any[]; rotas: any[] }[] = [];
    const consumer: any = {
      apply: (...middlewares: any[]) => ({
        forRoutes: (...rotas: any[]) => {
          aplicados.push({ middlewares, rotas });
          return consumer;
        },
      }),
    };
    new modulo().configure(consumer);
    return aplicados;
  };
  const protegido = (modulo: any, controller: any) => {
    const entrada = configurar(modulo).find((a) => a.rotas.includes(controller));
    return !!entrada && entrada.middlewares.includes(ModuloIgrejaMiddleware);
  };

  const nomes = (modulo: any) => configurar(modulo).flatMap((a) => a.rotas.map((r) => (typeof r === "string" ? r : r.name)));

  test.each([
    ["ApriscoController", ApriscoModule, ApriscoController],
    ["MembresiaController", MembresiaModule, MembresiaController],
    ["BiController", BiModule, BiController],
  ])("%s exige módulo igreja, depois de JwtAuth", (_n, modulo, controller) => {
    expect(protegido(modulo, controller)).toBe(true);
  });

  test("financeiro e portalEventos: todas as rotas de igreja exigem o módulo", () => {
    for (const modulo of [FinanceiroModule, PortalEventosModule]) {
      const aplicados = configurar(modulo);
      expect(aplicados.length).toBeGreaterThan(0);
      for (const a of aplicados) expect(a.middlewares).toContain(ModuloIgrejaMiddleware);
    }
    expect(nomes(FinanceiroModule)).toEqual(
      expect.arrayContaining(["ContasBancariasController", "CobrancasController", "PagamentosController", "CartaoCreditoController"]),
    );
    expect(nomes(PortalEventosModule)).toEqual(
      expect.arrayContaining(["PublicoController", "PedidosController", "EventosController", "LotesController"]),
    );
  });

  test("módulo igreja vem depois de Dominio/JwtAuth", () => {
    for (const modulo of [FinanceiroModule, PortalEventosModule, ApriscoModule, MembresiaModule, BiModule]) {
      for (const a of configurar(modulo)) {
        const i = a.middlewares.indexOf(ModuloIgrejaMiddleware);
        expect(i).toBeGreaterThan(0);
        expect(a.middlewares[i - 1].name).toMatch(/Middleware$/);
      }
    }
  });

  test.each([
    ["NotificacaoModule", NotificacaoModule],
    ["UsuarioModule", UsuarioModule],
    ["EmpresaModule", EmpresaModule],
    ["AuthModule", AuthModule],
    ["PublicModule", PublicModule],
  ])("%s não exige módulo", (_n, modulo) => {
    for (const a of configurar(modulo)) expect(a.middlewares).not.toContain(ModuloIgrejaMiddleware);
  });

  test("ImoveisModule aplica JwtAuth, Interno e ModuloImoveis, nessa ordem, nos quatro controllers", () => {
    const aplicados = configurar(ImoveisModule);
    expect(aplicados).toHaveLength(1);
    expect(aplicados[0].middlewares).toEqual([JwtAuthMiddleware, InternoMiddleware, ModuloImoveisMiddleware]);
    expect(aplicados[0].rotas).toEqual([PessoasController, ImoveisController, ContratosController, PainelController]);
  });
});
