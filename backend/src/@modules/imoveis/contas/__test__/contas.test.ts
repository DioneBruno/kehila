import dataSource from "src/@infra/database/datasource";
import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import {
  MSG_CONTA_JA_PAGA,
  MSG_CONTA_NAO_PAGA,
  MSG_CONTRATO_OUTRO_IMOVEL,
  MSG_INFORME_PROPRIETARIO,
  MSG_NAO_PROPRIETARIO,
} from "../conta.entity";
import { AlterarContaRepository } from "../alterarConta/alterarContaRepository";
import { AlterarContaUsecase } from "../alterarConta/alterarConta.usecase";
import { DeletarContaRepository } from "../deletarConta/deletarContaRepository";
import { DeletarContaUsecase } from "../deletarConta/deletarConta.usecase";
import { PagamentoContaRepository } from "../pagamentoConta/pagamentoContaRepository";
import { PagamentoContaUsecase } from "../pagamentoConta/pagamentoConta.usecase";
import { AlterarImovelRepository } from "../../imoveis/alterarImovel/alterarImovelRepository";
import { AlterarImovelUsecase } from "../../imoveis/alterarImovel/alterarImovel.usecase";
import { DeletarImovelRepository } from "../../imoveis/deletarImovel/deletarImovelRepository";
import { DeletarImovelUsecase } from "../../imoveis/deletarImovel/deletarImovel.usecase";
import { GerarParcelasUsecase } from "../gerarParcelas/gerarParcelas.usecase";
import { IncluirContaRepository } from "../incluirConta/incluirContaRepository";
import { IncluirContaUsecase } from "../incluirConta/incluirConta.usecase";

const companyUuid = "b0a80000-0000-4000-8000-000000000a01";
const companyUuidB = "b0a80000-0000-4000-8000-000000000b01";
const HOJE = "2026-11-24";

let incluir: IncluirContaUsecase;
let gerar: GerarParcelasUsecase;
let alterar: AlterarContaUsecase;
let pagamento: PagamentoContaUsecase;
let deletar: DeletarContaUsecase;
let deletarImovel: DeletarImovelUsecase;
let alterarImovel: AlterarImovelUsecase;
let seq = 0;
const uuid = (n: number) => `b0a80000-0000-4000-8000-${String(n).padStart(12, "0")}`;

