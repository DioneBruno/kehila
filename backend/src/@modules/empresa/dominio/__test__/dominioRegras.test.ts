import { MSG_DOMINIO_EM_USO, MSG_DOMINIO_FORMATO, MSG_ULTIMO_DOMINIO, normalizarDominio } from "../dominioRegras";
import { CriarDominioUsecase } from "../criarDominio/criarDominio.usecase";
import { EditarDominioUsecase } from "../editarDominio/editarDominio.usecase";
import { DeletarDominioUsecase } from "../deletarDominio/deletarDominio.usecase";

const EMPRESA = "empresa-uuid";
const DOMINIO = "dominio-uuid";

function fakeRegras(over: Record<string, any> = {}) {
  return {
    dominioEmUso: jest.fn().mockResolvedValue(false),
    estaAtivo: jest.fn().mockResolvedValue(true),
    contarOutrosAtivos: jest.fn().mockResolvedValue(1),
    buscarDominio: jest.fn().mockResolvedValue("https://atual.com"),
    ...over,
  } as any;
}

describe("normalizarDominio", () => {
  it("normaliza caixa, espaços e barra final", () => {
    expect(normalizarDominio("  HTTPS://Admin.Localhost:9000/ ")).toBe("https://admin.localhost:9000");
  });

  it.each(["admin.localhost", "https://x.com/path", "ftp://x.com"])("rejeita formato inválido: %s", (v) => {
    expect(() => normalizarDominio(v)).toThrow(MSG_DOMINIO_FORMATO);
  });

  it.each(["  ", "", null, undefined])("exige o domínio: %p", (v) => {
    expect(() => normalizarDominio(v as any)).toThrow("O domínio é obrigatório");
  });
});

describe("normalizarDominio - tipos e portas padrão", () => {
  it.each([123, ["https://a.com"], {}])("rejeita domínio não-string com 400: %p", (v) => {
    expect(() => normalizarDominio(v as any)).toThrow("Campo domain inválido");
  });

  it("remove portas padrão", () => {
    expect(normalizarDominio("https://x.com:443")).toBe("https://x.com");
    expect(normalizarDominio("http://x.com:80/")).toBe("http://x.com");
  });

  it("mantém portas não padrão", () => {
    expect(normalizarDominio("https://x.com:80")).toBe("https://x.com:80");
    expect(normalizarDominio("http://x.com:443")).toBe("http://x.com:443");
    expect(normalizarDominio("https://x.com:4430")).toBe("https://x.com:4430");
  });
});

describe("active deve ser booleano", () => {
  it.each(["false", "true", 0, 1, null])("EditarDominio rejeita active=%p sem tocar no banco", async (active) => {
    const repo = { existe: jest.fn().mockResolvedValue(true), atualizar: jest.fn() } as any;
    await expect(new EditarDominioUsecase(repo, fakeRegras()).execute({ companyUuid: EMPRESA, dominioUuid: DOMINIO, active: active as any })).rejects.toMatchObject({
      message: "Campo active inválido",
      statusCode: 400,
    });
    expect(repo.atualizar).not.toHaveBeenCalled();
  });

  it.each(["false", 0, null])("CriarDominio rejeita active=%p", async (active) => {
    const repo = { criar: jest.fn() } as any;
    await expect(new CriarDominioUsecase(repo, fakeRegras()).execute({ companyUuid: EMPRESA, domain: "https://a.com", active: active as any })).rejects.toThrow(
      "Campo active inválido",
    );
    expect(repo.criar).not.toHaveBeenCalled();
  });
});

describe("CriarDominioUsecase", () => {
  it("rejeita domínio em uso com 409", async () => {
    const repo = { criar: jest.fn() } as any;
    const regras = fakeRegras({ dominioEmUso: jest.fn().mockResolvedValue(true) });
    await expect(new CriarDominioUsecase(repo, regras).execute({ companyUuid: EMPRESA, domain: "https://a.com" })).rejects.toMatchObject({
      message: MSG_DOMINIO_EM_USO,
      statusCode: 409,
    });
    expect(regras.dominioEmUso).toHaveBeenCalledWith("https://a.com", undefined);
    expect(repo.criar).not.toHaveBeenCalled();
  });

  it("grava o domínio normalizado quando livre", async () => {
    const repo = { criar: jest.fn().mockResolvedValue({}) } as any;
    const regras = fakeRegras();
    await new CriarDominioUsecase(repo, regras).execute({ companyUuid: EMPRESA, domain: " HTTPS://App.X.com/ " });
    expect(regras.dominioEmUso).toHaveBeenCalledWith("https://app.x.com", undefined);
    expect(repo.criar).toHaveBeenCalledWith(expect.objectContaining({ domain: "https://app.x.com" }));
  });
});

