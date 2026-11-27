import { ContasController } from "../contas.controller";

const EMPRESA = "11111111-1111-4111-8111-111111111111";
const OUTRA = "22222222-2222-4222-8222-222222222222";
const CONTA = "33333333-3333-4333-8333-333333333333";

function montar() {
  const q = {
    listarContas: jest.fn().mockResolvedValue({ data: [], total: 0, totalValor: 0, totalPago: 0 }),
    agendaContas: jest.fn().mockResolvedValue({}),
  };
  const incluir = { execute: jest.fn().mockResolvedValue({ uuid: "x" }) };
  const parcelas = { execute: jest.fn().mockResolvedValue({ uuids: [], grupoUuid: "g" }) };
  const alterar = { execute: jest.fn().mockResolvedValue(undefined) };
  const pagamento = { registrar: jest.fn().mockResolvedValue(undefined), desfazer: jest.fn() };
  const ctrl = new ContasController(
    q as any,
    incluir as any,
    parcelas as any,
    alterar as any,
    {} as any,
    pagamento as any,
    {} as any,
    {} as any,
    {} as any,
  );
  const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
  return { ctrl, q, incluir, parcelas, alterar, pagamento, res };
}

const req = { companyUuid: EMPRESA };

describe("ContasController: tenant e uuid vêm de req/params, nunca do corpo", () => {
  test("incluir ignora companyUuid e hoje do corpo", async () => {
    const { ctrl, incluir, res } = montar();
    await ctrl.incluir(req, { descricao: "x", companyUuid: OUTRA, hoje: "2000-01-01" }, res);
    const input = incluir.execute.mock.calls[0][0];
    expect(input.companyUuid).toBe(EMPRESA);
    expect(input.hoje).not.toBe("2000-01-01");
    expect(input.descricao).toBe("x");
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test("alterar ignora companyUuid e uuid do corpo", async () => {
    const { ctrl, alterar, res } = montar();
    await ctrl.alterar(req, CONTA, { descricao: "y", companyUuid: OUTRA, uuid: OUTRA }, res);
    const input = alterar.execute.mock.calls[0][0];
    expect(input.companyUuid).toBe(EMPRESA);
    expect(input.uuid).toBe(CONTA);
    expect(input.descricao).toBe("y");
  });

  test("pagamento e parcelas também", async () => {
    const { ctrl, pagamento, parcelas, res } = montar();
    await ctrl.registrarPagamento(req, CONTA, { companyUuid: OUTRA, uuid: OUTRA, hoje: "2000-01-01", pagoEm: "2026-01-01" }, res);
    expect(pagamento.registrar.mock.calls[0][0]).toMatchObject({ companyUuid: EMPRESA, uuid: CONTA });
    expect(pagamento.registrar.mock.calls[0][0].hoje).not.toBe("2000-01-01");
    await ctrl.gerarParcelas(req, { companyUuid: OUTRA }, res);
    expect(parcelas.execute.mock.calls[0][0].companyUuid).toBe(EMPRESA);
  });
});

describe("ContasController: quantidade de parcelas", () => {
  test.each([
    ["12", 12],
    [12, 12],
    ["", ""],
    ["abc", "abc"],
    [undefined, undefined],
  ])("quantidade %p -> %p", async (entrada, esperado) => {
    const { ctrl, parcelas, res } = montar();
    await ctrl.gerarParcelas(req, { quantidade: entrada }, res);
    expect(parcelas.execute.mock.calls[0][0].quantidade).toBe(esperado);
  });
});

describe("ContasController: filtros de listagem", () => {
  const listar = (ctrl: ContasController, res: any, f: Record<string, any>) =>
    ctrl.listar(
      req,
      f.tipo,
      f.categoria,
      f.proprietarioUuid,
      f.imovelUuid,
      f.contratoUuid,
      f.situacao,
      f.responsavel,
      f.vencimentoDe,
      f.vencimentoAte,
      f.busca,
      f.pagina,
      f.porPagina,
      res,
    );

  test.each([
    [{ tipo: "xx" }],
    [{ situacao: "xx" }],
    [{ responsavel: "xx" }],
    [{ categoria: "xx" }],
    [{ tipo: "guia", categoria: "iptu" }],
    [{ vencimentoDe: "2026-02-30" }],
    [{ vencimentoAte: "ontem" }],
    [{ tipo: ["guia", "despesa"] }],
  ])("%j -> 400", async (filtro) => {
    const { ctrl, q, res } = montar();
    await expect(listar(ctrl, res, filtro)).rejects.toMatchObject({ statusCode: 400 });
    expect(q.listarContas).not.toHaveBeenCalled();
  });

  test("filtros válidos passam e porPagina é limitado a 100", async () => {
    const { ctrl, q, res } = montar();
    await listar(ctrl, res, { tipo: "guia", situacao: "vencida", responsavel: "proprietario", vencimentoDe: "2026-01-01", porPagina: "500" });
    const [empresa, filtro] = q.listarContas.mock.calls[0];
    expect(empresa).toBe(EMPRESA);
    expect(filtro).toMatchObject({ tipo: "guia", situacao: "vencida", vencimentoDe: "2026-01-01", pagina: 1, porPagina: 100 });
  });

  test("agenda com tipo inválido -> 400", async () => {
    const { ctrl, res } = montar();
    await expect(ctrl.agenda(req, "", "", "xx", res)).rejects.toMatchObject({ statusCode: 400 });
  });
});
