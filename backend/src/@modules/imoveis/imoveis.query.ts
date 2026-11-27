import { ConnectionHub } from "../shared/connections/connectionHub";
import {
  AnexoTipo,
  ContaEsfera,
  ContaResponsavel,
  ContaSituacao,
  ContaTipo,
  ContratoEventoTipo,
  ContratoStatus,
  GarantiaTipo,
  ImovelFinalidade,
  ImovelSituacao,
  ImovelTipo,
  IndiceReajuste,
  PessoaPapel,
  PessoaTipo,
} from "./shared/imoveis.tipos";

export type PessoaItem = {
  uuid: string;
  tipo: PessoaTipo;
  documento: string;
  nome: string;
  nomeFantasia: string | null;
  rgIe: string | null;
  email: string | null;
  telefone: string | null;
  enderecoCep: string | null;
  enderecoLogradouro: string | null;
  enderecoNumero: string | null;
  enderecoComplemento: string | null;
  enderecoBairro: string | null;
  enderecoCidade: string | null;
  enderecoUf: string | null;
  observacoes: string | null;
  ehProprietario: boolean;
  ehInquilino: boolean;
  ehFiador: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type ListarPessoasFiltro = {
  papel?: PessoaPapel;
  busca?: string;
  pagina: number;
  porPagina: number;
};

const COLUNAS_PESSOA = `
        uuid,
        tipo,
        documento,
        nome,
        nome_fantasia AS "nomeFantasia",
        rg_ie AS "rgIe",
        email,
        telefone,
        endereco_cep AS "enderecoCep",
        endereco_logradouro AS "enderecoLogradouro",
        endereco_numero AS "enderecoNumero",
        endereco_complemento AS "enderecoComplemento",
        endereco_bairro AS "enderecoBairro",
        endereco_cidade AS "enderecoCidade",
        endereco_uf AS "enderecoUf",
        observacoes,
        eh_proprietario AS "ehProprietario",
        eh_inquilino AS "ehInquilino",
        eh_fiador AS "ehFiador",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
`;

const COLUNA_PAPEL: Record<PessoaPapel, string> = {
  proprietario: "eh_proprietario",
  inquilino: "eh_inquilino",
  fiador: "eh_fiador",
};

export type ImovelListaItem = {
  uuid: string;
  proprietarioUuid: string;
  proprietarioNome: string;
  identificacao: string;
  tipo: ImovelTipo;
  finalidade: ImovelFinalidade;
  enderecoCep: string | null;
  enderecoLogradouro: string | null;
  enderecoNumero: string | null;
  enderecoComplemento: string | null;
  enderecoBairro: string | null;
  enderecoCidade: string | null;
  enderecoUf: string | null;
  inscricaoIptu: string | null;
  matricula: string | null;
  cartorio: string | null;
  areaM2: number | null;
  situacao: ImovelSituacao;
  observacoes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

/** Resumo do contrato vigente mostrado no detalhe do imóvel. */
export type ContratoVigenteResumo = {
  uuid: string;
  inquilinoNome: string;
  valorAluguel: number;
  inicio: string;
  fim: string;
};

export type ImovelDetalhe = ImovelListaItem & { contratoVigente: ContratoVigenteResumo | null };

export type ListarImoveisFiltro = {
  proprietarioUuid?: string;
  situacao?: ImovelSituacao;
  busca?: string;
  pagina: number;
  porPagina: number;
};

const COLUNAS_IMOVEL = `
        i.uuid,
        i.proprietario_uuid AS "proprietarioUuid",
        i.identificacao,
        i.tipo,
        i.finalidade,
        i.endereco_cep AS "enderecoCep",
        i.endereco_logradouro AS "enderecoLogradouro",
        i.endereco_numero AS "enderecoNumero",
        i.endereco_complemento AS "enderecoComplemento",
        i.endereco_bairro AS "enderecoBairro",
        i.endereco_cidade AS "enderecoCidade",
        i.endereco_uf AS "enderecoUf",
        i.inscricao_iptu AS "inscricaoIptu",
        i.matricula,
        i.cartorio,
        i.area_m2::float8 AS "areaM2",
        i.situacao,
        i.observacoes,
        i.created_at AS "createdAt",
        i.updated_at AS "updatedAt"
`;

export type ContratoItem = {
  uuid: string;
  numero: string | null;
  imovelUuid: string;
  imovelIdentificacao: string;
  proprietarioUuid: string;
  proprietarioNome: string;
  inquilinoUuid: string;
  inquilinoNome: string;
  fiadorUuid: string | null;
  fiadorNome: string | null;
  inicio: string;
  fim: string;
  valorAluguel: number;
  diaVencimento: number;
  indiceReajuste: IndiceReajuste;
  mesReajuste: number | null;
  multaAtrasoPct: number;
  jurosMesPct: number;
  descontoPontualidadePct: number | null;
  multaRescisoriaMeses: number | null;
  garantiaTipo: GarantiaTipo;
  garantiaValor: number | null;
  status: ContratoStatus;
  encerradoEm: string | null;
  observacoes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ListarContratosFiltro = {
  proprietarioUuid?: string;
  imovelUuid?: string;
  inquilinoUuid?: string;
  status?: ContratoStatus;
  busca?: string;
  pagina: number;
  porPagina: number;
};

export type ContratoEventoItem = {
  uuid: string;
  contratoUuid: string;
  tipo: ContratoEventoTipo;
  data: string;
  descricao: string;
  valorAnterior: number | null;
  valorNovo: number | null;
  fimAnterior: string | null;
  fimNovo: string | null;
  criadoPorUuid: string | null;
  criadoPorNome: string | null;
  createdAt: Date;
};

const COLUNAS_CONTRATO = `
        c.uuid,
        c.numero,
        c.imovel_uuid AS "imovelUuid",
        i.identificacao AS "imovelIdentificacao",
        i.proprietario_uuid AS "proprietarioUuid",
        prop.nome AS "proprietarioNome",
        c.inquilino_uuid AS "inquilinoUuid",
        inq.nome AS "inquilinoNome",
        c.fiador_uuid AS "fiadorUuid",
        fia.nome AS "fiadorNome",
        TO_CHAR(c.inicio, 'YYYY-MM-DD') AS inicio,
        TO_CHAR(c.fim, 'YYYY-MM-DD') AS fim,
        c.valor_aluguel::float8 AS "valorAluguel",
        c.dia_vencimento AS "diaVencimento",
        c.indice_reajuste AS "indiceReajuste",
        c.mes_reajuste AS "mesReajuste",
        c.multa_atraso_pct::float8 AS "multaAtrasoPct",
        c.juros_mes_pct::float8 AS "jurosMesPct",
        c.desconto_pontualidade_pct::float8 AS "descontoPontualidadePct",
        c.multa_rescisoria_meses::float8 AS "multaRescisoriaMeses",
        c.garantia_tipo AS "garantiaTipo",
        c.garantia_valor::float8 AS "garantiaValor",
        c.status,
        TO_CHAR(c.encerrado_em, 'YYYY-MM-DD') AS "encerradoEm",
        c.observacoes,
        c.created_at AS "createdAt",
        c.updated_at AS "updatedAt"
`;

// Joins sem filtro de deleted_at: o contrato continua mostrando os nomes mesmo se a pessoa/imóvel for excluído depois.
const FROM_CONTRATO = `
  FROM imovel_contratos c
  JOIN imovel_imoveis i ON i.uuid = c.imovel_uuid
  JOIN imovel_pessoas prop ON prop.uuid = i.proprietario_uuid
  JOIN imovel_pessoas inq ON inq.uuid = c.inquilino_uuid
  LEFT JOIN imovel_pessoas fia ON fia.uuid = c.fiador_uuid
`;

export type ContratoResumo = {
  uuid: string;
  imovelIdentificacao: string;
  proprietarioNome: string;
  inquilinoNome: string;
  valorAluguel: number;
  fim: string;
  indiceReajuste: IndiceReajuste;
  mesReajuste: number | null;
};

export type ImovelLivreResumo = { uuid: string; identificacao: string; proprietarioNome: string };

export type PainelImoveis = {
  vencidos: ContratoResumo[];
  vence0a30: ContratoResumo[];
  vence31a60: ContratoResumo[];
  vence61a90: ContratoResumo[];
  reajustesMes: ContratoResumo[];
  imoveisLivres: ImovelLivreResumo[];
  contasVencidas: number;
};

export type ContaItem = {
  uuid: string;
  tipo: ContaTipo;
  categoria: string;
  esfera: ContaEsfera | null;
  descricao: string | null;
  proprietarioUuid: string;
  proprietarioNome: string;
  imovelUuid: string | null;
  imovelIdentificacao: string | null;
  contratoUuid: string | null;
  contratoNumero: string | null;
  inquilinoNome: string | null;
  responsavel: ContaResponsavel;
  competencia: string | null;
  vencimento: string;
  valor: number;
  pagoEm: string | null;
  valorPago: number | null;
  fornecedor: string | null;
  documentoNumero: string | null;
  grupoUuid: string | null;
  parcelaNumero: number | null;
  parcelaTotal: number | null;
  observacoes: string | null;
  situacao: ContaSituacao;
  createdAt: Date;
};

export type ContaAnexoItem = {
  uuid: string;
  tipo: AnexoTipo;
  nomeArquivo: string;
  contentType: string;
  tamanho: number;
  createdAt: Date;
};

export type ListarContasFiltro = {
  tipo?: ContaTipo;
  categoria?: string;
  proprietarioUuid?: string;
  imovelUuid?: string;
  contratoUuid?: string;
  situacao?: ContaSituacao;
  responsavel?: ContaResponsavel;
  vencimentoDe?: string;
  vencimentoAte?: string;
  busca?: string;
  pagina: number;
  porPagina: number;
};

export type GrupoAgenda = { total: number; soma: number; contas: ContaItem[] };
export type AgendaContas = { vencidas: GrupoAgenda; proximos7: GrupoAgenda; proximos30: GrupoAgenda };

/** `hoje` é o texto do parâmetro SQL com a data de hoje (ex.: "$2"); a situação usa ele, nunca now(). */
const situacaoSql = (hoje: string) =>
  `(CASE WHEN ct.pago_em IS NOT NULL THEN 'paga' WHEN ct.vencimento < ${hoje}::date THEN 'vencida' ELSE 'a_pagar' END)`;

const colunasConta = (hoje: string) => `
        ct.uuid,
        ct.tipo,
        ct.categoria,
        ct.esfera,
        ct.descricao,
        ct.proprietario_uuid AS "proprietarioUuid",
        prop.nome AS "proprietarioNome",
        ct.imovel_uuid AS "imovelUuid",
        i.identificacao AS "imovelIdentificacao",
        ct.contrato_uuid AS "contratoUuid",
        c.numero AS "contratoNumero",
        inq.nome AS "inquilinoNome",
        ct.responsavel,
        TO_CHAR(ct.competencia, 'YYYY-MM-DD') AS competencia,
        TO_CHAR(ct.vencimento, 'YYYY-MM-DD') AS vencimento,
        ct.valor::float8 AS valor,
        TO_CHAR(ct.pago_em, 'YYYY-MM-DD') AS "pagoEm",
        ct.valor_pago::float8 AS "valorPago",
        ct.fornecedor,
        ct.documento_numero AS "documentoNumero",
        ct.grupo_uuid AS "grupoUuid",
        ct.parcela_numero AS "parcelaNumero",
        ct.parcela_total AS "parcelaTotal",
        ct.observacoes,
        ${situacaoSql(hoje)} AS situacao,
        ct.created_at AS "createdAt"
`;

// Joins sem filtro de deleted_at: a conta continua mostrando os nomes mesmo se a pessoa/imóvel/contrato for excluído depois.
const FROM_CONTA = `
  FROM imovel_contas ct
  JOIN imovel_pessoas prop ON prop.uuid = ct.proprietario_uuid
  LEFT JOIN imovel_imoveis i ON i.uuid = ct.imovel_uuid
  LEFT JOIN imovel_contratos c ON c.uuid = ct.contrato_uuid
  LEFT JOIN imovel_pessoas inq ON inq.uuid = c.inquilino_uuid
`;

export class ImoveisQuery {
  constructor(readonly connections: ConnectionHub) {}

  async listarPessoas(companyUuid: string, filtro: ListarPessoasFiltro): Promise<{ data: PessoaItem[]; total: number }> {
    const valores: unknown[] = [companyUuid];
    let where = `deleted_at IS NULL AND company_uuid = $1`;

    if (filtro.papel) {
      const coluna = COLUNA_PAPEL[filtro.papel];
      if (!coluna) return { data: [], total: 0 };
      where += ` AND ${coluna} = true`;
    }

    const busca = filtro.busca?.trim();
    if (busca) {
      valores.push(`%${busca.replace(/[\\%_]/g, "\\$&")}%`);
      where += ` AND (nome ILIKE $${valores.length} OR nome_fantasia ILIKE $${valores.length}`;
      const digitos = busca.replace(/\D/g, "");
      if (digitos) {
        valores.push(`%${digitos}%`);
        where += ` OR documento LIKE $${valores.length}`;
      }
      where += `)`;
    }

    const [{ total }] = await this.connections.database.query(`SELECT COUNT(*)::int AS total FROM imovel_pessoas WHERE ${where}`, valores);

    const porPagina = Math.max(1, filtro.porPagina);
    const offset = (Math.max(1, filtro.pagina) - 1) * porPagina;
    const data: PessoaItem[] = await this.connections.database.query(
      `SELECT ${COLUNAS_PESSOA} FROM imovel_pessoas WHERE ${where} ORDER BY nome ASC, uuid ASC LIMIT $${valores.length + 1} OFFSET $${valores.length + 2}`,
      [...valores, porPagina, offset],
    );
    return { data, total };
  }

  async buscarPessoa(companyUuid: string, uuid: string): Promise<PessoaItem | null> {
    const [pessoa]: PessoaItem[] = await this.connections.database.query(
      `SELECT ${COLUNAS_PESSOA} FROM imovel_pessoas WHERE deleted_at IS NULL AND company_uuid = $1 AND uuid = $2`,
      [companyUuid, uuid],
    );
    return pessoa ?? null;
  }

  async listarImoveis(companyUuid: string, filtro: ListarImoveisFiltro): Promise<{ data: ImovelListaItem[]; total: number }> {
    const valores: unknown[] = [companyUuid];
    let where = `i.deleted_at IS NULL AND i.company_uuid = $1`;

    if (filtro.proprietarioUuid) {
      valores.push(filtro.proprietarioUuid);
      where += ` AND i.proprietario_uuid = $${valores.length}`;
    }
    if (filtro.situacao) {
      valores.push(filtro.situacao);
      where += ` AND i.situacao = $${valores.length}`;
    }
    const busca = filtro.busca?.trim();
    if (busca) {
      valores.push(`%${busca.replace(/[\\%_]/g, "\\$&")}%`);
      const n = `$${valores.length}`;
      where += ` AND (i.identificacao ILIKE ${n} OR i.endereco_logradouro ILIKE ${n} OR i.matricula ILIKE ${n} OR p.nome ILIKE ${n})`;
    }

    const from = `FROM imovel_imoveis i JOIN imovel_pessoas p ON p.uuid = i.proprietario_uuid`;
    const [{ total }] = await this.connections.database.query(`SELECT COUNT(*)::int AS total ${from} WHERE ${where}`, valores);

    const porPagina = Math.max(1, filtro.porPagina);
    const offset = (Math.max(1, filtro.pagina) - 1) * porPagina;
    const data: ImovelListaItem[] = await this.connections.database.query(
      `SELECT ${COLUNAS_IMOVEL}, p.nome AS "proprietarioNome" ${from} WHERE ${where} ORDER BY i.identificacao ASC, i.uuid ASC LIMIT $${valores.length + 1} OFFSET $${valores.length + 2}`,
      [...valores, porPagina, offset],
    );
    return { data, total };
  }

  async buscarImovel(companyUuid: string, uuid: string): Promise<ImovelDetalhe | null> {
    const [imovel]: ImovelListaItem[] = await this.connections.database.query(
      `SELECT ${COLUNAS_IMOVEL}, p.nome AS "proprietarioNome"
       FROM imovel_imoveis i JOIN imovel_pessoas p ON p.uuid = i.proprietario_uuid
       WHERE i.deleted_at IS NULL AND i.company_uuid = $1 AND i.uuid = $2`,
      [companyUuid, uuid],
    );
    if (!imovel) return null;
    const [contratoVigente]: ContratoVigenteResumo[] = await this.connections.database.query(
      `SELECT c.uuid, inq.nome AS "inquilinoNome", c.valor_aluguel::float8 AS "valorAluguel",
              TO_CHAR(c.inicio, 'YYYY-MM-DD') AS inicio, TO_CHAR(c.fim, 'YYYY-MM-DD') AS fim
       FROM imovel_contratos c JOIN imovel_pessoas inq ON inq.uuid = c.inquilino_uuid
       WHERE c.deleted_at IS NULL AND c.company_uuid = $1 AND c.imovel_uuid = $2 AND c.status = 'vigente'
       LIMIT 1`,
      [companyUuid, uuid],
    );
    return { ...imovel, contratoVigente: contratoVigente ?? null };
  }

  async listarContratos(companyUuid: string, filtro: ListarContratosFiltro): Promise<{ data: ContratoItem[]; total: number }> {
    const valores: unknown[] = [companyUuid];
    let where = `c.deleted_at IS NULL AND c.company_uuid = $1`;

    const igual: [string | undefined, string][] = [
      [filtro.proprietarioUuid, "i.proprietario_uuid"],
      [filtro.imovelUuid, "c.imovel_uuid"],
      [filtro.inquilinoUuid, "c.inquilino_uuid"],
      [filtro.status, "c.status"],
    ];
    for (const [valor, coluna] of igual) {
      if (!valor) continue;
      valores.push(valor);
      where += ` AND ${coluna} = $${valores.length}`;
    }
    const busca = filtro.busca?.trim();
    if (busca) {
      valores.push(`%${busca.replace(/[\\%_]/g, "\\$&")}%`);
      const n = `$${valores.length}`;
      where += ` AND (c.numero ILIKE ${n} OR i.identificacao ILIKE ${n} OR inq.nome ILIKE ${n} OR prop.nome ILIKE ${n})`;
    }

    const [{ total }] = await this.connections.database.query(`SELECT COUNT(*)::int AS total ${FROM_CONTRATO} WHERE ${where}`, valores);

    const porPagina = Math.max(1, filtro.porPagina);
    const offset = (Math.max(1, filtro.pagina) - 1) * porPagina;
    const data: ContratoItem[] = await this.connections.database.query(
      `SELECT ${COLUNAS_CONTRATO} ${FROM_CONTRATO} WHERE ${where}
       ORDER BY (c.status = 'vigente') DESC, c.inicio DESC, c.uuid ASC LIMIT $${valores.length + 1} OFFSET $${valores.length + 2}`,
      [...valores, porPagina, offset],
    );
    return { data, total };
  }

  async buscarContrato(companyUuid: string, uuid: string): Promise<ContratoItem | null> {
    const [contrato]: ContratoItem[] = await this.connections.database.query(
      `SELECT ${COLUNAS_CONTRATO} ${FROM_CONTRATO} WHERE c.deleted_at IS NULL AND c.company_uuid = $1 AND c.uuid = $2`,
      [companyUuid, uuid],
    );
    return contrato ?? null;
  }

  /** Histórico do contrato, mais recente primeiro; null se o contrato não existe nesta empresa. */
  async listarEventosContrato(companyUuid: string, contratoUuid: string): Promise<ContratoEventoItem[] | null> {
    const [contrato] = await this.connections.database.query(
      `SELECT 1 FROM imovel_contratos WHERE deleted_at IS NULL AND company_uuid = $1 AND uuid = $2`,
      [companyUuid, contratoUuid],
    );
    if (!contrato) return null;
    return this.connections.database.query(
      `SELECT
         e.uuid,
         e.contrato_uuid AS "contratoUuid",
         e.tipo,
         TO_CHAR(e.data, 'YYYY-MM-DD') AS data,
         e.descricao,
         e.valor_anterior::float8 AS "valorAnterior",
         e.valor_novo::float8 AS "valorNovo",
         TO_CHAR(e.fim_anterior, 'YYYY-MM-DD') AS "fimAnterior",
         TO_CHAR(e.fim_novo, 'YYYY-MM-DD') AS "fimNovo",
         e.criado_por_uuid AS "criadoPorUuid",
         u.name AS "criadoPorNome",
         e.created_at AS "createdAt"
       FROM imovel_contrato_eventos e
       LEFT JOIN auth_users u ON u.uuid = e.criado_por_uuid
       WHERE e.deleted_at IS NULL AND e.company_uuid = $1 AND e.contrato_uuid = $2
       ORDER BY e.data DESC, e.created_at DESC, e.uuid DESC`,
      [companyUuid, contratoUuid],
    );
  }

  /** Vencimentos, reajustes do mês e imóveis livres. `hoje` é 'YYYY-MM-DD'; toda a aritmética de datas é feita no SQL. */
  async painel(companyUuid: string, hoje: string): Promise<PainelImoveis> {
    const colunas = `
      c.uuid,
      i.identificacao AS "imovelIdentificacao",
      prop.nome AS "proprietarioNome",
      inq.nome AS "inquilinoNome",
      c.valor_aluguel::float8 AS "valorAluguel",
      TO_CHAR(c.fim, 'YYYY-MM-DD') AS fim,
      c.indice_reajuste AS "indiceReajuste",
      c.mes_reajuste AS "mesReajuste"`;
    const baseVigentes = `${FROM_CONTRATO} WHERE c.deleted_at IS NULL AND c.company_uuid = $1 AND c.status = 'vigente'`;
    const porFim = `ORDER BY c.fim ASC, i.identificacao ASC, c.uuid ASC`;
    const faixa = (filtro: string): Promise<ContratoResumo[]> =>
      this.connections.database.query(`SELECT ${colunas} ${baseVigentes} AND ${filtro} ${porFim}`, [companyUuid, hoje]);

    const [vencidos, vence0a30, vence31a60, vence61a90, reajustesMes, imoveisLivres] = await Promise.all([
      faixa(`c.fim < $2::date`),
      faixa(`c.fim BETWEEN $2::date AND $2::date + 30`),
      faixa(`c.fim BETWEEN $2::date + 31 AND $2::date + 60`),
      faixa(`c.fim BETWEEN $2::date + 61 AND $2::date + 90`),
      this.connections.database.query(
        `SELECT ${colunas} ${baseVigentes}
           AND c.indice_reajuste <> 'nenhum'
           AND c.mes_reajuste = EXTRACT(MONTH FROM $2::date)
           AND c.inicio < date_trunc('month', $2::date)
         ORDER BY i.identificacao ASC, c.uuid ASC`,
        [companyUuid, hoje],
      ),
      this.connections.database.query(
        `SELECT i.uuid, i.identificacao, p.nome AS "proprietarioNome"
         FROM imovel_imoveis i JOIN imovel_pessoas p ON p.uuid = i.proprietario_uuid
         WHERE i.deleted_at IS NULL AND i.company_uuid = $1 AND i.situacao = 'livre'
         ORDER BY i.identificacao ASC, i.uuid ASC`,
        [companyUuid],
      ),
    ]);
    const [{ total: contasVencidas }] = await this.connections.database.query(
      `SELECT COUNT(*)::int AS total FROM imovel_contas
       WHERE deleted_at IS NULL AND company_uuid = $1 AND pago_em IS NULL AND vencimento < $2::date`,
      [companyUuid, hoje],
    );
    return { vencidos, vence0a30, vence31a60, vence61a90, reajustesMes, imoveisLivres, contasVencidas };
  }

  async listarContas(
    companyUuid: string,
    filtro: ListarContasFiltro,
    hoje: string,
  ): Promise<{ data: ContaItem[]; total: number; totalValor: number; totalPago: number }> {
    const valores: unknown[] = [companyUuid, hoje];
    // `$2::date IS NOT NULL` mantém o parâmetro `hoje` referenciado também na contagem (o Postgres exige todos os parâmetros usados).
    let where = `ct.deleted_at IS NULL AND ct.company_uuid = $1 AND $2::date IS NOT NULL`;

    const igual: [string | undefined, string][] = [
      [filtro.tipo, "ct.tipo"],
      [filtro.categoria, "ct.categoria"],
      [filtro.proprietarioUuid, "ct.proprietario_uuid"],
      [filtro.imovelUuid, "ct.imovel_uuid"],
      [filtro.contratoUuid, "ct.contrato_uuid"],
      [filtro.responsavel, "ct.responsavel"],
    ];
    for (const [valor, coluna] of igual) {
      if (!valor) continue;
      valores.push(valor);
      where += ` AND ${coluna} = $${valores.length}`;
    }
    if (filtro.situacao) {
      valores.push(filtro.situacao);
      where += ` AND ${situacaoSql("$2")} = $${valores.length}`;
    }
    if (filtro.vencimentoDe) {
      valores.push(filtro.vencimentoDe);
      where += ` AND ct.vencimento >= $${valores.length}::date`;
    }
    if (filtro.vencimentoAte) {
      valores.push(filtro.vencimentoAte);
      where += ` AND ct.vencimento <= $${valores.length}::date`;
    }
    const busca = filtro.busca?.trim();
    if (busca) {
      valores.push(`%${busca.replace(/[\\%_]/g, "\\$&")}%`);
      const n = `$${valores.length}`;
      where += ` AND (ct.descricao ILIKE ${n} OR ct.fornecedor ILIKE ${n} OR ct.documento_numero ILIKE ${n})`;
    }

    const [meta] = await this.connections.database.query(
      `SELECT COUNT(*)::int AS total, COALESCE(SUM(ct.valor), 0)::float8 AS "totalValor", COALESCE(SUM(ct.valor_pago), 0)::float8 AS "totalPago"
       ${FROM_CONTA} WHERE ${where}`,
      valores,
    );

    const porPagina = Math.max(1, filtro.porPagina);
    const offset = (Math.max(1, filtro.pagina) - 1) * porPagina;
    const data: ContaItem[] = await this.connections.database.query(
      `SELECT ${colunasConta("$2")} ${FROM_CONTA} WHERE ${where}
       ORDER BY ct.vencimento ASC, ct.created_at ASC, ct.uuid ASC LIMIT $${valores.length + 1} OFFSET $${valores.length + 2}`,
      [...valores, porPagina, offset],
    );
    return { data, total: meta.total, totalValor: meta.totalValor, totalPago: meta.totalPago };
  }

  async buscarConta(
    companyUuid: string,
    uuid: string,
    hoje: string,
  ): Promise<
    (ContaItem & { anexos: ContaAnexoItem[]; parcelas: { uuid: string; parcelaNumero: number; vencimento: string; situacao: ContaSituacao }[] }) | null
  > {
    const [conta]: ContaItem[] = await this.connections.database.query(
      `SELECT ${colunasConta("$3")} ${FROM_CONTA} WHERE ct.deleted_at IS NULL AND ct.company_uuid = $1 AND ct.uuid = $2`,
      [companyUuid, uuid, hoje],
    );
    if (!conta) return null;
    const anexos: ContaAnexoItem[] = await this.connections.database.query(
      `SELECT uuid, tipo, nome_arquivo AS "nomeArquivo", content_type AS "contentType", tamanho, created_at AS "createdAt"
       FROM imovel_conta_anexos
       WHERE deleted_at IS NULL AND company_uuid = $1 AND conta_uuid = $2
       ORDER BY created_at ASC, uuid ASC`,
      [companyUuid, uuid],
    );
    const parcelas = conta.grupoUuid
      ? await this.connections.database.query(
          `SELECT ct.uuid, ct.parcela_numero AS "parcelaNumero", TO_CHAR(ct.vencimento, 'YYYY-MM-DD') AS vencimento, ${situacaoSql("$4")} AS situacao
           FROM imovel_contas ct
           WHERE ct.deleted_at IS NULL AND ct.company_uuid = $1 AND ct.grupo_uuid = $2 AND ct.uuid <> $3
           ORDER BY ct.parcela_numero ASC, ct.uuid ASC`,
          [companyUuid, conta.grupoUuid, uuid, hoje],
        )
      : [];
    return { ...conta, anexos, parcelas };
  }

  /** Contas não pagas em três faixas que não se sobrepõem: vencidas, hoje..hoje+6 e hoje+7..hoje+29. */
  async agendaContas(
    companyUuid: string,
    hoje: string,
    filtro: { proprietarioUuid?: string; imovelUuid?: string; tipo?: ContaTipo },
  ): Promise<AgendaContas> {
    const valores: unknown[] = [companyUuid, hoje];
    let base = `ct.deleted_at IS NULL AND ct.company_uuid = $1 AND ct.pago_em IS NULL`;
    const igual: [string | undefined, string][] = [
      [filtro.proprietarioUuid, "ct.proprietario_uuid"],
      [filtro.imovelUuid, "ct.imovel_uuid"],
      [filtro.tipo, "ct.tipo"],
    ];
    for (const [valor, coluna] of igual) {
      if (!valor) continue;
      valores.push(valor);
      base += ` AND ${coluna} = $${valores.length}`;
    }
    const grupo = async (faixa: string): Promise<GrupoAgenda> => {
      const where = `${base} AND ${faixa}`;
      const [meta] = await this.connections.database.query(
        `SELECT COUNT(*)::int AS total, COALESCE(SUM(ct.valor), 0)::float8 AS soma ${FROM_CONTA} WHERE ${where}`,
        valores,
      );
      const contas: ContaItem[] = await this.connections.database.query(
        `SELECT ${colunasConta("$2")} ${FROM_CONTA} WHERE ${where} ORDER BY ct.vencimento ASC, ct.created_at ASC, ct.uuid ASC LIMIT 50`,
        valores,
      );
      return { total: meta.total, soma: meta.soma, contas };
    };
    const [vencidas, proximos7, proximos30] = await Promise.all([
      grupo(`ct.vencimento < $2::date`),
      grupo(`ct.vencimento >= $2::date AND ct.vencimento <= $2::date + 6`),
      grupo(`ct.vencimento >= $2::date + 7 AND ct.vencimento <= $2::date + 29`),
    ]);
    return { vencidas, proximos7, proximos30 };
  }
}
