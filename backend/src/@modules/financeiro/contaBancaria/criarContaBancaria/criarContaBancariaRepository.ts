import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";

export type CriarContaBancariaData = {
  companyUuid: string;
  nome?: string;
  bancoNumero?: string;
  agencia?: string;
  conta?: string;
  digito?: string;
  chaveApi?: string;
  status?: string;
};

export type ContaBancariaCriada = {
  uuid: string;
};

export class CriarContaBancariaRepository {
  constructor(readonly connectionHub: ConnectionHub) {}

  async criar(data: CriarContaBancariaData): Promise<ContaBancariaCriada> {
    const [row] = await this.connectionHub.database!.query(
      `
      INSERT INTO financeiro_contas_bancarias (
        company_uuid, nome, banco_numero, agencia, conta, digito, chave_api, status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8
      )
      RETURNING uuid
      `,
      [
        data.companyUuid,
        data.nome ?? null,
        data.bancoNumero ?? null,
        data.agencia ?? null,
        data.conta ?? null,
        data.digito ?? null,
        data.chaveApi ?? null,
        data.status ?? "ativo",
      ],
    );
    return row;
  }
}
