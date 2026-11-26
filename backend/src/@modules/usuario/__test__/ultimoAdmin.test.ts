import { MSG_ULTIMO_ADMIN } from "../ultimoAdmin";
import { DeletarUsuarioUsecase } from "../deletarUsuario/deletarUsuario.usecase";
import { CriarUsuarioUsecase } from "../criarUsuario/criarUsuario.usecase";
import { EditarUsuarioUsecase } from "../editarUsuario/editarUsuario.usecase";

const EMPRESA = "empresa-1";
const USUARIO = "usuario-1";

function repoDeletar(ehAdmin: boolean, outros: number) {
  return {
    existe: jest.fn().mockResolvedValue(true),
    ehAdminAtivo: jest.fn().mockResolvedValue(ehAdmin),
    contarOutrosAdminsAtivos: jest.fn().mockResolvedValue(outros),
    deletar: jest.fn().mockResolvedValue(undefined),
  };
}

function repoEditar(ehAdmin: boolean, outros: number, vinculado = false) {
  return {
    existe: jest.fn().mockResolvedValue(true),
    ehAdminAtivo: jest.fn().mockResolvedValue(ehAdmin),
    contarOutrosAdminsAtivos: jest.fn().mockResolvedValue(outros),
    vinculadoAOutrasEmpresas: jest.fn().mockResolvedValue(vinculado),
    dadosDeAcesso: jest.fn().mockResolvedValue([{ email: null, cpf: null, phone: null }]),
    atualizar: jest.fn().mockResolvedValue(undefined),
  };
}

describe("DeletarUsuario - último admin", () => {
  it("bloqueia remover o último admin", async () => {
    const repo = repoDeletar(true, 0);
    const uc = new DeletarUsuarioUsecase(repo as any);
    await expect(uc.execute({ companyUuid: EMPRESA, usuarioUuid: USUARIO })).rejects.toMatchObject({
      message: MSG_ULTIMO_ADMIN,
      statusCode: 400,
    });
    expect(repo.deletar).not.toHaveBeenCalled();
  });

  it("remove admin quando há outro admin", async () => {
    const repo = repoDeletar(true, 1);
    await new DeletarUsuarioUsecase(repo as any).execute({ companyUuid: EMPRESA, usuarioUuid: USUARIO });
    expect(repo.deletar).toHaveBeenCalled();
  });

  it("remove usuário que não é admin", async () => {
    const repo = repoDeletar(false, 0);
    await new DeletarUsuarioUsecase(repo as any).execute({ companyUuid: EMPRESA, usuarioUuid: USUARIO });
    expect(repo.deletar).toHaveBeenCalled();
  });
});

describe("EditarUsuario - último admin", () => {
  it("bloqueia rebaixar o último admin", async () => {
    const repo = repoEditar(true, 0);
    const uc = new EditarUsuarioUsecase(repo as any);
    await expect(uc.execute({ companyUuid: EMPRESA, usuarioUuid: USUARIO, position: "usuario" })).rejects.toMatchObject({
      message: MSG_ULTIMO_ADMIN,
    });
    expect(repo.atualizar).not.toHaveBeenCalled();
  });

  it("bloqueia isAccepted false no último admin", async () => {
    const repo = repoEditar(true, 0);
    const uc = new EditarUsuarioUsecase(repo as any);
    await expect(uc.execute({ companyUuid: EMPRESA, usuarioUuid: USUARIO, isAccepted: false })).rejects.toMatchObject({
      message: MSG_ULTIMO_ADMIN,
    });
    expect(repo.atualizar).not.toHaveBeenCalled();
  });

  it.each([["false"], [0], [null]])("rejeita isAccepted não booleano (%p)", async (valor) => {
    const repo = repoEditar(true, 0);
    await expect(
      new EditarUsuarioUsecase(repo as any).execute({ companyUuid: EMPRESA, usuarioUuid: USUARIO, isAccepted: valor as any }),
    ).rejects.toMatchObject({ message: "Campo isAccepted inválido", statusCode: 400 });
    expect(repo.atualizar).not.toHaveBeenCalled();
  });

  it("position admin não consulta e atualiza", async () => {
    const repo = repoEditar(true, 0);
    await new EditarUsuarioUsecase(repo as any).execute({ companyUuid: EMPRESA, usuarioUuid: USUARIO, position: "admin" });
    expect(repo.ehAdminAtivo).not.toHaveBeenCalled();
    expect(repo.atualizar).toHaveBeenCalled();
  });

  it("só name atualiza sem consultar", async () => {
    const repo = repoEditar(true, 0);
    await new EditarUsuarioUsecase(repo as any).execute({ companyUuid: EMPRESA, usuarioUuid: USUARIO, name: "Fulano" });
    expect(repo.ehAdminAtivo).not.toHaveBeenCalled();
    expect(repo.atualizar).toHaveBeenCalled();
  });

  it("rebaixa admin quando há outro admin", async () => {
    const repo = repoEditar(true, 1);
    await new EditarUsuarioUsecase(repo as any).execute({ companyUuid: EMPRESA, usuarioUuid: USUARIO, position: "usuario" });
    expect(repo.atualizar).toHaveBeenCalled();
  });
});