describe("EditarDominioUsecase", () => {
  const repoFake = () => ({ existe: jest.fn().mockResolvedValue(true), atualizar: jest.fn() }) as any;

  it("verifica unicidade do novo domínio ignorando o próprio uuid", async () => {
    const repo = repoFake();
    const regras = fakeRegras();
    await new EditarDominioUsecase(repo, regras).execute({
      companyUuid: EMPRESA,
      dominioUuid: DOMINIO,
      domain: "HTTPS://Novo.com/",
    });
    expect(regras.dominioEmUso).toHaveBeenCalledTimes(1);
    expect(regras.dominioEmUso).toHaveBeenCalledWith("https://novo.com", DOMINIO);
    expect(repo.atualizar).toHaveBeenCalledWith(EMPRESA, DOMINIO, expect.objectContaining({ domain: "https://novo.com" }));
  });

  it("verifica unicidade uma única vez quando vêm domain e active", async () => {
    const regras = fakeRegras();
    await new EditarDominioUsecase(repoFake(), regras).execute({
      companyUuid: EMPRESA,
      dominioUuid: DOMINIO,
      domain: "https://novo.com",
      active: true,
    });
    expect(regras.dominioEmUso).toHaveBeenCalledTimes(1);
  });

  it("reativar sem domain checa o domínio atual e dá 409 se em uso", async () => {
    const repo = repoFake();
    const regras = fakeRegras({ dominioEmUso: jest.fn().mockResolvedValue(true) });
    await expect(new EditarDominioUsecase(repo, regras).execute({ companyUuid: EMPRESA, dominioUuid: DOMINIO, active: true })).rejects.toMatchObject({
      message: MSG_DOMINIO_EM_USO,
      statusCode: 409,
    });
    expect(regras.buscarDominio).toHaveBeenCalledWith(EMPRESA, DOMINIO);
    expect(regras.dominioEmUso).toHaveBeenCalledWith("https://atual.com", DOMINIO);
    expect(repo.atualizar).not.toHaveBeenCalled();
  });

  it("bloqueia desativar o único ativo", async () => {
    const repo = repoFake();
    const regras = fakeRegras({ contarOutrosAtivos: jest.fn().mockResolvedValue(0) });
    await expect(new EditarDominioUsecase(repo, regras).execute({ companyUuid: EMPRESA, dominioUuid: DOMINIO, active: false })).rejects.toThrow(
      MSG_ULTIMO_DOMINIO,
    );
    expect(repo.atualizar).not.toHaveBeenCalled();
  });

  it("permite desativar quando há outro ativo", async () => {
    const repo = repoFake();
    await new EditarDominioUsecase(repo, fakeRegras()).execute({ companyUuid: EMPRESA, dominioUuid: DOMINIO, active: false });
    expect(repo.atualizar).toHaveBeenCalled();
  });
});

describe("DeletarDominioUsecase", () => {
  const repoFake = () => ({ existe: jest.fn().mockResolvedValue(true), deletar: jest.fn() }) as any;

  it("bloqueia deletar o único ativo", async () => {
    const repo = repoFake();
    const regras = fakeRegras({ contarOutrosAtivos: jest.fn().mockResolvedValue(0) });
    await expect(new DeletarDominioUsecase(repo, regras).execute({ companyUuid: EMPRESA, dominioUuid: DOMINIO })).rejects.toThrow(MSG_ULTIMO_DOMINIO);
    expect(repo.deletar).not.toHaveBeenCalled();
  });

  it("deleta domínio inativo", async () => {
    const repo = repoFake();
    const regras = fakeRegras({ estaAtivo: jest.fn().mockResolvedValue(false), contarOutrosAtivos: jest.fn().mockResolvedValue(0) });
    await new DeletarDominioUsecase(repo, regras).execute({ companyUuid: EMPRESA, dominioUuid: DOMINIO });
    expect(repo.deletar).toHaveBeenCalledWith(EMPRESA, DOMINIO);
  });
});
