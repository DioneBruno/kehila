import dataSource from "src/@infra/database/datasource";
import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import { DeletarContaRepository } from "../contas/deletarConta/deletarContaRepository";
import { DeletarContaUsecase } from "../contas/deletarConta/deletarConta.usecase";
import { ImoveisQuery } from "../imoveis.query";

const companyUuid = "b0a90000-0000-4000-8000-000000000a01";
const companyUuidB = "b0a90000-0000-4000-8000-000000000b01";
const HOJE = "2026-11-24";

let query: ImoveisQuery;
let deletar: DeletarContaUsecase;
let seq = 0;
const uuid = (n: number) => `b0a90000-0000-4000-8000-${String(n).padStart(12, "0")}`;

async function pessoa(company: string, nome: string): Promise<string> {
  const id = uuid(++seq);
  await dataSource.query(
    `INSERT INTO imovel_pessoas (uuid, company_uuid, tipo, documento, nome, eh_proprietario) VALUES ($1, $2, 'PF', $3, $4, true)`,
    [id, company, String(30000000000 + seq), nome],
  );
  return id;
}

async function imovel(company: string, dono: string, identificacao: string): Promise<string> {
  const id = uuid(++seq);
  await dataSource.query(
    `INSERT INTO imovel_imoveis (uuid, company_uuid, proprietario_uuid, identificacao, tipo, finalidade, situacao)
     VALUES ($1, $2, $3, $4, 'casa', 'residencial', 'alugado')`,
    [id, company, dono, identificacao],
  );
  return id;
}

async function contrato(company: string, imovelUuid: string, inquilino: string): Promise<string> {
  const id = uuid(++seq);
  await dataSource.query(
    `INSERT INTO imovel_contratos (uuid, company_uuid, imovel_uuid, inquilino_uuid, inicio, fim, valor_aluguel, dia_vencimento, indice_reajuste, garantia_tipo, status)
     VALUES ($1, $2, $3, $4, '2020-01-01', '2030-01-01', 1500, 10, 'IGPM', 'nenhuma', 'vigente')`,
    [id, company, imovelUuid, inquilino],
  );
  return id;
}

type ContaOpts = {
  tipo?: string;
  categoria?: string;
  imovelUuid?: string | null;
  contratoUuid?: string | null;
  responsavel?: string;
  valor?: number;
  pagoEm?: string | null;
  valorPago?: number | null;
  deleted?: boolean;
  descricao?: string | null;
  fornecedor?: string | null;
  documentoNumero?: string | null;
  grupoUuid?: string | null;
  parcelaNumero?: number | null;
};

async function conta(company: string, dono: string, vencimento: string, o: ContaOpts = {}): Promise<string> {
  const id = uuid(++seq);
  await dataSource.query(
    `INSERT INTO imovel_contas (uuid, company_uuid, tipo, categoria, descricao, proprietario_uuid, imovel_uuid, contrato_uuid, responsavel,
       vencimento, valor, pago_em, valor_pago, fornecedor, documento_numero, grupo_uuid, parcela_numero, parcela_total, deleted_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)`,
    [
      id,
      company,
      o.tipo ?? "encargo",
      o.categoria ?? "iptu",
      o.descricao ?? null,
      dono,
      o.imovelUuid ?? null,
      o.contratoUuid ?? null,
      o.responsavel ?? "proprietario",
      vencimento,
      o.valor ?? 100,
      o.pagoEm ?? null,
      o.valorPago ?? null,
      o.fornecedor ?? null,
      o.documentoNumero ?? null,
      o.grupoUuid ?? null,
      o.parcelaNumero ?? null,
      o.grupoUuid ? 3 : null,
      o.deleted ? new Date() : null,
    ],
  );
  return id;
}

const lista = { pagina: 1, porPagina: 20 };

