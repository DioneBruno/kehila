import { ConnectionHub } from "../shared/connections/connectionHub";
import { ImovelFinalidade, ImovelSituacao, ImovelTipo, PessoaPapel, PessoaTipo } from "./shared/imoveis.tipos";

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

/** Resumo do contrato vigente; definido na Task 6. */
export type ContratoVigenteResumo = Record<string, unknown>;

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
    // Task 6 preenche o resumo do contrato vigente quando a tabela imovel_contratos existir.
    return { ...imovel, contratoVigente: null };
  }
}
