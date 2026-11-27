import dataSource from "src/@infra/database/datasource";
import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import { ImoveisQuery } from "../imoveis.query";

const companyUuid = "b0a70000-0000-4000-8000-000000000a01";
const companyUuidB = "b0a70000-0000-4000-8000-000000000b01";
const HOJE = "2026-11-24";

let query: ImoveisQuery;
let seq = 0;
const uuid = (n: number) => `b0a70000-0000-4000-8000-${String(n).padStart(12, "0")}`;

async function pessoa(company: string, nome: string): Promise<string> {
  const id = uuid(++seq);
  await dataSource.query(`INSERT INTO imovel_pessoas (uuid, company_uuid, tipo, documento, nome) VALUES ($1, $2, 'PF', $3, $4)`, [
    id,
    company,
    String(10000000000 + seq),
    nome,
  ]);
  return id;
}

async function imovel(company: string, dono: string, identificacao: string, situacao = "alugado"): Promise<string> {
  const id = uuid(++seq);
  await dataSource.query(
    `INSERT INTO imovel_imoveis (uuid, company_uuid, proprietario_uuid, identificacao, tipo, finalidade, situacao)
     VALUES ($1, $2, $3, $4, 'casa', 'residencial', $5)`,
    [id, company, dono, identificacao, situacao],
  );
  return id;
}

async function contrato(
  company: string,
  imovelUuid: string,
  inquilino: string,
  o: { inicio?: string; fim: string; status?: string; indice?: string; mes?: number | null; valor?: number },
): Promise<string> {
  const id = uuid(++seq);
  await dataSource.query(
    `INSERT INTO imovel_contratos (uuid, company_uuid, imovel_uuid, inquilino_uuid, inicio, fim, valor_aluguel, dia_vencimento, indice_reajuste, mes_reajuste, garantia_tipo, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 10, $8, $9, 'nenhuma', $10)`,
    [id, company, imovelUuid, inquilino, o.inicio ?? "2020-01-01", o.fim, o.valor ?? 1500, o.indice ?? "IGPM", o.mes ?? null, o.status ?? "vigente"],
  );
  return id;
}

