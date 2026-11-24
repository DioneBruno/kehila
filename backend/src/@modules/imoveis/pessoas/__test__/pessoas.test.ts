import dataSource from "src/@infra/database/datasource";
import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import { ImoveisQuery } from "../../imoveis.query";
import { IncluirPessoaUsecase } from "../incluirPessoa/incluirPessoa.usecase";
import { IncluirPessoaRepository } from "../incluirPessoa/incluirPessoaRepository";
import { AlterarPessoaUsecase } from "../alterarPessoa/alterarPessoa.usecase";
import { AlterarPessoaRepository } from "../alterarPessoa/alterarPessoaRepository";
import { DeletarPessoaUsecase } from "../deletarPessoa/deletarPessoa.usecase";
import { DeletarPessoaRepository } from "../deletarPessoa/deletarPessoaRepository";

const companyUuid = "b0a10000-0000-4000-8000-000000000a01";
const companyUuidB = "b0a10000-0000-4000-8000-000000000b01";
const CPF = "123.456.789-09";
const CNPJ = "11.222.333/0001-81";

let incluir: IncluirPessoaUsecase;
let alterar: AlterarPessoaUsecase;
let deletar: DeletarPessoaUsecase;
let query: ImoveisQuery;

const buscarLinha = async (uuid: string) => (await dataSource.query(`SELECT * FROM imovel_pessoas WHERE uuid = $1`, [uuid]))[0];