describe("Leituras das contas do imóvel", () => {
  const limpar = async () => {
    for (const tabela of ["imovel_conta_anexos", "imovel_contas", "imovel_contratos", "imovel_imoveis", "imovel_pessoas"]) {
      await dataSource.query(`DELETE FROM ${tabela} WHERE company_uuid IN ($1, $2)`, [companyUuid, companyUuidB]);
    }
  };

  beforeAll(async () => {
    await dataSource.initialize();
    for (const [id, tenant] of [
      [companyUuid, "test-contasq-a"],
      [companyUuidB, "test-contasq-b"],
    ]) {
      await dataSource.query(
        `INSERT INTO auth_companies (uuid, tenant_id, name, cpf_cnpj) VALUES ($1, $2, 'Empresa Teste Contas Query', '00000000000000') ON CONFLICT DO NOTHING`,
        [id, tenant],
      );
    }
    const connections = new ConnectionHub({ database: dataSource });
    query = new ImoveisQuery(connections);
    deletar = new DeletarContaUsecase(new DeletarContaRepository(connections));
  });

  afterEach(limpar);

  afterAll(async () => {
    await limpar();
    await dataSource.query(`DELETE FROM auth_companies WHERE uuid IN ($1, $2)`, [companyUuid, companyUuidB]);
    await dataSource.destroy();
  });

  test("agenda separa vencimentos 2026-11-23 / 24 / 30 / 12-01 / 12-23 / 12-24", async () => {
    const dono = await pessoa(companyUuid, "Dono");
    for (const v of ["2026-11-23", "2026-11-24", "2026-11-30", "2026-12-01", "2026-12-23", "2026-12-24"]) await conta(companyUuid, dono, v);
    const agenda = await query.agendaContas(companyUuid, HOJE, {});
    const venc = (g: { contas: { vencimento: string }[] }) => g.contas.map((c) => c.vencimento);
    expect(venc(agenda.vencidas)).toEqual(["2026-11-23"]);
    expect(venc(agenda.proximos7)).toEqual(["2026-11-24", "2026-11-30"]);
    expect(venc(agenda.proximos30)).toEqual(["2026-12-01", "2026-12-23"]);
    expect(agenda.proximos7.total).toBe(2);
    expect(agenda.proximos7.soma).toBe(200);
    expect(agenda.vencidas.contas[0].situacao).toBe("vencida");
  });

  test("agenda ignora pagas e excluídas e outra empresa", async () => {
    const dono = await pessoa(companyUuid, "Dono");
    const donoB = await pessoa(companyUuidB, "Dono B");
    await conta(companyUuid, dono, "2026-11-25");
    await conta(companyUuid, dono, "2026-11-25", { pagoEm: "2026-11-20", valorPago: 100 });
    await conta(companyUuid, dono, "2026-11-25", { deleted: true });
    await conta(companyUuidB, donoB, "2026-11-25");
    const agenda = await query.agendaContas(companyUuid, HOJE, {});
    expect(agenda.proximos7.total).toBe(1);
    expect(agenda.vencidas.total).toBe(0);
    expect(agenda.proximos30.total).toBe(0);
  });

  test("agenda limita a 50 contas mas total e soma contam todas", async () => {
    const dono = await pessoa(companyUuid, "Dono");
    for (let i = 0; i < 51; i++) await conta(companyUuid, dono, "2026-11-01", { valor: 10 });
    const agenda = await query.agendaContas(companyUuid, HOJE, {});
    expect(agenda.vencidas.contas).toHaveLength(50);
    expect(agenda.vencidas.total).toBe(51);
    expect(agenda.vencidas.soma).toBe(510);
  });

  test("agenda filtra por proprietário e os totais respeitam o filtro", async () => {
    const a = await pessoa(companyUuid, "Dono A");
    const b = await pessoa(companyUuid, "Dono B");
    await conta(companyUuid, a, "2026-11-25", { valor: 50 });
    await conta(companyUuid, b, "2026-11-25", { valor: 70 });
    await conta(companyUuid, b, "2026-11-26", { valor: 30, tipo: "despesa", categoria: "manutencao" });
    const agenda = await query.agendaContas(companyUuid, HOJE, { proprietarioUuid: b });
    expect(agenda.proximos7.total).toBe(2);
    expect(agenda.proximos7.soma).toBe(100);
    expect(agenda.proximos7.contas.every((c) => c.proprietarioUuid === b)).toBe(true);
    const soDespesa = await query.agendaContas(companyUuid, HOJE, { tipo: "despesa" });
    expect(soDespesa.proximos7.total).toBe(1);
  });

  test("listarContas filtra por situacao=vencida, tipo, imóvel, contrato e período; meta soma valor e valor_pago", async () => {
    const dono = await pessoa(companyUuid, "Dono");
    const inq = await pessoa(companyUuid, "Inquilino Ivo");
    const im = await imovel(companyUuid, dono, "Casa 1");
    const im2 = await imovel(companyUuid, dono, "Casa 2");
    const ct = await contrato(companyUuid, im, inq);
    await conta(companyUuid, dono, "2026-10-10", { imovelUuid: im, contratoUuid: ct, responsavel: "inquilino", valor: 100 });
    await conta(companyUuid, dono, "2026-11-23", { imovelUuid: im, valor: 200, tipo: "despesa", categoria: "manutencao" });
    await conta(companyUuid, dono, "2026-11-24", { imovelUuid: im2, valor: 300 });
    await conta(companyUuid, dono, "2026-09-01", { imovelUuid: im2, valor: 400, pagoEm: "2026-09-02", valorPago: 390 });
    await conta(companyUuid, dono, "2026-09-01", { valor: 999, deleted: true });

    const todas = await query.listarContas(companyUuid, lista, HOJE);
    expect(todas.total).toBe(4);
    expect(todas.totalValor).toBe(1000);
    expect(todas.totalPago).toBe(390);
    expect(todas.data.map((c) => c.vencimento)).toEqual(["2026-09-01", "2026-10-10", "2026-11-23", "2026-11-24"]);
    expect(todas.data.map((c) => c.situacao)).toEqual(["paga", "vencida", "vencida", "a_pagar"]);
    expect(todas.data[1]).toMatchObject({ inquilinoNome: "Inquilino Ivo", imovelIdentificacao: "Casa 1", proprietarioNome: "Dono", valor: 100 });
    expect(todas.data[0]).toMatchObject({ valorPago: 390, inquilinoNome: null, contratoUuid: null });

    const venc = await query.listarContas(companyUuid, { ...lista, situacao: "vencida" }, HOJE);
    expect(venc.total).toBe(2);
    expect(venc.totalValor).toBe(300);
    expect((await query.listarContas(companyUuid, { ...lista, situacao: "a_pagar" }, HOJE)).total).toBe(1);
    expect((await query.listarContas(companyUuid, { ...lista, situacao: "paga" }, HOJE)).totalPago).toBe(390);
    expect((await query.listarContas(companyUuid, { ...lista, tipo: "despesa" }, HOJE)).total).toBe(1);
    expect((await query.listarContas(companyUuid, { ...lista, imovelUuid: im2 }, HOJE)).total).toBe(2);
    expect((await query.listarContas(companyUuid, { ...lista, contratoUuid: ct }, HOJE)).total).toBe(1);
    const periodo = await query.listarContas(companyUuid, { ...lista, vencimentoDe: "2026-10-01", vencimentoAte: "2026-11-23" }, HOJE);
    expect(periodo.data.map((c) => c.vencimento)).toEqual(["2026-10-10", "2026-11-23"]);
    const pag = await query.listarContas(companyUuid, { pagina: 2, porPagina: 3 }, HOJE);
    expect(pag.data).toHaveLength(1);
    expect(pag.total).toBe(4);
  });

  test("listarContas busca por descrição, fornecedor e número do documento", async () => {
    const dono = await pessoa(companyUuid, "Dono");
    await conta(companyUuid, dono, "2026-12-01", { descricao: "Reforma do telhado" });
    await conta(companyUuid, dono, "2026-12-02", { fornecedor: "Telhas Silva" });
    await conta(companyUuid, dono, "2026-12-03", { documentoNumero: "NF-telha-9" });
    await conta(companyUuid, dono, "2026-12-04", { descricao: "Outra" });
    const r = await query.listarContas(companyUuid, { ...lista, busca: "telha" }, HOJE);
    expect(r.total).toBe(3);
  });

  test("listarContas não traz mais a conta depois de DeletarContaUsecase", async () => {
    const dono = await pessoa(companyUuid, "Dono");
    const id = await conta(companyUuid, dono, "2026-12-01");
    expect((await query.listarContas(companyUuid, lista, HOJE)).total).toBe(1);
    await deletar.execute({ companyUuid, uuid: id });
    expect((await query.listarContas(companyUuid, lista, HOJE)).total).toBe(0);
    expect(await query.buscarConta(companyUuid, id, HOJE)).toBeNull();
  });

  test("buscarConta traz anexos não excluídos e as outras parcelas do grupo", async () => {
    const dono = await pessoa(companyUuid, "Dono");
    const grupo = uuid(++seq);
    const p1 = await conta(companyUuid, dono, "2026-12-10", { grupoUuid: grupo, parcelaNumero: 1 });
    const p2 = await conta(companyUuid, dono, "2027-01-10", { grupoUuid: grupo, parcelaNumero: 2 });
    await conta(companyUuid, dono, "2027-02-10", { grupoUuid: grupo, parcelaNumero: 3, deleted: true });
    await conta(companyUuidB, await pessoa(companyUuidB, "B"), "2027-02-10", { grupoUuid: grupo, parcelaNumero: 3 });
    for (const [nome, apagado] of [
      ["a.pdf", false],
      ["b.pdf", true],
    ] as const) {
      await dataSource.query(
        `INSERT INTO imovel_conta_anexos (uuid, company_uuid, conta_uuid, tipo, nome_arquivo, caminho, content_type, tamanho, deleted_at)
         VALUES ($1, $2, $3, 'documento', $4::varchar, 'x/' || $4::varchar, 'application/pdf', 1234, $5)`,
        [uuid(++seq), companyUuid, p1, nome, apagado ? new Date() : null],
      );
    }
    const c = await query.buscarConta(companyUuid, p1, HOJE);
    expect(c).not.toBeNull();
    expect(c!.anexos).toHaveLength(1);
    expect(c!.anexos[0]).toMatchObject({ nomeArquivo: "a.pdf", tipo: "documento", contentType: "application/pdf", tamanho: 1234 });
    expect(c!.parcelas).toEqual([{ uuid: p2, parcelaNumero: 2, vencimento: "2027-01-10", situacao: "a_pagar" }]);
    expect(await query.buscarConta(companyUuidB, p1, HOJE)).toBeNull();
    const semGrupo = await conta(companyUuid, dono, "2026-12-10");
    expect((await query.buscarConta(companyUuid, semGrupo, HOJE))!.parcelas).toEqual([]);
  });
});
