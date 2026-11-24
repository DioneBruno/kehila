import dataSource from "src/@infra/database/datasource";
import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import { ImoveisQuery } from "../../imoveis.query";
import { IncluirPessoaUsecase } from "../../pessoas/incluirPessoa/incluirPessoa.usecase";
import { IncluirPessoaRepository } from "../../pessoas/incluirPessoa/incluirPessoaRepository";
import { DeletarPessoaUsecase } from "../../pessoas/deletarPessoa/deletarPessoa.usecase";
import { DeletarPessoaRepository } from "../../pessoas/deletarPessoa/deletarPessoaRepository";
import { IncluirImovelUsecase } from "../../imoveis/incluirImovel/incluirImovel.usecase";
import { IncluirImovelRepository } from "../../imoveis/incluirImovel/incluirImovelRepository";
import { AlterarImovelUsecase } from "../../imoveis/alterarImovel/alterarImovel.usecase";
import { AlterarImovelRepository } from "../../imoveis/alterarImovel/alterarImovelRepository";
import { DeletarImovelUsecase } from "../../imoveis/deletarImovel/deletarImovel.usecase";
import { DeletarImovelRepository } from "../../imoveis/deletarImovel/deletarImovelRepository";
import { IncluirContratoUsecase } from "../incluirContrato/incluirContrato.usecase";
import { IncluirContratoRepository } from "../incluirContrato/incluirContratoRepository";
import { AlterarContratoUsecase } from "../alterarContrato/alterarContrato.usecase";
import { AlterarContratoRepository } from "../alterarContrato/alterarContratoRepository";
import { RegistrarEventoContratoUsecase } from "../registrarEventoContrato/registrarEventoContrato.usecase";
import { RegistrarEventoContratoRepository } from "../registrarEventoContrato/registrarEventoContratoRepository";

const companyUuid = "b0a30000-0000-4000-8000-000000000a01";
const companyUuidB = "b0a30000-0000-4000-8000-000000000b01";
const userUuid = "b0a30000-0000-4000-8000-000000000e01";

const MSG_NAO_LIVRE = "Imóvel não está livre para locação";
const MSG_EXCLUIR_PESSOA = "Não é possível excluir: a pessoa é proprietária de imóvel ou parte de contrato vigente";

let incluirPessoa: IncluirPessoaUsecase;
let deletarPessoa: DeletarPessoaUsecase;
let incluirImovel: IncluirImovelUsecase;
let alterarImovel: AlterarImovelUsecase;
let deletarImovel: DeletarImovelUsecase;
let incluir: IncluirContratoUsecase;
let alterar: AlterarContratoUsecase;
let registrar: RegistrarEventoContratoUsecase;
let query: ImoveisQuery;

let dono: string;
let inquilino: string;
let fiador: string;
let inquilino2: string;
let estranho: string;
let imovel: string;
let imovelB: string;

const linhaContrato = async (uuid: string) =>
  (
    await dataSource.query(
      `SELECT status, valor_aluguel::float8 AS valor, TO_CHAR(fim, 'YYYY-MM-DD') AS fim, TO_CHAR(encerrado_em, 'YYYY-MM-DD') AS "encerradoEm",
              mes_reajuste, multa_atraso_pct::float8 AS multa, juros_mes_pct::float8 AS juros, observacoes, fiador_uuid
       FROM imovel_contratos WHERE uuid = $1`,
      [uuid],
    )
  )[0];
const situacaoImovel = async (uuid: string) => (await dataSource.query(`SELECT situacao FROM imovel_imoveis WHERE uuid = $1`, [uuid]))[0].situacao;
const flags = async (uuid: string) => (await dataSource.query(`SELECT eh_inquilino, eh_fiador FROM imovel_pessoas WHERE uuid = $1`, [uuid]))[0];
const vigentes = async (imovelUuid: string) =>
  (
    await dataSource.query(`SELECT COUNT(*)::int AS n FROM imovel_contratos WHERE imovel_uuid = $1 AND status = 'vigente' AND deleted_at IS NULL`, [
      imovelUuid,
    ])
  )[0].n;

