import { validarModulos } from "src/@modules/empresa/modulos/modulos";
import { DefinirModulosEmpresaUsecase } from "../definirModulosEmpresa.usecase";
import { DefinirModulosEmpresaRepository } from "../definirModulosEmpresaRepository";

const repoFake = (existe = true) => {
  const chamadas: string[] = [];
  const repo = {
    existeEmpresa: jest.fn(async () => existe),
    definir: jest.fn(async () => {
      chamadas.push("definir");
    }),
    limparCache: jest.fn(async () => {
      chamadas.push("limparCache");
    }),
  };
  return { repo: repo as unknown as DefinirModulosEmpresaRepository, mocks: repo, chamadas };
};

describe("validarModulos", () => {
  test("lista vazia ou não array", () => {
    expect(() => validarModulos([])).toThrow("Informe pelo menos um módulo");
    expect(() => validarModulos(undefined)).toThrow("Informe pelo menos um módulo");
  });
  test("módulo inválido", () => {
    expect(() => validarModulos(["igreja", "xpto"])).toThrow("Módulo inválido: xpto");
  });
  test("remove repetidos", () => {
    expect(validarModulos(["admin", "admin"])).toEqual(["admin"]);
  });
});

describe("DefinirModulosEmpresaUsecase", () => {
  test("empresa inexistente retorna 404", async () => {
    const { repo } = repoFake(false);
    const promise = new DefinirModulosEmpresaUsecase(repo).execute({ companyUuid: "c1", companyUuidLogada: "c2", modulos: ["igreja"] });
    await expect(promise).rejects.toThrow("Empresa não encontrada");
    await expect(promise).rejects.toMatchObject({ statusCode: 404 });
  });

  test("não remove admin da própria empresa", async () => {
    const { repo } = repoFake();
    await expect(new DefinirModulosEmpresaUsecase(repo).execute({ companyUuid: "c1", companyUuidLogada: "c1", modulos: ["igreja"] })).rejects.toThrow(
      "Não é possível remover o módulo Admin da própria empresa",
    );
  });

  test("outra empresa pode ficar sem admin", async () => {
    const { repo } = repoFake();
    await expect(
      new DefinirModulosEmpresaUsecase(repo).execute({ companyUuid: "c1", companyUuidLogada: "c2", modulos: ["igreja"] }),
    ).resolves.toEqual(["igreja"]);
  });

  test("define e depois limpa o cache", async () => {
    const { repo, mocks, chamadas } = repoFake();
    await new DefinirModulosEmpresaUsecase(repo).execute({ companyUuid: "c1", companyUuidLogada: "c1", modulos: ["admin", "imoveis"] });
    expect(mocks.definir).toHaveBeenCalledWith("c1", ["admin", "imoveis"]);
    expect(mocks.limparCache).toHaveBeenCalledWith("c1");
    expect(chamadas).toEqual(["definir", "limparCache"]);
  });
});
