import { ApiError } from "src/@modules/shared/apiError";
import { MSG_ULTIMO_ADMIN } from "../ultimoAdmin";
import { DeletarUsuarioUsecase } from "../deletarUsuario/deletarUsuario.usecase";
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
    await expect(uc.execute({ companyUuid: EMPRESA, usuarioUuid: USUARIO, isAccepted: false })).rejects.toBeInstanceOf(ApiError);
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
