import { ApiError } from "src/@modules/shared/apiError";

/** Converte a violação do índice único (company_uuid, documento) em 409; qualquer outro erro é repassado. */
export function tratarDocumentoDuplicado(erro: any): never {
  if ((erro?.code ?? erro?.driverError?.code) === "23505") throw new ApiError("Já existe uma pessoa com este documento", 409);
  throw erro;
}