describe("EditarUsuario - override de acesso compartilhado", () => {
  it("sem flag, senha de usuário vinculado a outra empresa dá 403", async () => {
    const repo = repoEditar(false, 0, true);
    await expect(
      new EditarUsuarioUsecase(repo as any).execute({ companyUuid: EMPRESA, usuarioUuid: USUARIO, password: "novaSenha123" }),
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(repo.atualizar).not.toHaveBeenCalled();
  });

  it("com flag, atualiza", async () => {
    const repo = repoEditar(false, 0, true);
    await new EditarUsuarioUsecase(repo as any).execute({
      companyUuid: EMPRESA,
      usuarioUuid: USUARIO,
      password: "novaSenha123",
      permitirAlterarAcessoCompartilhado: true,
    });
    expect(repo.atualizar).toHaveBeenCalled();
  });
});

describe("EditarUsuario - tipos e limpeza de campos", () => {
  const base = { companyUuid: EMPRESA, usuarioUuid: USUARIO };

  it("name numérico dá 400", async () => {
    const repo = repoEditar(false, 0);
    await expect(new EditarUsuarioUsecase(repo as any).execute({ ...base, name: 123 as any })).rejects.toMatchObject({
      message: "Campo name inválido",
      statusCode: 400,
    });
  });

  it("password numérico dá 400", async () => {
    const repo = repoEditar(false, 0);
    await expect(new EditarUsuarioUsecase(repo as any).execute({ ...base, password: 123456 as any })).rejects.toMatchObject({
      message: "Campo password inválido",
    });
  });

  it("password vazio não é enviado para atualizar", async () => {
    const repo = repoEditar(false, 0);
    await new EditarUsuarioUsecase(repo as any).execute({ ...base, name: "Fulano", password: "" });
    expect(repo.atualizar.mock.calls[0][2].password).toBeUndefined();
  });

  it("roles que não é array dá 400", async () => {
    const repo = repoEditar(false, 0);
    await expect(new EditarUsuarioUsecase(repo as any).execute({ ...base, roles: "admin" as any })).rejects.toMatchObject({
      message: "Campo roles inválido",
    });
  });

  it("limpar CPF e e-mail ao mesmo tempo dá 400", async () => {
    const repo = repoEditar(false, 0);
    repo.dadosDeAcesso.mockResolvedValue([{ email: "a@b.com", cpf: null, phone: null }]);
    await expect(new EditarUsuarioUsecase(repo as any).execute({ ...base, email: null as any })).rejects.toMatchObject({
      message: "Informe o CPF ou o e-mail do usuário",
      statusCode: 400,
    });
    expect(repo.atualizar).not.toHaveBeenCalled();
  });

  it("limpar o e-mail mantendo o CPF atual envia null", async () => {
    const repo = repoEditar(false, 0);
    repo.dadosDeAcesso.mockResolvedValue([{ email: "a@b.com", cpf: "52998224725", phone: null }]);
    await new EditarUsuarioUsecase(repo as any).execute({ ...base, email: null as any });
    expect(repo.atualizar.mock.calls[0][2].email).toBeNull();
  });
});

describe("CriarUsuario - tipos", () => {
  const repo = () => ({ existeNaEmpresa: jest.fn().mockResolvedValue(false), criar: jest.fn().mockResolvedValue({ uuid: "x" }) });

  it("name numérico dá 400", async () => {
    await expect(
      new CriarUsuarioUsecase(repo() as any).execute({ companyUuid: EMPRESA, name: 1 as any, email: "a@b.com" }),
    ).rejects.toMatchObject({ message: "Campo name inválido", statusCode: 400 });
  });

  it("password numérico dá 400", async () => {
    await expect(
      new CriarUsuarioUsecase(repo() as any).execute({ companyUuid: EMPRESA, name: "A", email: "a@b.com", password: 1 as any }),
    ).rejects.toMatchObject({ message: "Campo password inválido" });
  });

  it("roles inválido dá 400", async () => {
    await expect(
      new CriarUsuarioUsecase(repo() as any).execute({ companyUuid: EMPRESA, name: "A", email: "a@b.com", roles: [1] as any }),
    ).rejects.toMatchObject({ message: "Campo roles inválido" });
  });
});
