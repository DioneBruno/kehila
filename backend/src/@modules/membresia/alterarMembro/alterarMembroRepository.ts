import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";

export type AlterarMembroData = {
  nome?: string;
  ativo?: boolean;
  membro?: boolean;
  batizado?: boolean;
  transferido?: boolean;
  cpf?: string | null;
  email?: string | null;
  telefone?: string | null;
  estadoCivil?: string | null;
  dataNascimento?: string | null;
  enderecoCep?: string | null;
  enderecoLogradouro?: string | null;
  enderecoNumero?: string | null;
  enderecoComplemento?: string | null;
  enderecoBairro?: string | null;
  enderecoCidade?: string | null;
  enderecoUf?: string | null;
  meta?: Record<string, any>;
};

const COLUNAS: Record<keyof Omit<AlterarMembroData, "meta">, string> = {
  nome: "nome",
  ativo: "ativo",
  membro: "membro",
  batizado: "batizado",
  transferido: "transferido",
  cpf: "cpf",
  email: "email",
  telefone: "telefone",
  estadoCivil: "estado_civil",
  dataNascimento: "data_nascimento",
  enderecoCep: "endereco_cep",
  enderecoLogradouro: "endereco_logradouro",
  enderecoNumero: "endereco_numero",
  enderecoComplemento: "endereco_complemento",
  enderecoBairro: "endereco_bairro",
  enderecoCidade: "endereco_cidade",
  enderecoUf: "endereco_uf",
};

export class AlterarMembroRepository {
  constructor(readonly connections: ConnectionHub) {}

  async existe(companyUuid: string, membroUuid: string): Promise<boolean> {
    const [row] = await this.connections.database.query(
      `SELECT uuid FROM auth_pessoas WHERE deleted_at IS NULL AND company_uuid = $1 AND uuid = $2`,
      [companyUuid, membroUuid],
    );
    return !!row;
  }

  async alterar(companyUuid: string, membroUuid: string, data: AlterarMembroData): Promise<void> {
    const campos: string[] = [];
    const valores: unknown[] = [];

    for (const [chave, coluna] of Object.entries(COLUNAS)) {
      const valor = (data as any)[chave];
      if (valor === undefined) continue;
      valores.push(valor);
      campos.push(`${coluna} = $${valores.length}`);
    }

    if (data.meta !== undefined) {
      valores.push(JSON.stringify(data.meta));
      // meta é json: faz merge com o conteúdo atual
      campos.push(`meta = (COALESCE(meta::jsonb, '{}'::jsonb) || $${valores.length}::jsonb)::json`);
    }

    if (campos.length === 0) return;

    campos.push(`updated_at = now()`);
    valores.push(companyUuid, membroUuid);

    await this.connections.database.query(
      `UPDATE auth_pessoas SET ${campos.join(", ")} WHERE company_uuid = $${valores.length - 1} AND uuid = $${valores.length}`,
      valores,
    );
  }
}