describe("Painel do módulo imóveis", () => {
  const limpar = async () => {
    for (const tabela of ["imovel_contas", "imovel_contratos", "imovel_imoveis", "imovel_pessoas"]) {
      await dataSource.query(`DELETE FROM ${tabela} WHERE company_uuid IN ($1, $2)`, [companyUuid, companyUuidB]);
    }
  };

  beforeAll(async () => {
    await dataSource.initialize();
    for (const [id, tenant] of [
      [companyUuid, "test-painel-a"],
      [companyUuidB, "test-painel-b"],
    ]) {
      await dataSource.query(
        `INSERT INTO auth_companies (uuid, tenant_id, name, cpf_cnpj) VALUES ($1, $2, 'Empresa Teste Painel', '00000000000000') ON CONFLICT DO NOTHING`,
        [id, tenant],
      );
    }
    query = new ImoveisQuery(new ConnectionHub({ database: dataSource }));
  });

  afterEach(limpar);

  afterAll(async () => {
    await limpar();
    await dataSource.query(`DELETE FROM auth_companies WHERE uuid IN ($1, $2)`, [companyUuid, companyUuidB]);
    await dataSource.destroy();
  });

  test("Classifica contratos vigentes nas faixas de vencimento, ordenados por fim; encerrados ficam de fora", async () => {
    const dono = await pessoa(companyUuid, "Dona Maria");
    const inq = await pessoa(companyUuid, "Inquilino Pedro");
    const fins: [string, string][] = [
      ["Casa 1", "2026-08-01"],
      ["Casa 2", "2026-11-24"],
      ["Casa 3", "2026-12-24"],
      ["Casa 4", "2026-12-25"],
      ["Casa 5", "2027-01-23"],
      ["Casa 6", "2027-01-24"],
      ["Casa 7", "2027-02-22"],
      ["Casa 8", "2027-02-23"],
    ];
    for (const [nome, fim] of fins) await contrato(companyUuid, await imovel(companyUuid, dono, nome), inq, { fim });
    const encerrado = await imovel(companyUuid, dono, "Casa Encerrada", "livre");
    await contrato(companyUuid, encerrado, inq, { fim: "2026-01-01", status: "encerrado" });

    const painel = await query.painel(companyUuid, HOJE);

    const ident = (l: { imovelIdentificacao: string }[]) => l.map((c) => c.imovelIdentificacao);
    expect(ident(painel.vencidos)).toEqual(["Casa 1"]);
    expect(ident(painel.vence0a30)).toEqual(["Casa 2", "Casa 3"]);
    expect(ident(painel.vence31a60)).toEqual(["Casa 4", "Casa 5"]);
    expect(ident(painel.vence61a90)).toEqual(["Casa 6", "Casa 7"]);
    expect(painel.vencidos[0]).toMatchObject({
      proprietarioNome: "Dona Maria",
      inquilinoNome: "Inquilino Pedro",
      valorAluguel: 1500,
      fim: "2026-08-01",
      indiceReajuste: "IGPM",
    });
    expect(painel.vencidos[0].uuid).toEqual(expect.any(String));
  });

  test("Reajustes do mês: só índice <> nenhum, mês de hoje e início anterior ao mês de hoje", async () => {
    const dono = await pessoa(companyUuid, "Dona Maria");
    const inq = await pessoa(companyUuid, "Inquilino Pedro");
    const fim = "2030-01-01";
    await contrato(companyUuid, await imovel(companyUuid, dono, "B entra"), inq, { fim, inicio: "2025-11-10", mes: 11 });
    await contrato(companyUuid, await imovel(companyUuid, dono, "A entra"), inq, { fim, inicio: "2024-11-30", mes: 11 });
    await contrato(companyUuid, await imovel(companyUuid, dono, "Inicio no mês"), inq, { fim, inicio: "2026-11-05", mes: 11 });
    await contrato(companyUuid, await imovel(companyUuid, dono, "Sem índice"), inq, { fim, inicio: "2025-11-10", mes: 11, indice: "nenhum" });
    await contrato(companyUuid, await imovel(companyUuid, dono, "Outro mês"), inq, { fim, inicio: "2025-10-10", mes: 10 });
    await contrato(companyUuid, await imovel(companyUuid, dono, "Encerrado"), inq, { fim, inicio: "2025-11-10", mes: 11, status: "encerrado" });

    const painel = await query.painel(companyUuid, HOJE);
    expect(painel.reajustesMes.map((c) => c.imovelIdentificacao)).toEqual(["A entra", "B entra"]);
    expect(painel.reajustesMes[0].mesReajuste).toBe(11);
  });

  test("Imóveis livres: só situação livre, com proprietário, ordenados; excluídos e outra empresa ficam de fora", async () => {
    const dono = await pessoa(companyUuid, "Dona Maria");
    const donoB = await pessoa(companyUuidB, "Dono B");
    await imovel(companyUuid, dono, "Zeta", "livre");
    await imovel(companyUuid, dono, "Alfa", "livre");
    await imovel(companyUuid, dono, "Alugado", "alugado");
    await imovel(companyUuid, dono, "Reforma", "reforma");
    const apagado = await imovel(companyUuid, dono, "Apagado", "livre");
    await dataSource.query(`UPDATE imovel_imoveis SET deleted_at = now() WHERE uuid = $1`, [apagado]);
    await imovel(companyUuidB, donoB, "Livre B", "livre");

    const painel = await query.painel(companyUuid, HOJE);
    expect(painel.imoveisLivres.map((i) => i.identificacao)).toEqual(["Alfa", "Zeta"]);
    expect(painel.imoveisLivres[0]).toMatchObject({ proprietarioNome: "Dona Maria" });
    expect(painel.imoveisLivres[0].uuid).toEqual(expect.any(String));
  });

  test("Outra empresa e contratos excluídos não aparecem", async () => {
    const donoB = await pessoa(companyUuidB, "Dono B");
    const inqB = await pessoa(companyUuidB, "Inquilino B");
    await contrato(companyUuidB, await imovel(companyUuidB, donoB, "Casa B"), inqB, { fim: "2026-01-01", inicio: "2025-11-10", mes: 11 });
    const dono = await pessoa(companyUuid, "Dona Maria");
    const inq = await pessoa(companyUuid, "Inquilino Pedro");
    const c = await contrato(companyUuid, await imovel(companyUuid, dono, "Casa Apagada"), inq, { fim: "2026-01-01" });
    await dataSource.query(`UPDATE imovel_contratos SET deleted_at = now() WHERE uuid = $1`, [c]);

    const painel = await query.painel(companyUuid, HOJE);
    expect(painel).toEqual({ vencidos: [], vence0a30: [], vence31a60: [], vence61a90: [], reajustesMes: [], imoveisLivres: [], contasVencidas: 0 });
  });

  test("Painel conta contas vencidas da empresa", async () => {
    const dono = await pessoa(companyUuid, "Dono");
    const donoB = await pessoa(companyUuidB, "Dono B");
    const ins = (company: string, proprietario: string, vencimento: string, pago: boolean, apagada = false) =>
      dataSource.query(
        `INSERT INTO imovel_contas (uuid, company_uuid, tipo, categoria, proprietario_uuid, vencimento, valor, pago_em, valor_pago, deleted_at)
         VALUES ($1, $2, 'encargo', 'iptu', $3, $4, 100, $5, $6, $7)`,
        [uuid(++seq), company, proprietario, vencimento, pago ? "2026-11-01" : null, pago ? 100 : null, apagada ? new Date() : null],
      );
    await ins(companyUuid, dono, "2026-11-23", false);
    await ins(companyUuid, dono, "2026-01-01", false);
    await ins(companyUuid, dono, "2026-11-24", false);
    await ins(companyUuid, dono, "2026-11-01", true);
    await ins(companyUuid, dono, "2026-11-01", false, true);
    await ins(companyUuidB, donoB, "2026-11-01", false);
    const painel = await query.painel(companyUuid, HOJE);
    expect(painel.contasVencidas).toBe(2);
  });
});
