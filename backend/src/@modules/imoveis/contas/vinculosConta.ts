import { ApiError } from "src/@modules/shared/apiError";
import { MSG_CONTRATO_NAO_ENCONTRADO, MSG_IMOVEL_NAO_ENCONTRADO } from "../contratos/contrato.entity";
import { Consultavel } from "../imoveis/situacaoImovel";
import {
  ContaDados,
  MSG_CONTRATO_OUTRO_IMOVEL,
  MSG_INFORME_PROPRIETARIO,
  MSG_NAO_PROPRIETARIO,
  MSG_PROPRIETARIO_NAO_ENCONTRADO,
} from "./conta.entity";

/**
 * Trava (FOR UPDATE, nesta ordem: contrato, imóvel, proprietário) e valida os vínculos da conta.
 * Com imóvel, o proprietário é o dono do imóvel; sem imóvel, exige a pessoa informada com eh_proprietario.
 * Deve rodar dentro de transação.
 */
export async function resolverVinculosConta(manager: Consultavel, companyUuid: string, d: ContaDados): Promise<{ proprietarioUuid: string }> {
  if (d.contratoUuid) {
    const [contrato] = await manager.query(
      `SELECT imovel_uuid FROM imovel_contratos WHERE deleted_at IS NULL AND company_uuid = $1 AND uuid = $2 FOR UPDATE`,
      [companyUuid, d.contratoUuid],
    );
    if (!contrato) throw new ApiError(MSG_CONTRATO_NAO_ENCONTRADO, 404);
    if (contrato.imovel_uuid !== d.imovelUuid) throw new ApiError(MSG_CONTRATO_OUTRO_IMOVEL);
  }

  if (d.imovelUuid) {
    const [imovel] = await manager.query(
      `SELECT proprietario_uuid FROM imovel_imoveis WHERE deleted_at IS NULL AND company_uuid = $1 AND uuid = $2 FOR UPDATE`,
      [companyUuid, d.imovelUuid],
    );
    if (!imovel) throw new ApiError(MSG_IMOVEL_NAO_ENCONTRADO, 404);
    await manager.query(`SELECT uuid FROM imovel_pessoas WHERE deleted_at IS NULL AND company_uuid = $1 AND uuid = $2 FOR UPDATE`, [
      companyUuid,
      imovel.proprietario_uuid,
    ]);
    return { proprietarioUuid: imovel.proprietario_uuid };
  }

  if (!d.proprietarioUuid) throw new ApiError(MSG_INFORME_PROPRIETARIO);
  const [pessoa] = await manager.query(
    `SELECT eh_proprietario FROM imovel_pessoas WHERE deleted_at IS NULL AND company_uuid = $1 AND uuid = $2 FOR UPDATE`,
    [companyUuid, d.proprietarioUuid],
  );
  if (!pessoa) throw new ApiError(MSG_PROPRIETARIO_NAO_ENCONTRADO, 404);
  if (!pessoa.eh_proprietario) throw new ApiError(MSG_NAO_PROPRIETARIO);
  return { proprietarioUuid: d.proprietarioUuid };
}
