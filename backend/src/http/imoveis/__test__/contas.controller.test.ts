import { Test } from "@nestjs/testing";
import request from "supertest";
import { GlobalErrorFilter } from "../../shared/globalErrorFilter";
import { ArquivoGrandeInterceptor, ContasController } from "../contas.controller";
import { EnviarAnexoContaUsecase } from "src/@modules/imoveis/contas/anexos/anexosConta";

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

describe("ContasController: perfil e anexos", () => {
  test("DELETE sem ser admin -> 403 e não chama o use case", async () => {
    const { ctrl, res } = montar();
    const deletar = jest.fn();
    (ctrl as any).deletarContaUsecase = { execute: deletar };
    await expect(ctrl.excluir({ companyUuid: EMPRESA, userPosition: "gerente" }, CONTA, res)).rejects.toMatchObject({ statusCode: 403 });
    expect(deletar).not.toHaveBeenCalled();
    await ctrl.excluir({ companyUuid: EMPRESA, userPosition: "admin" }, CONTA, res);
    expect(deletar).toHaveBeenCalledWith({ companyUuid: EMPRESA, uuid: CONTA });
  });

  test("url e remover de anexo passam conta e anexo dos params", async () => {
    const { ctrl, res } = montar();
    const url = jest.fn().mockResolvedValue({ url: "u", nomeArquivo: "a" });
    const remover = jest.fn();
    (ctrl as any).urlAnexoContaUsecase = { execute: url };
    (ctrl as any).removerAnexoContaUsecase = { execute: remover };
    await ctrl.urlAnexo(req, CONTA, OUTRA, res);
    await ctrl.removerAnexo(req, CONTA, OUTRA, res);
    expect(url).toHaveBeenCalledWith({ companyUuid: EMPRESA, contaUuid: CONTA, anexoUuid: OUTRA });
    expect(remover).toHaveBeenCalledWith({ companyUuid: EMPRESA, contaUuid: CONTA, anexoUuid: OUTRA });
  });

  test("pagina/porPagina infinitos caem no padrão", async () => {
    const { ctrl, q, res } = montar();
    await ctrl.listar(req, "" as any, "", "", "", "", "", "", "", "", "", "1e999", "Infinity", res);
    expect(q.listarContas.mock.calls[0][1]).toMatchObject({ pagina: 1, porPagina: 20 });
  });
});

describe("ContasController: upload acima do limite (HTTP)", () => {
  test("11 MB -> 400 com MSG_ARQUIVO_GRANDE", async () => {
    const enviar = { execute: jest.fn() };
    const modulo = await Test.createTestingModule({
      controllers: [ContasController],
      providers: [{ provide: ArquivoGrandeInterceptor, useValue: new ArquivoGrandeInterceptor() }],
    })
      .useMocker((token) => (token === EnviarAnexoContaUsecase ? enviar : {}))
      .compile();
    const app = modulo.createNestApplication();
    app.useGlobalFilters(new GlobalErrorFilter());
    app.use((r: any, _s: any, next: any) => {
      r.companyUuid = EMPRESA;
      next();
    });
    await app.init();
    const resp = await request(app.getHttpServer())
      .post(`/imoveis/contas/${CONTA}/anexos`)
      .field("tipo", "documento")
      .attach("arquivo", Buffer.alloc(11 * 1024 * 1024, 1), "grande.pdf");
    await app.close();
    expect(resp.status).toBe(400);
    expect(resp.body.message).toBe("O arquivo deve ter no máximo 10 MB");
    expect(enviar.execute).not.toHaveBeenCalled();
  });
});
