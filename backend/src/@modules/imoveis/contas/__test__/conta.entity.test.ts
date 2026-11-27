import { ApiError } from "src/@modules/shared/apiError";
import {
  MSG_CATEGORIA_INVALIDA,
  MSG_COMPETENCIA_INVALIDA,
  MSG_CONTRATO_SEM_IMOVEL,
  MSG_ESFERA_INVALIDA,
  MSG_ESFERA_SO_GUIA,
  MSG_INFORME_DESCRICAO,
  MSG_INFORME_ESFERA,
  MSG_INQUILINO_SEM_CONTRATO,
  MSG_PAGO_EM_FUTURO,
  MSG_PAGO_EM_INVALIDO,
  MSG_RESPONSAVEL_INVALIDO,
  MSG_TIPO_INVALIDO,
  MSG_VALOR_INVALIDO,
  MSG_VALOR_PAGO_INVALIDO,
  MSG_VENCIMENTO_INVALIDO,
  avancarCompetencia,
  calcularVencimentosParcelas,
  situacaoConta,
  validarDadosConta,
  validarPagamento,
} from "../conta.entity";
import { MSG_IMOVEL_NAO_ENCONTRADO } from "../../contratos/contrato.entity";

const IMOVEL = "11111111-1111-4111-8111-111111111111";
const CONTRATO = "22222222-2222-4222-8222-222222222222";
const base = { tipo: "encargo", categoria: "iptu", vencimento: "2026-12-10", valor: 180, imovelUuid: IMOVEL };

function erro(fn: () => unknown): ApiError {
  try {
    fn();
  } catch (e) {
    return e as ApiError;
  }
  throw new Error("não lançou");
}

describe("validarDadosConta", () => {
  it("aceita encargo IPTU com imóvel", () => {
    const d = validarDadosConta(base);
    expect(d).toMatchObject({
      tipo: "encargo",
      categoria: "iptu",
      esfera: null,
      responsavel: "proprietario",
      imovelUuid: IMOVEL,
      contratoUuid: null,
      proprietarioUuid: null,
      valor: 180,
      competencia: null,
    });
  });
  it("rejeita tipo inválido", () => {
    expect(erro(() => validarDadosConta({ ...base, tipo: "x" })).message).toBe(MSG_TIPO_INVALIDO);
  });
  it("rejeita categoria de outro tipo", () => {
    expect(erro(() => validarDadosConta({ ...base, tipo: "encargo", categoria: "darf" })).message).toBe(MSG_CATEGORIA_INVALIDA);
  });
  it("exige esfera em guia", () => {
    expect(erro(() => validarDadosConta({ ...base, tipo: "guia", categoria: "darf" })).message).toBe(MSG_INFORME_ESFERA);
  });
  it("aceita guia com esfera", () => {
    expect(validarDadosConta({ ...base, tipo: "guia", categoria: "darf", esfera: "federal" }).esfera).toBe("federal");
  });
  it("rejeita esfera inválida em guia", () => {
    expect(erro(() => validarDadosConta({ ...base, tipo: "guia", categoria: "darf", esfera: "x" })).message).toBe(MSG_ESFERA_INVALIDA);
  });
  it("rejeita esfera fora de guia", () => {
    expect(erro(() => validarDadosConta({ ...base, esfera: "federal" })).message).toBe(MSG_ESFERA_SO_GUIA);
  });
  it("exige descrição em 'outros'", () => {
    expect(erro(() => validarDadosConta({ ...base, categoria: "outros" })).message).toBe(MSG_INFORME_DESCRICAO);
    expect(erro(() => validarDadosConta({ ...base, categoria: "outros", descricao: "  " })).message).toBe(MSG_INFORME_DESCRICAO);
    expect(validarDadosConta({ ...base, categoria: "outros", descricao: " Taxa x " }).descricao).toBe("Taxa x");
  });
  it("rejeita contrato sem imóvel", () => {
    expect(erro(() => validarDadosConta({ ...base, imovelUuid: undefined, contratoUuid: CONTRATO })).message).toBe(MSG_CONTRATO_SEM_IMOVEL);
  });
  it("aceita contrato com imóvel e inquilino pagando", () => {
    const d = validarDadosConta({ ...base, contratoUuid: CONTRATO, responsavel: "inquilino" });
    expect(d.contratoUuid).toBe(CONTRATO);
    expect(d.responsavel).toBe("inquilino");
  });
  it("exige contrato quando o inquilino paga", () => {
    expect(erro(() => validarDadosConta({ ...base, responsavel: "inquilino" })).message).toBe(MSG_INQUILINO_SEM_CONTRATO);
  });
  it("rejeita responsável inválido", () => {
    expect(erro(() => validarDadosConta({ ...base, responsavel: "x" })).message).toBe(MSG_RESPONSAVEL_INVALIDO);
  });
  it.each(["180,00", -1, 0, "", true, null])("rejeita valor %p", (valor) => {
    expect(erro(() => validarDadosConta({ ...base, valor })).message).toBe(MSG_VALOR_INVALIDO);
  });
  it("rejeita valor acima do limite", () => {
    expect(erro(() => validarDadosConta({ ...base, valor: 1e10 })).message).toBe(MSG_VALOR_INVALIDO);
  });
  it("rejeita valor que arredonda para 1e10", () => {
    expect(erro(() => validarDadosConta({ ...base, valor: 9999999999.996 })).message).toBe(MSG_VALOR_INVALIDO);
  });
  it("aceita valor '180.5' e arredonda para 180.5", () => {
    expect(validarDadosConta({ ...base, valor: "180.5" }).valor).toBe(180.5);
    expect(validarDadosConta({ ...base, valor: 10.126 }).valor).toBe(10.13);
  });
  it("normaliza competência 2026-03-15 para 2026-03-01", () => {
    expect(validarDadosConta({ ...base, competencia: "2026-03-15" }).competencia).toBe("2026-03-01");
  });
  it("rejeita competência inválida", () => {
    expect(erro(() => validarDadosConta({ ...base, competencia: "2026-02-30" })).message).toBe(MSG_COMPETENCIA_INVALIDA);
  });
  it("rejeita vencimento 2026-02-30", () => {
    expect(erro(() => validarDadosConta({ ...base, vencimento: "2026-02-30" })).message).toBe(MSG_VENCIMENTO_INVALIDO);
  });
  it("uuid malformado de imóvel vira 404", () => {
    const e = erro(() => validarDadosConta({ ...base, imovelUuid: "abc" }));
    expect(e.statusCode).toBe(404);
    expect(e.message).toBe(MSG_IMOVEL_NAO_ENCONTRADO);
  });
  it("não exige proprietário", () => {
    expect(validarDadosConta({ ...base, imovelUuid: undefined }).proprietarioUuid).toBeNull();
  });
});