async function pessoa(company: string, nome: string, proprietario = true): Promise<string> {
  const id = uuid(++seq);
  await dataSource.query(
    `INSERT INTO imovel_pessoas (uuid, company_uuid, tipo, documento, nome, eh_proprietario) VALUES ($1, $2, 'PF', $3, $4, $5)`,
    [id, company, String(20000000000 + seq), nome, proprietario],
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

async function contrato(company: string, imovelUuid: string, inquilino: string, status = "vigente"): Promise<string> {
  const id = uuid(++seq);
  await dataSource.query(
    `INSERT INTO imovel_contratos (uuid, company_uuid, imovel_uuid, inquilino_uuid, inicio, fim, valor_aluguel, dia_vencimento, indice_reajuste, garantia_tipo, status)
     VALUES ($1, $2, $3, $4, '2020-01-01', '2030-01-01', 1500, 10, 'IGPM', 'nenhuma', $5)`,
    [id, company, imovelUuid, inquilino, status],
  );
  return id;
}

const base = { tipo: "encargo", categoria: "iptu", vencimento: "2026-12-10", valor: 250.5 };

const contas = (company = companyUuid) =>
  dataSource.query(
    `SELECT *, competencia::text AS competencia_txt, vencimento::text AS vencimento_txt, pago_em::text AS pago_em_txt
     FROM imovel_contas WHERE company_uuid = $1 ORDER BY parcela_numero`,
    [company],
  );

async function erro(p: Promise<unknown>) {
  try {
    await p;
  } catch (e: any) {
    return e;
  }
  throw new Error("não lançou");
}

describe("Incluir conta e gerar parcelas", () => {
  const limpar = async () => {
    for (const tabela of ["imovel_conta_anexos", "imovel_contas", "imovel_contratos", "imovel_imoveis", "imovel_pessoas"]) {
      await dataSource.query(`DELETE FROM ${tabela} WHERE company_uuid IN ($1, $2)`, [companyUuid, companyUuidB]);
    }
  };

  beforeAll(async () => {
    await dataSource.initialize();
    for (const [id, tenant] of [
      [companyUuid, "test-contas-a"],
      [companyUuidB, "test-contas-b"],
    ]) {
      await dataSource.query(
        `INSERT INTO auth_companies (uuid, tenant_id, name, cpf_cnpj) VALUES ($1, $2, 'Empresa Teste Contas', '00000000000000') ON CONFLICT DO NOTHING`,
        [id, tenant],
      );
    }
    const repo = new IncluirContaRepository(new ConnectionHub({ database: dataSource }));
    incluir = new IncluirContaUsecase(repo);
    gerar = new GerarParcelasUsecase(repo);
    const connections = new ConnectionHub({ database: dataSource });
    alterar = new AlterarContaUsecase(new AlterarContaRepository(connections));
    pagamento = new PagamentoContaUsecase(new PagamentoContaRepository(connections));
    deletar = new DeletarContaUsecase(new DeletarContaRepository(connections));
    alterarImovel = new AlterarImovelUsecase(new AlterarImovelRepository(connections));
    deletarImovel = new DeletarImovelUsecase(new DeletarImovelRepository(connections));
  });

  afterEach(limpar);

  afterAll(async () => {
    await limpar();
    await dataSource.query(`DELETE FROM auth_companies WHERE uuid IN ($1, $2)`, [companyUuid, companyUuidB]);
    await dataSource.destroy();
  });

  test("inclui encargo com imóvel e usa o dono do imóvel, ignorando proprietarioUuid enviado", async () => {
    const dono = await pessoa(companyUuid, "Dono");
    const outro = await pessoa(companyUuid, "Outro");
    const im = await imovel(companyUuid, dono, "Casa 1");
    const { uuid: id } = await incluir.execute({ companyUuid, hoje: HOJE, ...base, imovelUuid: im, proprietarioUuid: outro });
    const [row] = await contas();
    expect(row.uuid).toBe(id);
    expect(row.proprietario_uuid).toBe(dono);
    expect(row.imovel_uuid).toBe(im);
    expect(row.pago_em).toBeNull();
  });

  test("inclui guia sem imóvel com proprietário informado", async () => {
    const dono = await pessoa(companyUuid, "Dono");
    await incluir.execute({
      companyUuid,
      hoje: HOJE,
      tipo: "guia",
      categoria: "darf",
      esfera: "federal",
      vencimento: "2026-12-10",
      valor: 100,
      proprietarioUuid: dono,
    });
    const [row] = await contas();
    expect(row.proprietario_uuid).toBe(dono);
    expect(row.imovel_uuid).toBeNull();
  });

  test("sem imóvel e sem proprietário -> 400 MSG_INFORME_PROPRIETARIO", async () => {
    const e = await erro(incluir.execute({ companyUuid, hoje: HOJE, ...base }));
    expect(e.message).toBe(MSG_INFORME_PROPRIETARIO);
    expect(e.statusCode).toBe(400);
  });

  test("proprietário sem eh_proprietario -> 400 MSG_NAO_PROPRIETARIO", async () => {
    const p = await pessoa(companyUuid, "Inquilino", false);
    const e = await erro(incluir.execute({ companyUuid, hoje: HOJE, ...base, proprietarioUuid: p }));
    expect(e.message).toBe(MSG_NAO_PROPRIETARIO);
    expect(e.statusCode).toBe(400);
  });

  test("contrato de outro imóvel -> 400 MSG_CONTRATO_OUTRO_IMOVEL", async () => {
    const dono = await pessoa(companyUuid, "Dono");
    const inq = await pessoa(companyUuid, "Inq", false);
    const im1 = await imovel(companyUuid, dono, "Casa 1");
    const im2 = await imovel(companyUuid, dono, "Casa 2");
    const ct = await contrato(companyUuid, im1, inq);
    const e = await erro(incluir.execute({ companyUuid, hoje: HOJE, ...base, imovelUuid: im2, contratoUuid: ct }));
    expect(e.message).toBe(MSG_CONTRATO_OUTRO_IMOVEL);
    expect(e.statusCode).toBe(400);
  });

  test("aceita contrato encerrado do mesmo imóvel", async () => {
    const dono = await pessoa(companyUuid, "Dono");
    const inq = await pessoa(companyUuid, "Inq", false);
    const im = await imovel(companyUuid, dono, "Casa 1");
    const ct = await contrato(companyUuid, im, inq, "encerrado");
    await incluir.execute({ companyUuid, hoje: HOJE, ...base, imovelUuid: im, contratoUuid: ct, responsavel: "inquilino" });
    const [row] = await contas();
    expect(row.contrato_uuid).toBe(ct);
    expect(row.responsavel).toBe("inquilino");
  });

  test("imóvel de outra empresa -> 404", async () => {
    const donoB = await pessoa(companyUuidB, "Dono B");
    const imB = await imovel(companyUuidB, donoB, "Casa B");
    const e = await erro(incluir.execute({ companyUuid, hoje: HOJE, ...base, imovelUuid: imB }));
    expect(e.statusCode).toBe(404);
    expect(await contas()).toHaveLength(0);
  });

  test("despesa já paga grava pago_em e valor_pago", async () => {
    const dono = await pessoa(companyUuid, "Dono");
    const im = await imovel(companyUuid, dono, "Casa 1");
    await incluir.execute({
      companyUuid,
      hoje: HOJE,
      tipo: "despesa",
      categoria: "manutencao",
      vencimento: "2026-11-10",
      valor: 300,
      imovelUuid: im,
      pagoEm: "2026-11-12",
      valorPago: 290,
    });
    const [row] = await contas();
    expect(row.pago_em_txt).toBe("2026-11-12");
    expect(Number(row.valor_pago)).toBe(290);
  });

  test("gera 10 parcelas com mesmo grupo, numeração 1..10, competência avançando", async () => {
    const dono = await pessoa(companyUuid, "Dono");
    const im = await imovel(companyUuid, dono, "Casa 1");
    const r = await gerar.execute({
      companyUuid,
      tipo: "encargo",
      categoria: "iptu",
      imovelUuid: im,
      competencia: "2026-01-01",
      primeiroVencimento: "2026-01-31",
      valorParcela: 120,
      quantidade: 10,
      pagoEm: "2026-01-01",
    });
    expect(r.uuids).toHaveLength(10);
    const rows = await contas();
    expect(rows).toHaveLength(10);
    expect(new Set(rows.map((x: any) => x.grupo_uuid))).toEqual(new Set([r.grupoUuid]));
    expect(rows.map((x: any) => x.parcela_numero)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(rows.every((x: any) => x.parcela_total === 10 && x.pago_em === null)).toBe(true);
    expect(rows[0].competencia_txt).toBe("2026-01-01");
    expect(rows[9].competencia_txt).toBe("2026-10-01");
    expect(rows[1].vencimento_txt).toBe("2026-02-28");
  });

  test("gerar parcelas com imóvel inexistente não grava nenhuma linha", async () => {
    const e = await erro(
      gerar.execute({
        companyUuid,
        tipo: "encargo",
        categoria: "iptu",
        imovelUuid: uuid(999),
        primeiroVencimento: "2026-01-31",
        valorParcela: 120,
        quantidade: 3,
      }),
    );
    expect(e.statusCode).toBe(404);
    expect(await contas()).toHaveLength(0);
  });
  describe("Alterar, pagar, desfazer e excluir", () => {
    const nova = async (extra: Record<string, unknown> = {}) => {
      const dono = await pessoa(companyUuid, "Dono");
      const im = await imovel(companyUuid, dono, "Casa 1");
      const { uuid: id } = await incluir.execute({ companyUuid, hoje: HOJE, ...base, imovelUuid: im, ...extra });
      return { dono, im, id };
    };

    test("altera valor e categoria de conta paga mantendo o pagamento", async () => {
      const { id } = await nova({ pagoEm: "2026-11-12", valorPago: 200 });
      await alterar.execute({ companyUuid, uuid: id, valor: 300, categoria: "condominio" });
      const [row] = await contas();
      expect(Number(row.valor)).toBe(300);
      expect(row.categoria).toBe("condominio");
      expect(row.pago_em_txt).toBe("2026-11-12");
      expect(Number(row.valor_pago)).toBe(200);
    });

    test("trocar imovelUuid re-deriva o proprietário", async () => {
      const { id } = await nova();
      const outroDono = await pessoa(companyUuid, "Outro dono");
      const im2 = await imovel(companyUuid, outroDono, "Casa 2");
      await alterar.execute({ companyUuid, uuid: id, imovelUuid: im2 });
      const [row] = await contas();
      expect(row.imovel_uuid).toBe(im2);
      expect(row.proprietario_uuid).toBe(outroDono);
    });

    test("alterar outros campos não reescreve o proprietário gravado quando o imóvel mudou de dono", async () => {
      const { id, dono, im } = await nova();
      const novoDono = await pessoa(companyUuid, "Novo dono");
      await alterarImovel.execute({ companyUuid, uuid: im, proprietarioUuid: novoDono });
      await alterar.execute({ companyUuid, uuid: id, observacoes: "ajuste", imovelUuid: im });
      const [row] = await contas();
      expect(row.observacoes).toBe("ajuste");
      expect(row.proprietario_uuid).toBe(dono);
    });

    test("trocar imovelUuid depois do imóvel mudar de dono re-deriva do novo imóvel", async () => {
      const { id, im } = await nova();
      const novoDono = await pessoa(companyUuid, "Novo dono");
      await alterarImovel.execute({ companyUuid, uuid: im, proprietarioUuid: novoDono });
      const im2 = await imovel(companyUuid, novoDono, "Casa 2");
      await alterar.execute({ companyUuid, uuid: id, imovelUuid: im2 });
      const [row] = await contas();
      expect(row.proprietario_uuid).toBe(novoDono);
    });

    test("imovelUuid null com proprietarioUuid passa a ser conta sem imóvel", async () => {
      const { id, dono } = await nova();
      await alterar.execute({ companyUuid, uuid: id, imovelUuid: null, proprietarioUuid: dono });
      const [row] = await contas();
      expect(row.imovel_uuid).toBeNull();
      expect(row.proprietario_uuid).toBe(dono);
    });

    test("imovelUuid null sem proprietarioUuid -> 400 MSG_INFORME_PROPRIETARIO", async () => {
      const { id } = await nova();
      const e = await erro(alterar.execute({ companyUuid, uuid: id, imovelUuid: null }));
      expect(e.message).toBe(MSG_INFORME_PROPRIETARIO);
      expect(e.statusCode).toBe(400);
    });

    test("trocar imóvel mantendo contrato do imóvel antigo -> 400 MSG_CONTRATO_OUTRO_IMOVEL", async () => {
      const { id, im, dono } = await nova();
      const inq = await pessoa(companyUuid, "Inq", false);
      const ct = await contrato(companyUuid, im, inq);
      await alterar.execute({ companyUuid, uuid: id, contratoUuid: ct });
      const im2 = await imovel(companyUuid, dono, "Casa 2");
      const e = await erro(alterar.execute({ companyUuid, uuid: id, imovelUuid: im2 }));
      expect(e.message).toBe(MSG_CONTRATO_OUTRO_IMOVEL);
      expect(e.statusCode).toBe(400);
    });

    test("conta inexistente ou de outra empresa -> 404", async () => {
      const { id } = await nova();
      expect((await erro(alterar.execute({ companyUuid: companyUuidB, uuid: id, valor: 1 }))).statusCode).toBe(404);
      expect((await erro(alterar.execute({ companyUuid, uuid: uuid(998), valor: 1 }))).statusCode).toBe(404);
    });

    test("PATCH não altera grupo_uuid, parcela_numero, pago_em", async () => {
      const dono = await pessoa(companyUuid, "Dono");
      const im = await imovel(companyUuid, dono, "Casa 1");
      const r = await gerar.execute({
        companyUuid,
        tipo: "encargo",
        categoria: "iptu",
        imovelUuid: im,
        primeiroVencimento: "2026-01-31",
        valorParcela: 120,
        quantidade: 3,
      });
      const [antes] = await contas();
      await alterar.execute({
        companyUuid,
        uuid: antes.uuid,
        grupoUuid: uuid(900),
        parcelaNumero: 9,
        parcelaTotal: 9,
        pagoEm: "2026-01-01",
        valorPago: 5,
        valor: 130,
      });
      const [depois] = await contas();
      expect(depois.grupo_uuid).toBe(r.grupoUuid);
      expect(depois.parcela_numero).toBe(1);
      expect(depois.parcela_total).toBe(3);
      expect(depois.pago_em).toBeNull();
      expect(depois.valor_pago).toBeNull();
      expect(Number(depois.valor)).toBe(130);
    });

    test("registrar pagamento com valorPago 0 e desfazer", async () => {
      const { id } = await nova();
      await pagamento.registrar({ companyUuid, uuid: id, hoje: HOJE, pagoEm: "2026-11-20", valorPago: 0 });
      let [row] = await contas();
      expect(row.pago_em_txt).toBe("2026-11-20");
      expect(Number(row.valor_pago)).toBe(0);
      await pagamento.desfazer({ companyUuid, uuid: id });
      [row] = await contas();
      expect(row.pago_em).toBeNull();
      expect(row.valor_pago).toBeNull();
    });

    test("registrar sem valorPago usa o valor da conta; data futura -> 400", async () => {
      const { id } = await nova();
      expect((await erro(pagamento.registrar({ companyUuid, uuid: id, hoje: HOJE, pagoEm: "2026-11-25" }))).statusCode).toBe(400);
      await pagamento.registrar({ companyUuid, uuid: id, hoje: HOJE, pagoEm: HOJE });
      const [row] = await contas();
      expect(Number(row.valor_pago)).toBe(250.5);
    });

    test("registrar em conta paga -> 409; desfazer em conta aberta -> 409", async () => {
      const { id } = await nova();
      const e1 = await erro(pagamento.desfazer({ companyUuid, uuid: id }));
      expect(e1).toMatchObject({ message: MSG_CONTA_NAO_PAGA, statusCode: 409 });
      await pagamento.registrar({ companyUuid, uuid: id, hoje: HOJE, pagoEm: HOJE });
      const e2 = await erro(pagamento.registrar({ companyUuid, uuid: id, hoje: HOJE, pagoEm: HOJE }));
      expect(e2).toMatchObject({ message: MSG_CONTA_JA_PAGA, statusCode: 409 });
    });

    test("excluir conta marca deleted_at na conta e nos anexos", async () => {
      const { id } = await nova();
      await dataSource.query(
        `INSERT INTO imovel_conta_anexos (uuid, company_uuid, conta_uuid, tipo, nome_arquivo, caminho, content_type, tamanho)
         VALUES ($1, $2, $3, 'documento', 'a.pdf', 'x/a.pdf', 'application/pdf', 10)`,
        [uuid(901), companyUuid, id],
      );
      await deletar.execute({ companyUuid, uuid: id });
      const [conta] = await dataSource.query(`SELECT deleted_at FROM imovel_contas WHERE uuid = $1`, [id]);
      const [anexo] = await dataSource.query(`SELECT deleted_at FROM imovel_conta_anexos WHERE uuid = $1`, [uuid(901)]);
      expect(conta.deleted_at).not.toBeNull();
      expect(anexo.deleted_at).not.toBeNull();
      expect((await erro(deletar.execute({ companyUuid, uuid: id }))).statusCode).toBe(404);
      expect((await erro(alterar.execute({ companyUuid, uuid: id, valor: 1 }))).statusCode).toBe(404);
    });

    test("corrida: incluir conta e excluir imóvel em paralelo -> exatamente um sucesso", async () => {
      const dono = await pessoa(companyUuid, "Dono");
      for (let i = 0; i < 10; i++) {
        const im = await imovel(companyUuid, dono, `Corrida ${i}`);
        const [inc, exc] = await Promise.allSettled([
          incluir.execute({ companyUuid, hoje: HOJE, ...base, imovelUuid: im }),
          deletarImovel.execute({ companyUuid, uuid: im }),
        ]);
        expect([inc.status, exc.status].sort()).toEqual(["fulfilled", "rejected"]);
        const [{ n }] = await dataSource.query(`SELECT count(*)::int AS n FROM imovel_contas WHERE imovel_uuid = $1 AND deleted_at IS NULL`, [im]);
        const [{ apagado }] = await dataSource.query(`SELECT deleted_at IS NOT NULL AS apagado FROM imovel_imoveis WHERE uuid = $1`, [im]);
        if (inc.status === "fulfilled") {
          expect(apagado).toBe(false);
          expect(n).toBe(1);
        } else {
          expect(apagado).toBe(true);
          expect(n).toBe(0);
        }
      }
    });
  });
});
