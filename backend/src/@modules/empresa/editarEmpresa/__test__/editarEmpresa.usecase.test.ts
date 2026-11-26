import { EditarEmpresaUsecase } from "../editarEmpresa.usecase";

const montar = () => {
  const repo = { existe: jest.fn(async () => true), atualizar: jest.fn(async () => undefined) };
  return { repo, usecase: new EditarEmpresaUsecase(repo as any) };
};

describe("EditarEmpresaUsecase - tipos", () => {
  it.each([
    ["name", 123],
    ["cpfCnpj", ["1"]],
    ["email", 5],
    ["uf", {}],
  ])("rejeita %s não-string com 400", async (campo, valor) => {
    const { usecase, repo } = montar();
    await expect(usecase.execute({ companyUuid: "c", [campo]: valor } as any)).rejects.toMatchObject({
      message: `Campo ${campo} inválido`,
      statusCode: 400,
    });
    expect(repo.atualizar).not.toHaveBeenCalled();
  });

  it("apara nome e mantém null para limpar campos opcionais", async () => {
    const { usecase, repo } = montar();
    await usecase.execute({ companyUuid: "c", name: " X ", phone: null as any });
    expect(repo.atualizar).toHaveBeenCalledWith("c", expect.objectContaining({ name: "X", phone: null }));
  });
});
