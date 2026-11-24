import dataSource from "src/@infra/database/datasource";
import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import { ImoveisQuery } from "../../imoveis.query";
import { IncluirPessoaUsecase } from "../../pessoas/incluirPessoa/incluirPessoa.usecase";
import { IncluirPessoaRepository } from "../../pessoas/incluirPessoa/incluirPessoaRepository";
import { DeletarPessoaUsecase } from "../../pessoas/deletarPessoa/deletarPessoa.usecase";
import { DeletarPessoaRepository } from "../../pessoas/deletarPessoa/deletarPessoaRepository";
import { IncluirImovelUsecase } from "../incluirImovel/incluirImovel.usecase";
import { IncluirImovelRepository } from "../incluirImovel/incluirImovelRepository";
import { AlterarImovelUsecase } from "../alterarImovel/alterarImovel.usecase";
import { AlterarImovelRepository } from "../alterarImovel/alterarImovelRepository";
import { DeletarImovelUsecase } from "../deletarImovel/deletarImovel.usecase";
import { DeletarImovelRepository } from "../deletarImovel/deletarImovelRepository";
import { IncluirContratoUsecase } from "../../contratos/incluirContrato/incluirContrato.usecase";
import { IncluirContratoRepository } from "../../contratos/incluirContrato/incluirContratoRepository";

const companyUuid = "b0a20000-0000-4000-8000-000000000a01";
const companyUuidB = "b0a20000-0000-4000-8000-000000000b01";
const CPF_1 = "123.456.789-09";
const CPF_2 = "529.982.247-25";
const CPF_B = "111.444.777-35";

let incluirPessoa: IncluirPessoaUsecase;
let deletarPessoa: DeletarPessoaUsecase;
let incluir: IncluirImovelUsecase;
let alterar: AlterarImovelUsecase;
let deletar: DeletarImovelUsecase;
let query: ImoveisQuery;
let incluirContrato: IncluirContratoUsecase;

let donoA: string;
let donoB: string;
let donoDeOutraEmpresa: string;

const buscarLinha = async (uuid: string) => (await dataSource.query(`SELECT * FROM imovel_imoveis WHERE uuid = $1`, [uuid]))[0];
const flagProprietario = async (uuid: string) =>
  (await dataSource.query(`SELECT eh_proprietario FROM imovel_pessoas WHERE uuid = $1`, [uuid]))[0].eh_proprietario;
const base = (extra: object = {}) => ({
  companyUuid,
  proprietarioUuid: donoA,
  identificacao: "Ap 302 - Ed. Sol",
  tipo: "apartamento" as const,
  finalidade: "residencial" as const,
  ...extra,
});

