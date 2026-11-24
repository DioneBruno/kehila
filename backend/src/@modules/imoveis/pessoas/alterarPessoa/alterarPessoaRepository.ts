import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import { PessoaTipo } from "../../shared/imoveis.tipos";
import { tratarDocumentoDuplicado } from "../documentoDuplicado";

/** Chaves já são nomes de coluna; valores undefined são ignorados. */
export type AlterarPessoaColunas = Partial<{
  documento: string;
  nome: string;
  nome_fantasia: string | null;
  rg_ie: string | null;
  email: string | null;
  telefone: string | null;
  endereco_cep: string | null;
  endereco_logradouro: string | null;
  endereco_numero: string | null;
  endereco_complemento: string | null;
  endereco_bairro: string | null;
  endereco_cidade: string | null;
  endereco_uf: string | null;
  observacoes: string | null;
  eh_proprietario: boolean;
  eh_inquilino: boolean;
  eh_fiador: boolean;
}>;

const COLUNAS_PERMITIDAS = [
  "documento",
  "nome",
  "nome_fantasia",
  "rg_ie",
  "email",
  "telefone",
  "endereco_cep",
  "endereco_logradouro",
  "endereco_numero",
  "endereco_complemento",
  "endereco_bairro",
  "endereco_cidade",
  "endereco_uf",
  "observacoes",
  "eh_proprietario",
  "eh_inquilino",
  "eh_fiador",
];

export class AlterarPessoaRepository {
  constructor(readonly connections: ConnectionHub) {}

  async buscarTipo(companyUuid: string, uuid: string): Promise<PessoaTipo | null> {
    const [row] = await this.connections.database.query(
      `SELECT tipo FROM imovel_pessoas WHERE deleted_at IS NULL AND company_uuid = $1 AND uuid = $2`,
      [companyUuid, uuid],
    );
    return row?.tipo ?? null;
  }

  async alterar(companyUuid: string, uuid: string, data: AlterarPessoaColunas): Promise<void> {
    const campos: string[] = [];
    const valores: unknown[] = [];

    for (const coluna of COLUNAS_PERMITIDAS) {
      const valor = (data as any)[coluna];
      if (valor === undefined) continue;
      valores.push(valor);
      campos.push(`${coluna} = $${valores.length}`);
    }

    if (campos.length === 0) return;

    campos.push(`updated_at = now()`);
    valores.push(companyUuid, uuid);

    try {
      await this.connections.database.query(
        `UPDATE imovel_pessoas SET ${campos.join(", ")} WHERE deleted_at IS NULL AND company_uuid = $${valores.length - 1} AND uuid = $${valores.length}`,
        valores,
      );
    } catch (erro) {
      tratarDocumentoDuplicado(erro);
    }
  }
}
