import { ConnectionHub } from "../shared/connections/connectionHub";
import {
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
}
