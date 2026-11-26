import { CadastrarEmpresaInput, CadastrarEmpresaUsecase } from "../cadastrarEmpresa.usecase";
import { CadastrarEmpresaRepository } from "../cadastrarEmpresaRepository";
import { DominioRegrasRepository, MSG_DOMINIO_FORMATO } from "src/@modules/empresa/dominio/dominioRegras";

const montar = (emUso = false) => {
  const repo = { cadastrar: jest.fn(async () => undefined), existeEmpresaComModulo: jest.fn(async () => false) };
  const regras = { dominioEmUso: jest.fn(async () => emUso) };
  const usecase = new CadastrarEmpresaUsecase(repo as unknown as CadastrarEmpresaRepository, regras as unknown as DominioRegrasRepository);
  return { usecase, repo, regras };
};

const valido = (): CadastrarEmpresaInput => ({
  empresa: { name: " Empresa X ", cpfCnpj: "00000000000191", phone: "" },
  dominio: "HTTPS://App.Exemplo.com.br/",
  modulos: ["igreja", "igreja", "admin"],
  admin: { name: "Fulano", email: "fulano@exemplo.com", password: "12345678" },
});

describe("CadastrarEmpresaUsecase", () => {
  const casos: [string, (i: CadastrarEmpresaInput) => void, string][] = [
    ["sem nome da empresa", (i) => (i.empresa!.name = " "), "O nome da empresa é obrigatório"],
    ["sem cpfCnpj", (i) => delete i.empresa!.cpfCnpj, "O CPF/CNPJ é obrigatório"],
    ["domínio inválido", (i) => (i.dominio = "x.com"), MSG_DOMINIO_FORMATO],
    ["módulos vazios", (i) => (i.modulos = []), "Informe pelo menos um módulo"],
    ["sem nome do admin", (i) => delete i.admin!.name, "O nome do usuário é obrigatório"],
    ["sem cpf e e-mail", (i) => delete i.admin!.email, "Informe o CPF ou o e-mail do usuário"],
    ["e-mail inválido", (i) => (i.admin!.email = "abc"), "E-mail inválido"],
    ["cpf inválido", (i) => (i.admin!.cpf = "11111111111"), "CPF inválido"],
    ["sem senha", (i) => delete i.admin!.password, "A senha deve ter pelo menos 8 caracteres"],
    ["senha curta", (i) => (i.admin!.password = "1234567"), "A senha deve ter pelo menos 8 caracteres"],
  ];

  test.each(casos)("rejeita %s", async (_nome, alterar, mensagem) => {
    const { usecase, repo } = montar();
    const input = valido();
    alterar(input);
    await expect(usecase.execute(input)).rejects.toThrow(mensagem);
    expect(repo.cadastrar).not.toHaveBeenCalled();
  });

  test("domínio em uso devolve 409", async () => {
    const { usecase } = montar(true);
    await expect(usecase.execute(valido())).rejects.toMatchObject({ statusCode: 409 });
  });

  test("sucesso normaliza dados e gera hash", async () => {
    const { usecase, repo } = montar();
    const res = await usecase.execute(valido());
    const data = (repo.cadastrar.mock.calls[0] as any[])[0];
    expect(res).toEqual({ uuid: data.uuid, adminUuid: data.adminUuid });
    expect(data.dominio).toBe("https://app.exemplo.com.br");
    expect(data.modulos).toEqual(["igreja", "admin"]);
    expect(data.empresa.name).toBe("Empresa X");
    expect(data.empresa.phone).toBeNull();
    expect(data.admin.passwordHash).not.toBe("12345678");
    expect(data.admin.passwordHash.length).toBeGreaterThan(20);
  });
});
