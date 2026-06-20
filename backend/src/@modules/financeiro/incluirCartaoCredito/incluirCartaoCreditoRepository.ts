import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import { ContaBancariaEntity } from "./contabancaria.entity";
import { IncluirCartaoCreditoGateway } from "./incluirCartaoCreditoGateway";

export class IncluirCartaoCreditoRepository {
  constructor(readonly connectionHub: ConnectionHub) {}

  async buscarContaBancaria(companyUuid: string): Promise<ContaBancariaEntity | null> {
    const [contaBancariaModel] = await this.connectionHub.database?.query(
      `SELECT *
      FROM financeiro_conta_bancaria
      WHERE company_uuid = $1`,
      [companyUuid],
    );
    if (!contaBancariaModel) return null;
    const contaBancaria = new ContaBancariaEntity({
      uuid: contaBancariaModel.uuid,
      bancoNumero: contaBancariaModel.banco_numero,
      ambiente: contaBancariaModel.ambiente,
    });
    return contaBancaria;
  }

  buscarGateway(contaBancaria: ContaBancariaEntity): IncluirCartaoCreditoGateway {
    const gateway = new IncluirCartaoCreditoGateway(this.connectionHub);
    return gateway;
  }
}