describe("Pessoas (PF/PJ) do módulo imóveis", () => {
  beforeAll(async () => {
    await dataSource.initialize();
    for (const [uuid, tenant] of [
      [companyUuid, "test-pessoas-a"],
      [companyUuidB, "test-pessoas-b"],
    ]) {
      await dataSource.query(
        `INSERT INTO auth_companies (uuid, tenant_id, name, cpf_cnpj) VALUES ($1, $2, 'Empresa Teste Pessoas', '00000000000000') ON CONFLICT DO NOTHING`,
        [uuid, tenant],
      );
    }
    const connections = new ConnectionHub({ database: dataSource });
    incluir = new IncluirPessoaUsecase(new IncluirPessoaRepository(connections));
    alterar = new AlterarPessoaUsecase(new AlterarPessoaRepository(connections));
    deletar = new DeletarPessoaUsecase(new DeletarPessoaRepository(connections));
    query = new ImoveisQuery(connections);
  });

  afterAll(async () => {
    await dataSource.query(`DELETE FROM imovel_pessoas WHERE company_uuid IN ($1, $2)`, [companyUuid, companyUuidB]);
    await dataSource.query(`DELETE FROM auth_companies WHERE uuid IN ($1, $2)`, [companyUuid, companyUuidB]);
    await dataSource.destroy();
  });

  afterEach(async () => {
    await dataSource.query(`DELETE FROM imovel_pessoas WHERE company_uuid IN ($1, $2)`, [companyUuid, companyUuidB]);
  });

  test("Deve incluir PF normalizando o documento para dígitos", async () => {
    const { uuid } = await incluir.execute({
      companyUuid,
      tipo: "PF",
      documento: CPF,
      nome: "  Maria Souza ",
      ehProprietario: true,
      endereco: { uf: "sp" },
    });
    const linha = await buscarLinha(uuid);
    expect(linha.documento).toBe("12345678909");
    expect(linha.nome).toBe("Maria Souza");
    expect(linha.eh_proprietario).toBe(true);
    expect(linha.eh_inquilino).toBe(false);
    expect(linha.eh_fiador).toBe(false);
    expect(linha.endereco_uf).toBe("SP");
  });

  test("Deve incluir PJ com CNPJ válido", async () => {
    const { uuid } = await incluir.execute({ companyUuid, tipo: "PJ", documento: CNPJ, nome: "Acme Ltda", nomeFantasia: "Acme", ehInquilino: true });
    const linha = await buscarLinha(uuid);
    expect(linha.documento).toBe("11222333000181");
    expect(linha.nome_fantasia).toBe("Acme");
    expect(linha.eh_inquilino).toBe(true);
  });

  test("Não deve incluir com CPF ou CNPJ inválido", async () => {
    await expect(incluir.execute({ companyUuid, tipo: "PF", documento: "123.456.789-00", nome: "X" })).rejects.toThrow("CPF inválido");
    await expect(incluir.execute({ companyUuid, tipo: "PJ", documento: "11.222.333/0001-82", nome: "X" })).rejects.toThrow("CNPJ inválido");
  });

  test("Não deve incluir sem nome nem com e-mail inválido", async () => {
    await expect(incluir.execute({ companyUuid, tipo: "PF", documento: CPF, nome: " " })).rejects.toThrow("O nome é obrigatório");
    await expect(incluir.execute({ companyUuid, tipo: "PF", documento: CPF, nome: "X", email: "xx" })).rejects.toThrow("E-mail inválido");
  });

  test("Documento repetido na mesma empresa dá 409; em outra empresa é permitido", async () => {
    await incluir.execute({ companyUuid, tipo: "PF", documento: CPF, nome: "A" });
    await expect(incluir.execute({ companyUuid, tipo: "PF", documento: "12345678909", nome: "B" })).rejects.toMatchObject({
      message: "Já existe uma pessoa com este documento",
      statusCode: 409,
    });
    await expect(incluir.execute({ companyUuid: companyUuidB, tipo: "PF", documento: CPF, nome: "B" })).resolves.toHaveProperty("uuid");
  });

  test("Inserções concorrentes do mesmo documento dão 409, nunca erro bruto", async () => {
    const resultados = await Promise.allSettled([1, 2, 3].map((n) => incluir.execute({ companyUuid, tipo: "PF", documento: CPF, nome: `C${n}` })));
    expect(resultados.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    for (const r of resultados.filter((r) => r.status === "rejected") as PromiseRejectedResult[]) expect(r.reason.statusCode).toBe(409);
  });

  test("Documento de pessoa excluída pode ser reutilizado", async () => {
    const { uuid } = await incluir.execute({ companyUuid, tipo: "PF", documento: CPF, nome: "A" });
    await deletar.execute({ companyUuid, uuid });
    await expect(incluir.execute({ companyUuid, tipo: "PF", documento: CPF, nome: "A2" })).resolves.toHaveProperty("uuid");
  });

  test("Alterar só o telefone mantém o resto; email null limpa", async () => {
    const { uuid } = await incluir.execute({ companyUuid, tipo: "PF", documento: CPF, nome: "Maria", email: "maria@exemplo.com", ehFiador: true });
    await alterar.execute({ companyUuid, uuid, telefone: "11999990000" });
    let linha = await buscarLinha(uuid);
    expect(linha.telefone).toBe("11999990000");
    expect(linha.email).toBe("maria@exemplo.com");
    expect(linha.nome).toBe("Maria");
    expect(linha.eh_fiador).toBe(true);
    await alterar.execute({ companyUuid, uuid, email: null });
    linha = await buscarLinha(uuid);
    expect(linha.email).toBeNull();
  });

  test("Alterar documento valida pelo tipo e respeita a unicidade", async () => {
    const { uuid } = await incluir.execute({ companyUuid, tipo: "PF", documento: CPF, nome: "A" });
    await incluir.execute({ companyUuid, tipo: "PJ", documento: CNPJ, nome: "B" });
    await expect(alterar.execute({ companyUuid, uuid, documento: "111" })).rejects.toThrow("CPF inválido");
    await expect(alterar.execute({ companyUuid, uuid, documento: CNPJ })).rejects.toThrow("CPF inválido");
    const { uuid: outro } = await incluir.execute({ companyUuid, tipo: "PF", documento: "52998224725", nome: "C" });
    await expect(alterar.execute({ companyUuid, uuid: outro, documento: CPF })).rejects.toMatchObject({ statusCode: 409 });
  });

  test("Alterar pessoa de outra empresa dá Pessoa não encontrada", async () => {
    const { uuid } = await incluir.execute({ companyUuid, tipo: "PF", documento: CPF, nome: "A" });
    await expect(alterar.execute({ companyUuid: companyUuidB, uuid, telefone: "1" })).rejects.toMatchObject({
      message: "Pessoa não encontrada",
      statusCode: 404,
    });
    await expect(deletar.execute({ companyUuid: companyUuidB, uuid })).rejects.toThrow("Pessoa não encontrada");
  });

  test("Deletar faz soft delete", async () => {
    const { uuid } = await incluir.execute({ companyUuid, tipo: "PF", documento: CPF, nome: "A" });
    await deletar.execute({ companyUuid, uuid });
    expect((await buscarLinha(uuid)).deleted_at).not.toBeNull();
    expect(await query.buscarPessoa(companyUuid, uuid)).toBeNull();
  });

  test("listarPessoas filtra por papel, nome (ILIKE) e documento (dígitos), isolado por empresa", async () => {
    await incluir.execute({ companyUuid, tipo: "PF", documento: CPF, nome: "Maria Souza", ehProprietario: true });
    await incluir.execute({ companyUuid, tipo: "PJ", documento: CNPJ, nome: "Acme Ltda", ehInquilino: true });
    await incluir.execute({ companyUuid: companyUuidB, tipo: "PF", documento: "52998224725", nome: "Maria Outra", ehProprietario: true });

    const donos = await query.listarPessoas(companyUuid, { papel: "proprietario", pagina: 1, porPagina: 20 });
    expect(donos.total).toBe(1);
    expect(donos.data[0]).toMatchObject({ nome: "Maria Souza", ehProprietario: true, documento: "12345678909" });

    expect((await query.listarPessoas(companyUuid, { papel: "inquilino", pagina: 1, porPagina: 20 })).total).toBe(1);
    expect((await query.listarPessoas(companyUuid, { papel: "fiador", pagina: 1, porPagina: 20 })).total).toBe(0);
    expect((await query.listarPessoas(companyUuid, { busca: "acme", pagina: 1, porPagina: 20 })).data.map((p) => p.nome)).toEqual(["Acme Ltda"]);
    expect((await query.listarPessoas(companyUuid, { busca: "123.456.789", pagina: 1, porPagina: 20 })).data.map((p) => p.nome)).toEqual([
      "Maria Souza",
    ]);
    expect((await query.listarPessoas(companyUuid, { pagina: 1, porPagina: 1 })).data).toHaveLength(1);
    expect((await query.listarPessoas(companyUuid, { pagina: 1, porPagina: 1 })).total).toBe(2);
  });
});