describe("validarPagamento", () => {
  it("valorPago padrão é o valor da conta", () => {
    expect(validarPagamento({ pagoEm: "2026-11-20" }, 180, "2026-11-26")).toEqual({ pagoEm: "2026-11-20", valorPago: 180 });
  });
  it("aceita valorPago 0", () => {
    expect(validarPagamento({ pagoEm: "2026-11-20", valorPago: 0 }, 180, "2026-11-26").valorPago).toBe(0);
  });
  it("aceita pagoEm igual a hoje", () => {
    expect(validarPagamento({ pagoEm: "2026-11-26" }, 180, "2026-11-26").pagoEm).toBe("2026-11-26");
  });
  it("rejeita pagoEm depois de hoje", () => {
    expect(erro(() => validarPagamento({ pagoEm: "2026-11-27" }, 180, "2026-11-26")).message).toBe(MSG_PAGO_EM_FUTURO);
  });
  it("rejeita pagoEm inválido", () => {
    expect(erro(() => validarPagamento({ pagoEm: "x" }, 180, "2026-11-26")).message).toBe(MSG_PAGO_EM_INVALIDO);
  });
  it.each(["10,5", -1, true, "abc"])("rejeita valorPago %p", (valorPago) => {
    expect(erro(() => validarPagamento({ pagoEm: "2026-11-20", valorPago }, 180, "2026-11-26")).message).toBe(MSG_VALOR_PAGO_INVALIDO);
  });
});

describe("calcularVencimentosParcelas", () => {
  it("31/01/2027 x3 -> ['2027-01-31','2027-02-28','2027-03-31']", () => {
    expect(calcularVencimentosParcelas("2027-01-31", 3)).toEqual(["2027-01-31", "2027-02-28", "2027-03-31"]);
  });
  it("31/01/2028 x2 -> ['2028-01-31','2028-02-29']", () => {
    expect(calcularVencimentosParcelas("2028-01-31", 2)).toEqual(["2028-01-31", "2028-02-29"]);
  });
  it("10/11/2026 x3 cruza o ano -> ['2026-11-10','2026-12-10','2027-01-10']", () => {
    expect(calcularVencimentosParcelas("2026-11-10", 3)).toEqual(["2026-11-10", "2026-12-10", "2027-01-10"]);
  });
});

describe("avancarCompetencia", () => {
  it("avança meses cruzando o ano", () => {
    expect(avancarCompetencia("2026-11-01", 3)).toBe("2027-02-01");
    expect(avancarCompetencia("2026-11-01", 0)).toBe("2026-11-01");
  });
});

describe("situacaoConta", () => {
  it("paga quando pagoEm preenchido, mesmo vencida", () => {
    expect(situacaoConta({ pagoEm: "2026-01-02", vencimento: "2026-01-01" }, "2026-11-26")).toBe("paga");
  });
  it("vencida quando vencimento < hoje", () => {
    expect(situacaoConta({ pagoEm: null, vencimento: "2026-11-25" }, "2026-11-26")).toBe("vencida");
  });
  it("a_pagar quando vencimento == hoje", () => {
    expect(situacaoConta({ pagoEm: null, vencimento: "2026-11-26" }, "2026-11-26")).toBe("a_pagar");
  });
});
