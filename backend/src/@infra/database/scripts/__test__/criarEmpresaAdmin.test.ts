import { executarCriarEmpresaAdmin, lerArgumentos } from "../criarEmpresaAdmin";

describe("lerArgumentos", () => {
  it("aplica os padrões", () => {
    expect(lerArgumentos(["--dominio", "http://admin.localhost:9000", "--email", "a@b.com"])).toEqual({
      dominio: "http://admin.localhost:9000",
      email: "a@b.com",
      nome: "Administrador",
      empresa: "empresa-admin",
      cnpj: "00000000000000",
    });
  });

  it("aceita --flag=valor e sobrescreve padrões", () => {
    const args = lerArgumentos(["--dominio=http://x.com", "--email=a@b.com", "--nome=Fulano", "--empresa=Matriz", "--cnpj=11111111111111"]);
    expect(args).toEqual({ dominio: "http://x.com", email: "a@b.com", nome: "Fulano", empresa: "Matriz", cnpj: "11111111111111" });
  });

  it("falta --email: lança com o uso", () => {
    expect(() => lerArgumentos(["--dominio", "http://x.com"])).toThrow(/Uso:/);
  });

  it("falta --dominio: lança com o uso", () => {
    expect(() => lerArgumentos(["--email", "a@b.com"])).toThrow(/Uso:/);
  });
});

describe("executarCriarEmpresaAdmin", () => {
  const args = { dominio: "http://admin.localhost:9000", email: "a@b.com", nome: "Administrador", empresa: "empresa-admin", cnpj: "00000000000000" };
  const montar = (existe: boolean) => {
    const usecase = { execute: jest.fn().mockResolvedValue({ uuid: "u", adminUuid: "a" }) };
    const repo = { existeEmpresaComModulo: jest.fn().mockResolvedValue(existe) };
    const log = jest.fn();
    return { usecase, repo, log, deps: { usecase, repo, senha: "senha-segura-1", log } as any };
  };

  it("já existe: não grava", async () => {
    const m = montar(true);
    expect(await executarCriarEmpresaAdmin(m.deps, args)).toBe("ja-existe");
    expect(m.usecase.execute).not.toHaveBeenCalled();
    expect(m.log).toHaveBeenCalledWith("Já existe uma empresa com o módulo admin; nada foi gravado.");
  });

  it("não existe: cadastra com módulo admin", async () => {
    const m = montar(false);
    expect(await executarCriarEmpresaAdmin(m.deps, args)).toBe("criada");
    expect(m.repo.existeEmpresaComModulo).toHaveBeenCalledWith("admin");
    expect(m.usecase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        dominio: args.dominio,
        modulos: ["admin"],
        empresa: expect.objectContaining({ name: "empresa-admin", cpfCnpj: "00000000000000" }),
        admin: expect.objectContaining({ name: "Administrador", email: "a@b.com", password: "senha-segura-1" }),
      }),
    );
    expect(m.log).toHaveBeenCalledWith(`Empresa admin criada. Acesse ${args.dominio}`);
  });
});
