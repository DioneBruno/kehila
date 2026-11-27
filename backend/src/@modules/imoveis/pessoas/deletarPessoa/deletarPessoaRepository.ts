import { ApiError } from "src/@modules/shared/apiError";
import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import { MSG_PESSOA_COM_CONTAS } from "../../contas/conta.entity";

export const MSG_EXCLUIR_PESSOA_VINCULADA = "Não é possível excluir: a pessoa é proprietária de imóvel ou parte de contrato vigente";

export class DeletarPessoaRepository {
  constructor(readonly connections: ConnectionHub) {}

  /**
   * Numa transação: trava a pessoa (FOR UPDATE), checa vínculos (imóvel ativo como proprietária, contrato vigente
   * como inquilina ou fiadora) e faz o soft delete. IncluirImovel/IncluirContrato/AlterarImovel/AlterarContrato
   * atualizam a mesma linha (flags eh_*) antes de gravar o vínculo, então ficam serializados com esta exclusão.
   */
  async deletar(companyUuid: string, uuid: string): Promise<void> {
    await this.connections.database.transaction(async (manager) => {
      const [pessoa] = await manager.query(
        `SELECT uuid FROM imovel_pessoas WHERE deleted_at IS NULL AND company_uuid = $1 AND uuid = $2 FOR UPDATE`,
        [companyUuid, uuid],
      );
      if (!pessoa) throw new ApiError("Pessoa não encontrada", 404);

      const [vinculo] = await manager.query(
        `SELECT 1 FROM imovel_imoveis WHERE deleted_at IS NULL AND company_uuid = $1 AND proprietario_uuid = $2
         UNION ALL
         SELECT 1 FROM imovel_contratos
         WHERE deleted_at IS NULL AND company_uuid = $1 AND status = 'vigente' AND (inquilino_uuid = $2 OR fiador_uuid = $2)
         LIMIT 1`,
        [companyUuid, uuid],
      );
      if (vinculo) throw new ApiError(MSG_EXCLUIR_PESSOA_VINCULADA, 409);

      const [conta] = await manager.query(
        `SELECT 1 FROM imovel_contas WHERE deleted_at IS NULL AND company_uuid = $1 AND proprietario_uuid = $2 LIMIT 1`,
        [companyUuid, uuid],
      );
      if (conta) throw new ApiError(MSG_PESSOA_COM_CONTAS, 409);

      await manager.query(
        `UPDATE imovel_pessoas SET deleted_at = now(), updated_at = now() WHERE deleted_at IS NULL AND company_uuid = $1 AND uuid = $2`,
        [companyUuid, uuid],
      );
    });
  }
}
