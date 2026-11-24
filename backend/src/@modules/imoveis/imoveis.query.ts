import { ConnectionHub } from "../shared/connections/connectionHub";
import { PessoaPapel, PessoaTipo } from "./shared/imoveis.tipos";

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
}