describe("Imóveis do módulo imóveis", () => {
  beforeAll(async () => {
    await dataSource.initialize();
    for (const [uuid, tenant] of [
      [companyUuid, "test-imoveis-a"],
      [companyUuidB, "test-imoveis-b"],
    ]) {
      await dataSource.query(
        `INSERT INTO auth_companies (uuid, tenant_id, name, cpf_cnpj) VALUES ($1, $2, 'Empresa Teste Imoveis', '00000000000000') ON CONFLICT DO NOTHING`,
        [uuid, tenant],
      );
    }
    const connections = new ConnectionHub({ database: dataSource });
    incluirPessoa = new IncluirPessoaUsecase(new IncluirPessoaRepository(connections));
    deletarPessoa = new DeletarPessoaUsecase(new DeletarPessoaRepository(connections));
    incluir = new IncluirImovelUsecase(new IncluirImovelRepository(connections));
    alterar = new AlterarImovelUsecase(new AlterarImovelRepository(connections));
    deletar = new DeletarImovelUsecase(new DeletarImovelRepository(connections));
    query = new ImoveisQuery(connections);
    incluirContrato = new IncluirContratoUsecase(new IncluirContratoRepository(connections));
  });

  afterAll(async () => {
    await limpar();
    await dataSource.query(`DELETE FROM auth_companies WHERE uuid IN ($1, $2)`, [companyUuid, companyUuidB]);
    await dataSource.destroy();
  });

  const limpar = async () => {
    await dataSource.query(`DELETE FROM imovel_contrato_eventos WHERE company_uuid IN ($1, $2)`, [companyUuid, companyUuidB]);
    await dataSource.query(`DELETE FROM imovel_contratos WHERE company_uuid IN ($1, $2)`, [companyUuid, companyUuidB]);
    await dataSource.query(`DELETE FROM imovel_imoveis WHERE company_uuid IN ($1, $2)`, [companyUuid, companyUuidB]);
    await dataSource.query(`DELETE FROM imovel_pessoas WHERE company_uuid IN ($1, $2)`, [companyUuid, companyUuidB]);
  };

  beforeEach(async () => {
    donoA = (await incluirPessoa.execute({ companyUuid, tipo: "PF", documento: CPF_1, nome: "Maria Dona" })).uuid;
    donoB = (await incluirPessoa.execute({ companyUuid, tipo: "PF", documento: CPF_2, nome: "João Dono" })).uuid;
    donoDeOutraEmpresa = (await incluirPessoa.execute({ companyUuid: companyUuidB, tipo: "PF", documento: CPF_B, nome: "Estranho" })).uuid;
  });

  afterEach(limpar);

  test("Deve incluir imóvel livre e ligar eh_proprietario do dono", async () => {
    expect(await flagProprietario(donoA)).toBe(false);
    const { uuid } = await incluir.execute(base({ areaM2: 72.5, endereco: { uf: "sp" }, matricula: " 123 " }));
    const linha = await buscarLinha(uuid);
    expect(linha.situacao).toBe("livre");
    expect(linha.endereco_uf).toBe("SP");
    expect(linha.matricula).toBe("123");
    expect(await flagProprietario(donoA)).toBe(true);
  });

  test("Deve ignorar situacao enviada na inclusão (sempre livre)", async () => {
    const { uuid } = await incluir.execute({ ...base(), situacao: "alugado" } as any);
    expect((await buscarLinha(uuid)).situacao).toBe("livre");
  });

  test("Proprietário de outra empresa ou inexistente deve dar 404 e não gravar nada", async () => {
    await expect(incluir.execute(base({ proprietarioUuid: donoDeOutraEmpresa }))).rejects.toMatchObject({
      message: "Proprietário não encontrado",
      statusCode: 404,
    });
    await expect(incluir.execute(base({ proprietarioUuid: "b0a20000-0000-4000-8000-0000000000ff" }))).rejects.toMatchObject({ statusCode: 404 });
    expect(await flagProprietario(donoDeOutraEmpresa)).toBe(false);
    expect((await query.listarImoveis(companyUuid, { pagina: 1, porPagina: 20 })).total).toBe(0);
  });

  test("Deve validar identificação, tipo e finalidade", async () => {
    await expect(incluir.execute(base({ identificacao: "  " }))).rejects.toMatchObject({ message: "A identificação do imóvel é obrigatória" });
    await expect(incluir.execute(base({ tipo: "castelo" }))).rejects.toMatchObject({ message: "Tipo de imóvel inválido" });
    await expect(incluir.execute(base({ finalidade: "x" }))).rejects.toMatchObject({ message: "Finalidade inválida. Use residencial ou comercial" });
    await expect(incluir.execute(base({ areaM2: -1 }))).rejects.toMatchObject({ message: "Área inválida" });
  });

  test("uuid malformado deve dar 404 (e não 500 do Postgres)", async () => {
    await expect(incluir.execute(base({ proprietarioUuid: "nao-e-uuid" }))).rejects.toMatchObject({
      message: "Proprietário não encontrado",
      statusCode: 404,
    });
    await expect(alterar.execute({ companyUuid, uuid: "nao-e-uuid", identificacao: "x" })).rejects.toMatchObject({
      message: "Imóvel não encontrado",
      statusCode: 404,
    });
    await expect(deletar.execute({ companyUuid, uuid: "123" })).rejects.toMatchObject({ message: "Imóvel não encontrado", statusCode: 404 });
    await expect(deletarPessoa.execute({ companyUuid, uuid: "xyz" })).rejects.toMatchObject({ message: "Pessoa não encontrada", statusCode: 404 });
  });

  test("buscarImovel deve devolver area_m2 como number, proprietário e contratoVigente null", async () => {
    const { uuid } = await incluir.execute(base({ areaM2: 72.5 }));
    const imovel = await query.buscarImovel(companyUuid, uuid);
    expect(imovel?.areaM2).toBe(72.5);
    expect(typeof imovel?.areaM2).toBe("number");
    expect(imovel?.proprietarioNome).toBe("Maria Dona");
    expect(imovel).toHaveProperty("contratoVigente", null);
    expect(await query.buscarImovel(companyUuidB, uuid)).toBeNull();
  });

  test("Deve alterar parcialmente e trocar proprietário ligando a flag do novo", async () => {
    const { uuid } = await incluir.execute(base({ matricula: "M1", areaM2: 10 }));
    await alterar.execute({ companyUuid, uuid, identificacao: "Ap 303", matricula: null, proprietarioUuid: donoB });
    const linha = await buscarLinha(uuid);
    expect(linha.identificacao).toBe("Ap 303");
    expect(linha.matricula).toBeNull();
    expect(linha.tipo).toBe("apartamento");
    expect(Number(linha.area_m2)).toBe(10);
    expect(linha.proprietario_uuid).toBe(donoB);
    expect(await flagProprietario(donoB)).toBe(true);
  });

  test("Alterar para proprietário de outra empresa deve dar 404 sem mudar nada", async () => {
    const { uuid } = await incluir.execute(base());
    await expect(alterar.execute({ companyUuid, uuid, identificacao: "Novo", proprietarioUuid: donoDeOutraEmpresa })).rejects.toMatchObject({
      message: "Proprietário não encontrado",
      statusCode: 404,
    });
    expect((await buscarLinha(uuid)).identificacao).toBe("Ap 302 - Ed. Sol");
  });

  test("Alterar imóvel de outra empresa deve dar 404", async () => {
    const { uuid } = await incluir.execute(base());
    await expect(alterar.execute({ companyUuid: companyUuidB, uuid, identificacao: "x" })).rejects.toMatchObject({
      message: "Imóvel não encontrado",
      statusCode: 404,
    });
  });

  test("Não deve permitir situacao 'alugado' manualmente, mas aceita reforma/inativo", async () => {
    const { uuid } = await incluir.execute(base());
    await expect(alterar.execute({ companyUuid, uuid, situacao: "alugado" })).rejects.toMatchObject({
      message: "A situação 'alugado' é definida pelo contrato",
    });
    await expect(alterar.execute({ companyUuid, uuid, situacao: "xyz" as any })).rejects.toMatchObject({ message: "Situação inválida" });
    await alterar.execute({ companyUuid, uuid, situacao: "reforma" });
    expect((await buscarLinha(uuid)).situacao).toBe("reforma");
  });

  test("Imóvel com contrato vigente não pode mudar de situação nem ser excluído (409)", async () => {
    const { uuid } = await incluir.execute(base());
    await incluirContrato.execute({
      companyUuid,
      imovelUuid: uuid,
      inquilinoUuid: donoB,
      inicio: "2026-01-01",
      fim: "2026-12-31",
      valorAluguel: 1000,
      diaVencimento: 5,
      indiceReajuste: "IPCA",
      garantiaTipo: "nenhuma",
    });
    expect((await buscarLinha(uuid)).situacao).toBe("alugado");
    await expect(alterar.execute({ companyUuid, uuid, situacao: "livre" })).rejects.toMatchObject({
      message: "Imóvel com contrato vigente não pode mudar de situação",
      statusCode: 409,
    });
    await alterar.execute({ companyUuid, uuid, situacao: "alugado", observacoes: "ok" });
    await expect(deletar.execute({ companyUuid, uuid })).rejects.toMatchObject({
      message: "Não é possível excluir imóvel com contrato vigente",
      statusCode: 409,
    });
  });

  test("Deve excluir imóvel (soft delete) e sumir da busca", async () => {
    const { uuid } = await incluir.execute(base());
    await deletar.execute({ companyUuid, uuid });
    expect((await buscarLinha(uuid)).deleted_at).not.toBeNull();
    expect(await query.buscarImovel(companyUuid, uuid)).toBeNull();
    await expect(deletar.execute({ companyUuid, uuid })).rejects.toMatchObject({ statusCode: 404 });
  });

  test("Deve listar filtrando por proprietário, situação e busca, com total e paginação", async () => {
    await incluir.execute(base({ identificacao: "Casa 1", tipo: "casa" }));
    const { uuid: reforma } = await incluir.execute(base({ identificacao: "Casa 2", tipo: "casa" }));
    await alterar.execute({ companyUuid, uuid: reforma, situacao: "reforma" });
    await incluir.execute(base({ proprietarioUuid: donoB, identificacao: "Loja 100%", tipo: "loja", finalidade: "comercial" }));

    const todos = await query.listarImoveis(companyUuid, { pagina: 1, porPagina: 20 });
    expect(todos.total).toBe(3);
    expect(todos.data.find((i) => i.identificacao === "Loja 100%")?.proprietarioNome).toBe("João Dono");

    expect((await query.listarImoveis(companyUuid, { proprietarioUuid: donoA, pagina: 1, porPagina: 20 })).total).toBe(2);
    expect((await query.listarImoveis(companyUuid, { situacao: "reforma", pagina: 1, porPagina: 20 })).data.map((i) => i.identificacao)).toEqual([
      "Casa 2",
    ]);
    expect((await query.listarImoveis(companyUuid, { busca: "João", pagina: 1, porPagina: 20 })).total).toBe(1);
    expect((await query.listarImoveis(companyUuid, { busca: "%", pagina: 1, porPagina: 20 })).data.map((i) => i.identificacao)).toEqual([
      "Loja 100%",
    ]);
    const pagina = await query.listarImoveis(companyUuid, { pagina: 2, porPagina: 2 });
    expect(pagina.total).toBe(3);
    expect(pagina.data).toHaveLength(1);
    expect((await query.listarImoveis(companyUuidB, { pagina: 1, porPagina: 20 })).total).toBe(0);
  });

  test("Deletar pessoa dona de imóvel ativo deve dar 409; após excluir o imóvel, libera", async () => {
    const { uuid } = await incluir.execute(base());
    await expect(deletarPessoa.execute({ companyUuid, uuid: donoA })).rejects.toMatchObject({
      message: "Não é possível excluir: a pessoa é proprietária de imóvel ou parte de contrato vigente",
      statusCode: 409,
    });
    await deletar.execute({ companyUuid, uuid });
    await deletarPessoa.execute({ companyUuid, uuid: donoA });
    expect(await dataSource.query(`SELECT 1 FROM imovel_pessoas WHERE uuid = $1 AND deleted_at IS NULL`, [donoA])).toHaveLength(0);
  });
});
