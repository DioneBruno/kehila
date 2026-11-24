import { buscarSituacaoImovel, imovelTemContratoVigente } from "../situacaoImovel";
import { ApiError } from "src/@modules/shared/apiError";
import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import { MSG_PROPRIETARIO_NAO_ENCONTRADO } from "../imovel.entity";

/** Chaves já são nomes de coluna; valores undefined são ignorados. */
export type AlterarImovelColunas = Partial<{
  proprietario_uuid: string;
  identificacao: string;
  tipo: string;
  finalidade: string;
  endereco_cep: string | null;
  endereco_logradouro: string | null;
  endereco_numero: string | null;
  endereco_complemento: string | null;
  endereco_bairro: string | null;
  endereco_cidade: string | null;
  endereco_uf: string | null;
  inscricao_iptu: string | null;
  matricula: string | null;
  cartorio: string | null;
  area_m2: number | null;
  situacao: string;
  observacoes: string | null;
}>;

const COLUNAS_PERMITIDAS = [
  "proprietario_uuid",
  "identificacao",
  "tipo",
  "finalidade",
  "endereco_cep",
  "endereco_logradouro",
  "endereco_numero",
  "endereco_complemento",
  "endereco_bairro",
  "endereco_cidade",
  "endereco_uf",
  "inscricao_iptu",
  "matricula",
  "cartorio",
  "area_m2",
  "situacao",
  "observacoes",
];

export class AlterarImovelRepository {
  constructor(readonly connections: ConnectionHub) {}

  buscarSituacao(companyUuid: string, uuid: string) {
    return buscarSituacaoImovel(this.connections, companyUuid, uuid);
  }

  temContratoVigente(companyUuid: string, uuid: string) {
    return imovelTemContratoVigente(this.connections, companyUuid, uuid);
  }

  async alterar(companyUuid: string, uuid: string, data: AlterarImovelColunas): Promise<void> {
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

    await this.connections.database.transaction(async (manager) => {
      if (data.proprietario_uuid !== undefined) {
        // UPDATE ... RETURNING no TypeORM/pg devolve [linhas, quantidade]
        const [donos] = await manager.query(
          `UPDATE imovel_pessoas SET eh_proprietario = true, updated_at = now()
           WHERE deleted_at IS NULL AND company_uuid = $1 AND uuid = $2 RETURNING uuid`,
          [companyUuid, data.proprietario_uuid],
        );
        if (!donos?.length) throw new ApiError(MSG_PROPRIETARIO_NAO_ENCONTRADO, 404);
      }
      await manager.query(
        `UPDATE imovel_imoveis SET ${campos.join(", ")} WHERE deleted_at IS NULL AND company_uuid = $${valores.length - 1} AND uuid = $${valores.length}`,
        valores,
      );
    });
  }
}