/** CNPJ válido a partir de um número (para criar várias pessoas nos testes de corrida). */
function cnpj(n: number): string {
  const base = `${String(n).padStart(8, "0")}0001`.split("").map(Number);
  const dv = (d: number[]) => {
    const pesos = d.length === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const r = d.reduce((acc, x, i) => acc + x * pesos[i], 0) % 11;
    return r < 2 ? 0 : 11 - r;
  };
  base.push(dv(base));
  base.push(dv(base));
  return base.join("");
}

const base = (extra: object = {}) => ({
  companyUuid,
  imovelUuid: imovel,
  inquilinoUuid: inquilino,
  inicio: "2026-03-15",
  fim: "2027-03-14",
  valorAluguel: 2000,
  diaVencimento: 10,
  indiceReajuste: "IGPM" as const,
  garantiaTipo: "nenhuma" as const,
  ...extra,
});

const evento = (contratoUuid: string, extra: Record<string, any>): any => ({
  companyUuid,
  userUuid,
  contratoUuid,
  data: "2027-03-01",
  descricao: "Evento de teste",
  ...extra,
});

describe("Contratos do módulo imóveis", () => {
  beforeAll(async () => {
    await dataSource.initialize();
    for (const [uuid, tenant] of [
      [companyUuid, "test-contratos-a"],
      [companyUuidB, "test-contratos-b"],
    ]) {
      await dataSource.query(
        `INSERT INTO auth_companies (uuid, tenant_id, name, cpf_cnpj) VALUES ($1, $2, 'Empresa Teste Contratos', '00000000000000') ON CONFLICT DO NOTHING`,
        [uuid, tenant],
      );
    }
    await dataSource.query(`INSERT INTO auth_users (uuid, name) VALUES ($1, 'Usuário Teste Contratos') ON CONFLICT DO NOTHING`, [userUuid]);
    const connections = new ConnectionHub({ database: dataSource });
    incluirPessoa = new IncluirPessoaUsecase(new IncluirPessoaRepository(connections));
    deletarPessoa = new DeletarPessoaUsecase(new DeletarPessoaRepository(connections));
    incluirImovel = new IncluirImovelUsecase(new IncluirImovelRepository(connections));
    alterarImovel = new AlterarImovelUsecase(new AlterarImovelRepository(connections));
    deletarImovel = new DeletarImovelUsecase(new DeletarImovelRepository(connections));
    incluir = new IncluirContratoUsecase(new IncluirContratoRepository(connections));
    alterar = new AlterarContratoUsecase(new AlterarContratoRepository(connections));
    registrar = new RegistrarEventoContratoUsecase(new RegistrarEventoContratoRepository(connections));
    query = new ImoveisQuery(connections);
  });

  const limpar = async () => {
    for (const tabela of ["imovel_contrato_eventos", "imovel_contratos", "imovel_imoveis", "imovel_pessoas"]) {
      await dataSource.query(`DELETE FROM ${tabela} WHERE company_uuid IN ($1, $2)`, [companyUuid, companyUuidB]);
    }
  };

  afterAll(async () => {
    await limpar();
    await dataSource.query(`DELETE FROM auth_users WHERE uuid = $1`, [userUuid]);
    await dataSource.query(`DELETE FROM auth_companies WHERE uuid IN ($1, $2)`, [companyUuid, companyUuidB]);
    await dataSource.destroy();
  });

  beforeEach(async () => {
    dono = (await incluirPessoa.execute({ companyUuid, tipo: "PF", documento: "12345678909", nome: "Dona Maria" })).uuid;
    inquilino = (await incluirPessoa.execute({ companyUuid, tipo: "PF", documento: "52998224725", nome: "Inquilino Pedro" })).uuid;
    fiador = (await incluirPessoa.execute({ companyUuid, tipo: "PF", documento: "93541134780", nome: "Fiador Paulo" })).uuid;
    inquilino2 = (await incluirPessoa.execute({ companyUuid, tipo: "PF", documento: "39053344705", nome: "Inquilina Ana" })).uuid;
    estranho = (await incluirPessoa.execute({ companyUuid: companyUuidB, tipo: "PF", documento: "11144477735", nome: "Estranho" })).uuid;
    imovel = (
      await incluirImovel.execute({ companyUuid, proprietarioUuid: dono, identificacao: "Ap 302", tipo: "apartamento", finalidade: "residencial" })
    ).uuid;
    imovelB = (
      await incluirImovel.execute({
        companyUuid: companyUuidB,
        proprietarioUuid: estranho,
        identificacao: "Casa B",
        tipo: "casa",
        finalidade: "residencial",
      })
    ).uuid;
  });

  afterEach(limpar);

  describe("Incluir", () => {
    test("Deve incluir contrato: imóvel vira alugado, inquilino/fiador recebem flags, defaults de reajuste, multa e juros", async () => {
      expect(await flags(inquilino)).toEqual({ eh_inquilino: false, eh_fiador: false });
      const { uuid } = await incluir.execute(base({ garantiaTipo: "fiador", fiadorUuid: fiador }));
      const c = await linhaContrato(uuid);
      expect(c.status).toBe("vigente");
      expect(c.mes_reajuste).toBe(3);
      expect(c.multa).toBe(2);
      expect(c.juros).toBe(1);
      expect(c.fiador_uuid).toBe(fiador);
      expect(await situacaoImovel(imovel)).toBe("alugado");
      expect((await flags(inquilino)).eh_inquilino).toBe(true);
      expect((await flags(fiador)).eh_fiador).toBe(true);
    });

    test("Índice 'nenhum' sem mês deixa mes_reajuste nulo; mês e percentuais informados são respeitados", async () => {
      const { uuid } = await incluir.execute(base({ indiceReajuste: "nenhum" }));
      expect((await linhaContrato(uuid)).mes_reajuste).toBeNull();
      await registrar.execute(evento(uuid, { tipo: "encerramento" }));
      const { uuid: outro } = await incluir.execute(base({ mesReajuste: 7, multaAtrasoPct: 10, jurosMesPct: 0.5 }));
      const c = await linhaContrato(outro);
      expect(c.mes_reajuste).toBe(7);
      expect(c.multa).toBe(10);
      expect(c.juros).toBe(0.5);
    });

    test("Imóvel em reforma deve dar 409 'Imóvel não está livre para locação'", async () => {
      await alterarImovel.execute({ companyUuid, uuid: imovel, situacao: "reforma" });
      await expect(incluir.execute(base())).rejects.toMatchObject({ message: MSG_NAO_LIVRE, statusCode: 409 });
    });

    test("Deve validar inquilino x proprietário, fiador, datas, vencimento, índice e valores", async () => {
      await expect(incluir.execute(base({ inquilinoUuid: dono }))).rejects.toMatchObject({
        message: "Inquilino não pode ser o proprietário do imóvel",
      });
      await expect(incluir.execute(base({ garantiaTipo: "fiador" }))).rejects.toMatchObject({ message: "Informe o fiador" });
      await expect(incluir.execute(base({ garantiaTipo: "fiador", fiadorUuid: inquilino }))).rejects.toMatchObject({
        message: "Fiador não pode ser o inquilino",
      });
      await expect(incluir.execute(base({ fim: "2026-03-15" }))).rejects.toMatchObject({ message: "A data de fim deve ser posterior ao início" });
      await expect(incluir.execute(base({ diaVencimento: 32 }))).rejects.toMatchObject({ message: "Dia de vencimento inválido" });
      await expect(incluir.execute(base({ diaVencimento: 0 }))).rejects.toMatchObject({ message: "Dia de vencimento inválido" });
      await expect(incluir.execute(base({ indiceReajuste: "XPTO" }))).rejects.toMatchObject({ message: "Índice de reajuste inválido" });
      await expect(incluir.execute(base({ valorAluguel: -1 }))).rejects.toMatchObject({ statusCode: 400 });
      await expect(incluir.execute(base({ inicio: "2026-02-30" }))).rejects.toMatchObject({ statusCode: 400 });
      expect(await situacaoImovel(imovel)).toBe("livre");
      expect((await flags(inquilino)).eh_inquilino).toBe(false);
    });

    test("Imóvel/inquilino/fiador de outra empresa ou uuid malformado devem dar 404 sem gravar nada", async () => {
      await expect(incluir.execute(base({ imovelUuid: imovelB }))).rejects.toMatchObject({ message: "Imóvel não encontrado", statusCode: 404 });
      await expect(incluir.execute(base({ imovelUuid: "nao-e-uuid" }))).rejects.toMatchObject({ message: "Imóvel não encontrado", statusCode: 404 });
      await expect(incluir.execute(base({ inquilinoUuid: estranho }))).rejects.toMatchObject({
        message: "Inquilino não encontrado",
        statusCode: 404,
      });
      await expect(incluir.execute(base({ inquilinoUuid: "x" }))).rejects.toMatchObject({ message: "Inquilino não encontrado", statusCode: 404 });
      await expect(incluir.execute(base({ garantiaTipo: "fiador", fiadorUuid: estranho }))).rejects.toMatchObject({
        message: "Fiador não encontrado",
        statusCode: 404,
      });
      await expect(incluir.execute(base({ garantiaTipo: "fiador", fiadorUuid: "y" }))).rejects.toMatchObject({ statusCode: 404 });
      expect(await situacaoImovel(imovel)).toBe("livre");
      expect((await flags(inquilino)).eh_inquilino).toBe(false);
      expect(await vigentes(imovel)).toBe(0);
    });

    test("Concorrência: dois contratos simultâneos no mesmo imóvel -> exatamente 1 vigente", async () => {
      const resultados = await Promise.allSettled([incluir.execute(base()), incluir.execute(base({ inquilinoUuid: inquilino2 }))]);
      expect(resultados.filter((r) => r.status === "fulfilled")).toHaveLength(1);
      const rejeitados = resultados.filter((r): r is PromiseRejectedResult => r.status === "rejected");
      expect(rejeitados).toHaveLength(1);
      expect(rejeitados[0].reason).toMatchObject({ message: MSG_NAO_LIVRE, statusCode: 409 });
      expect(await vigentes(imovel)).toBe(1);
    });

    test("Índice único parcial (rede de segurança) deve virar o mesmo 409", async () => {
      const { uuid } = await incluir.execute(base());
      // Simula inconsistência: imóvel voltou a 'livre' por fora, mas o contrato continua vigente.
      await dataSource.query(`UPDATE imovel_imoveis SET situacao = 'livre' WHERE uuid = $1`, [imovel]);
      await expect(incluir.execute(base({ inquilinoUuid: inquilino2 }))).rejects.toMatchObject({ message: MSG_NAO_LIVRE, statusCode: 409 });
      expect(await vigentes(imovel)).toBe(1);
      expect((await linhaContrato(uuid)).status).toBe("vigente");
    });
  });

  describe("Eventos", () => {
    test("Renovação atualiza fim e valor do contrato e grava anterior/novo no evento", async () => {
      const { uuid } = await incluir.execute(base());
      const { uuid: eventoUuid } = await registrar.execute(evento(uuid, { tipo: "renovacao", fimNovo: "2028-03-14", valorNovo: 2100 }));
      const c = await linhaContrato(uuid);
      expect(c.fim).toBe("2028-03-14");
      expect(c.valor).toBe(2100);
      expect(c.status).toBe("vigente");
      const [ev] = await dataSource.query(
        `SELECT tipo, valor_anterior::float8 AS va, valor_novo::float8 AS vn, TO_CHAR(fim_anterior, 'YYYY-MM-DD') AS fa,
                TO_CHAR(fim_novo, 'YYYY-MM-DD') AS fn, criado_por_uuid, company_uuid FROM imovel_contrato_eventos WHERE uuid = $1`,
        [eventoUuid],
      );
      expect(ev).toEqual({
        tipo: "renovacao",
        va: 2000,
        vn: 2100,
        fa: "2027-03-14",
        fn: "2028-03-14",
        criado_por_uuid: userUuid,
        company_uuid: companyUuid,
      });
    });

    test("Renovação sem estender o fim deve dar erro", async () => {
      const { uuid } = await incluir.execute(base());
      await expect(registrar.execute(evento(uuid, { tipo: "renovacao", fimNovo: "2027-03-14" }))).rejects.toMatchObject({
        message: "A renovação deve estender a data de fim",
      });
      await expect(registrar.execute(evento(uuid, { tipo: "renovacao", valorNovo: 3000 }))).rejects.toMatchObject({
        message: "A renovação deve estender a data de fim",
      });
      expect((await linhaContrato(uuid)).valor).toBe(2000);
    });

    test("Aditivo só com valorNovo mantém o fim; aditivo pode encurtar o fim (desde que > início)", async () => {
      const { uuid } = await incluir.execute(base());
      await registrar.execute(evento(uuid, { tipo: "aditivo", valorNovo: 1800 }));
      let c = await linhaContrato(uuid);
      expect(c.valor).toBe(1800);
      expect(c.fim).toBe("2027-03-14");

      await expect(registrar.execute(evento(uuid, { tipo: "aditivo" }))).rejects.toMatchObject({
        message: "Informe o novo valor ou a nova data de fim",
      });
      await expect(registrar.execute(evento(uuid, { tipo: "aditivo", fimNovo: "2026-03-15" }))).rejects.toMatchObject({
        message: "A data de fim deve ser posterior ao início",
      });
      await registrar.execute(evento(uuid, { tipo: "aditivo", fimNovo: "2026-12-31" }));
      c = await linhaContrato(uuid);
      expect(c.fim).toBe("2026-12-31");
      expect(c.valor).toBe(1800);
    });

    test("Deve validar tipo, data e descrição do evento", async () => {
      const { uuid } = await incluir.execute(base());
      await expect(registrar.execute(evento(uuid, { tipo: "xyz" }))).rejects.toMatchObject({ statusCode: 400 });
      await expect(registrar.execute(evento(uuid, { tipo: "encerramento", data: "31/12/2026" }))).rejects.toMatchObject({ statusCode: 400 });
      await expect(registrar.execute(evento(uuid, { tipo: "encerramento", descricao: "  " }))).rejects.toMatchObject({ statusCode: 400 });
      expect((await linhaContrato(uuid)).status).toBe("vigente");
    });

    test("Encerramento: status encerrado, encerrado_em, imóvel livre; novo contrato permitido; evento em encerrado -> 409", async () => {
      const { uuid } = await incluir.execute(base());
      await registrar.execute(evento(uuid, { tipo: "encerramento", data: "2027-03-14" }));
      const c = await linhaContrato(uuid);
      expect(c.status).toBe("encerrado");
      expect(c.encerradoEm).toBe("2027-03-14");
      expect(await situacaoImovel(imovel)).toBe("livre");

      await expect(registrar.execute(evento(uuid, { tipo: "aditivo", valorNovo: 1 }))).rejects.toMatchObject({
        message: "Contrato não está vigente",
        statusCode: 409,
      });

      const { uuid: novo } = await incluir.execute(base({ inquilinoUuid: inquilino2, inicio: "2027-04-01", fim: "2028-03-31" }));
      expect((await linhaContrato(novo)).status).toBe("vigente");
      expect(await situacaoImovel(imovel)).toBe("alugado");
      expect(await vigentes(imovel)).toBe(1);
    });

    test("Rescisão: status rescindido e imóvel livre", async () => {
      const { uuid } = await incluir.execute(base());
      await registrar.execute(evento(uuid, { tipo: "rescisao", data: "2026-09-30" }));
      const c = await linhaContrato(uuid);
      expect(c.status).toBe("rescindido");
      expect(c.encerradoEm).toBe("2026-09-30");
      expect(await situacaoImovel(imovel)).toBe("livre");
    });
  });

  describe("Alterar", () => {
    test("Alterar observações funciona; fim/valorAluguel são rejeitados", async () => {
      const { uuid } = await incluir.execute(base());
      await alterar.execute({ companyUuid, uuid, observacoes: " Chaves com o porteiro ", diaVencimento: 5 });
      const c = await linhaContrato(uuid);
      expect(c.observacoes).toBe("Chaves com o porteiro");

      const msg = "Use renovação ou aditivo para alterar valor ou data de fim";
      await expect(alterar.execute({ companyUuid, uuid, fim: "2030-01-01" } as any)).rejects.toMatchObject({ message: msg });
      await expect(alterar.execute({ companyUuid, uuid, valorAluguel: 1 } as any)).rejects.toMatchObject({ message: msg });
      await expect(alterar.execute({ companyUuid, uuid, diaVencimento: 40 })).rejects.toMatchObject({ message: "Dia de vencimento inválido" });
      const depois = await linhaContrato(uuid);
      expect(depois.fim).toBe("2027-03-14");
      expect(depois.valor).toBe(2000);
    });

    test("Trocar garantia para fiador exige fiador e liga eh_fiador; sair de fiador limpa o fiador", async () => {
      const { uuid } = await incluir.execute(base());
      await expect(alterar.execute({ companyUuid, uuid, garantiaTipo: "fiador" })).rejects.toMatchObject({ message: "Informe o fiador" });
      await expect(alterar.execute({ companyUuid, uuid, garantiaTipo: "fiador", fiadorUuid: inquilino })).rejects.toMatchObject({
        message: "Fiador não pode ser o inquilino",
      });
      await alterar.execute({ companyUuid, uuid, garantiaTipo: "fiador", fiadorUuid: fiador });
      expect((await linhaContrato(uuid)).fiador_uuid).toBe(fiador);
      expect((await flags(fiador)).eh_fiador).toBe(true);
      await alterar.execute({ companyUuid, uuid, garantiaTipo: "caucao", garantiaValor: 4000 });
      expect((await linhaContrato(uuid)).fiador_uuid).toBeNull();
    });

    test("Só contrato vigente pode ser alterado", async () => {
      const { uuid } = await incluir.execute(base());
      await registrar.execute(evento(uuid, { tipo: "encerramento" }));
      await expect(alterar.execute({ companyUuid, uuid, observacoes: "x" })).rejects.toMatchObject({
        message: "Contrato não está vigente",
        statusCode: 409,
      });
    });

    test("Isolamento: contrato de outra empresa -> 404 em alterar, eventos e consultas", async () => {
      const { uuid } = await incluir.execute(base());
      await expect(alterar.execute({ companyUuid: companyUuidB, uuid, observacoes: "x" })).rejects.toMatchObject({
        message: "Contrato não encontrado",
        statusCode: 404,
      });
      await expect(registrar.execute({ ...evento(uuid, { tipo: "encerramento" }), companyUuid: companyUuidB })).rejects.toMatchObject({
        message: "Contrato não encontrado",
        statusCode: 404,
      });
      await expect(alterar.execute({ companyUuid, uuid: "nao-e-uuid", observacoes: "x" })).rejects.toMatchObject({ statusCode: 404 });
      await expect(registrar.execute(evento("nao-e-uuid", { tipo: "encerramento" }))).rejects.toMatchObject({ statusCode: 404 });
      expect(await query.buscarContrato(companyUuidB, uuid)).toBeNull();
      expect(await query.listarEventosContrato(companyUuidB, uuid)).toBeNull();
      expect((await query.listarContratos(companyUuidB, { pagina: 1, porPagina: 20 })).total).toBe(0);
      expect((await linhaContrato(uuid)).status).toBe("vigente");
    });
  });

  describe("Bloqueios de exclusão e situação", () => {
    test("Deletar imóvel com contrato vigente -> 409; mudar situação -> 409", async () => {
      await incluir.execute(base());
      await expect(deletarImovel.execute({ companyUuid, uuid: imovel })).rejects.toMatchObject({
        message: "Não é possível excluir imóvel com contrato vigente",
        statusCode: 409,
      });
      await expect(alterarImovel.execute({ companyUuid, uuid: imovel, situacao: "reforma" })).rejects.toMatchObject({ statusCode: 409 });
    });

    test("Deletar inquilino ou fiador com contrato vigente -> 409; após encerrar, libera", async () => {
      const { uuid } = await incluir.execute(base({ garantiaTipo: "fiador", fiadorUuid: fiador }));
      await expect(deletarPessoa.execute({ companyUuid, uuid: inquilino })).rejects.toMatchObject({ message: MSG_EXCLUIR_PESSOA, statusCode: 409 });
      await expect(deletarPessoa.execute({ companyUuid, uuid: fiador })).rejects.toMatchObject({ message: MSG_EXCLUIR_PESSOA, statusCode: 409 });
      await registrar.execute(evento(uuid, { tipo: "encerramento" }));
      await deletarPessoa.execute({ companyUuid, uuid: inquilino });
      await deletarPessoa.execute({ companyUuid, uuid: fiador });
    });
  });

  describe("Consultas", () => {
    test("buscarContrato traz nomes; buscarImovel traz resumo do contrato vigente", async () => {
      const { uuid } = await incluir.execute(base({ garantiaTipo: "fiador", fiadorUuid: fiador, numero: "C-001", garantiaValor: null }));
      const c = await query.buscarContrato(companyUuid, uuid);
      expect(c).toMatchObject({
        uuid,
        numero: "C-001",
        imovelUuid: imovel,
        imovelIdentificacao: "Ap 302",
        proprietarioUuid: dono,
        proprietarioNome: "Dona Maria",
        inquilinoUuid: inquilino,
        inquilinoNome: "Inquilino Pedro",
        fiadorUuid: fiador,
        fiadorNome: "Fiador Paulo",
        inicio: "2026-03-15",
        fim: "2027-03-14",
        valorAluguel: 2000,
        diaVencimento: 10,
        indiceReajuste: "IGPM",
        mesReajuste: 3,
        multaAtrasoPct: 2,
        jurosMesPct: 1,
        garantiaTipo: "fiador",
        status: "vigente",
        encerradoEm: null,
      });

      const detalhe = await query.buscarImovel(companyUuid, imovel);
      expect(detalhe?.contratoVigente).toEqual({
        uuid,
        inquilinoNome: "Inquilino Pedro",
        valorAluguel: 2000,
        inicio: "2026-03-15",
        fim: "2027-03-14",
      });

      await registrar.execute(evento(uuid, { tipo: "encerramento" }));
      expect((await query.buscarImovel(companyUuid, imovel))?.contratoVigente).toBeNull();
    });

    test("listarContratos filtra por proprietário, imóvel, inquilino, status e busca; eventos do mais recente ao mais antigo", async () => {
      const { uuid: antigo } = await incluir.execute(base({ numero: "A-1" }));
      await registrar.execute(evento(antigo, { tipo: "aditivo", data: "2026-06-01", valorNovo: 2050 }));
      await registrar.execute(evento(antigo, { tipo: "rescisao", data: "2026-09-30" }));
      const { uuid: atual } = await incluir.execute(base({ inquilinoUuid: inquilino2, inicio: "2026-10-01", fim: "2027-09-30" }));

      const todos = await query.listarContratos(companyUuid, { pagina: 1, porPagina: 20 });
      expect(todos.total).toBe(2);
      expect((await query.listarContratos(companyUuid, { status: "vigente", pagina: 1, porPagina: 20 })).data.map((c) => c.uuid)).toEqual([atual]);
      expect((await query.listarContratos(companyUuid, { inquilinoUuid: inquilino, pagina: 1, porPagina: 20 })).data.map((c) => c.uuid)).toEqual([
        antigo,
      ]);
      expect((await query.listarContratos(companyUuid, { imovelUuid: imovel, pagina: 1, porPagina: 20 })).total).toBe(2);
      expect((await query.listarContratos(companyUuid, { proprietarioUuid: dono, pagina: 1, porPagina: 20 })).total).toBe(2);
      expect((await query.listarContratos(companyUuid, { proprietarioUuid: inquilino, pagina: 1, porPagina: 20 })).total).toBe(0);
      expect((await query.listarContratos(companyUuid, { busca: "Ana", pagina: 1, porPagina: 20 })).data.map((c) => c.uuid)).toEqual([atual]);
      expect((await query.listarContratos(companyUuid, { busca: "A-1", pagina: 1, porPagina: 20 })).data.map((c) => c.uuid)).toEqual([antigo]);
      const pagina = await query.listarContratos(companyUuid, { pagina: 2, porPagina: 1 });
      expect(pagina.total).toBe(2);
      expect(pagina.data).toHaveLength(1);

      const eventos = await query.listarEventosContrato(companyUuid, antigo);
      expect(eventos?.map((e) => e.tipo)).toEqual(["rescisao", "aditivo"]);
      expect(eventos?.[1]).toMatchObject({
        data: "2026-06-01",
        valorAnterior: 2000,
        valorNovo: 2050,
        fimAnterior: null,
        fimNovo: null,
        criadoPorNome: "Usuário Teste Contratos",
      });
      expect(await query.listarEventosContrato(companyUuid, atual)).toEqual([]);
    });
  });

  describe("Concorrência com exclusões e situação", () => {
    const RODADAS = 10;
    const novoImovel = async (identificacao: string) =>
      (await incluirImovel.execute({ companyUuid, proprietarioUuid: dono, identificacao, tipo: "casa", finalidade: "residencial" })).uuid;
    // Invariante: nenhum contrato vigente aponta para imóvel, inquilino ou fiador excluído; vigente => imóvel 'alugado'.
    const violacoes = async () =>
      (
        await dataSource.query(
          `SELECT c.uuid FROM imovel_contratos c
           JOIN imovel_imoveis i ON i.uuid = c.imovel_uuid
           JOIN imovel_pessoas inq ON inq.uuid = c.inquilino_uuid
           LEFT JOIN imovel_pessoas fia ON fia.uuid = c.fiador_uuid
           WHERE c.company_uuid = $1 AND c.status = 'vigente' AND c.deleted_at IS NULL
             AND (i.deleted_at IS NOT NULL OR inq.deleted_at IS NOT NULL OR fia.deleted_at IS NOT NULL OR i.situacao <> 'alugado')`,
          [companyUuid],
        )
      ).length;

    test("IncluirContrato x DeletarImovel simultâneos nunca deixam contrato vigente em imóvel excluído", async () => {
      for (let i = 0; i < RODADAS; i++) {
        const uuid = await novoImovel(`Corrida imóvel ${i}`);
        const [contrato, exclusao] = await Promise.allSettled([
          incluir.execute(base({ imovelUuid: uuid })),
          deletarImovel.execute({ companyUuid, uuid }),
        ]);
        // Exatamente um vence: ou o contrato (exclusão 409) ou a exclusão (contrato 404).
        expect([contrato.status, exclusao.status].sort()).toEqual(["fulfilled", "rejected"]);
      }
      expect(await violacoes()).toBe(0);
    });

    test("IncluirContrato x DeletarPessoa (inquilino/fiador) simultâneos nunca deixam contrato vigente com pessoa excluída", async () => {
      for (let i = 0; i < RODADAS; i++) {
        const uuid = await novoImovel(`Corrida pessoa ${i}`);
        const inq = (await incluirPessoa.execute({ companyUuid, tipo: "PJ", documento: cnpj(i), nome: `Inq ${i}` })).uuid;
        const alvo = i % 2 === 0 ? inq : fiador;
        const resultados = await Promise.allSettled([
          incluir.execute(base({ imovelUuid: uuid, inquilinoUuid: inq, garantiaTipo: "fiador", fiadorUuid: fiador })),
          deletarPessoa.execute({ companyUuid, uuid: alvo }),
        ]);
        expect(resultados.filter((r) => r.status === "fulfilled")).toHaveLength(1);
        // Se o fiador foi excluído, recria para a próxima rodada.
        if (alvo === fiador && resultados[1].status === "fulfilled") {
          fiador = (await incluirPessoa.execute({ companyUuid, tipo: "PJ", documento: cnpj(100 + i), nome: `Fiador ${i}` })).uuid;
        }
      }
      expect(await violacoes()).toBe(0);
    });

    test("IncluirContrato x AlterarImovel(situação) simultâneos: contrato vigente sempre com imóvel alugado", async () => {
      for (let i = 0; i < RODADAS; i++) {
        const uuid = await novoImovel(`Corrida situação ${i}`);
        await Promise.allSettled([incluir.execute(base({ imovelUuid: uuid })), alterarImovel.execute({ companyUuid, uuid, situacao: "reforma" })]);
      }
      expect(await violacoes()).toBe(0);
    });

    test("Inquilino e fiador trocados em dois contratos simultâneos não geram deadlock", async () => {
      for (let i = 0; i < RODADAS; i++) {
        const [x, y] = [await novoImovel(`Deadlock X ${i}`), await novoImovel(`Deadlock Y ${i}`)];
        const resultados = await Promise.allSettled([
          incluir.execute(base({ imovelUuid: x, inquilinoUuid: inquilino, garantiaTipo: "fiador", fiadorUuid: fiador })),
          incluir.execute(base({ imovelUuid: y, inquilinoUuid: fiador, garantiaTipo: "fiador", fiadorUuid: inquilino })),
        ]);
        expect(resultados.map((r) => (r.status === "rejected" ? String((r.reason as Error)?.message) : "ok"))).toEqual(["ok", "ok"]);
      }
    });
  });
});
