import { ApiError } from "src/@modules/shared/apiError";
import { garantirUuid } from "../../shared/garantirUuid";
import { MSG_CONTA_NAO_ENCONTRADA, validarDadosConta } from "../conta.entity";
import { AlterarContaRepository } from "./alterarContaRepository";

export type AlterarContaInput = { companyUuid: string; uuid: string } & Record<string, unknown>;

const CAMPOS_EDITAVEIS = [
  "tipo",
  "categoria",
  "esfera",
  "descricao",
  "proprietarioUuid",
  "imovelUuid",
  "contratoUuid",
  "responsavel",
  "competencia",
  "vencimento",
  "valor",
  "fornecedor",
  "documentoNumero",
  "observacoes",
] as const;

export class AlterarContaUsecase {
  constructor(readonly repo: AlterarContaRepository) {}

  /**
   * Chave presente no corpo (inclusive null) sobrescreve o valor atual; chave ausente mantém. Grupo, parcelas e pagamento
   * não são alteráveis por aqui.
   */
  async execute(input: AlterarContaInput): Promise<void> {
    if (!input.companyUuid) throw new ApiError("Empresa não identificada", 401);
    const uuid = garantirUuid(input.uuid, MSG_CONTA_NAO_ENCONTRADA);
    await this.repo.alterar(input.companyUuid, uuid, (atual) => {
      const mesclado: Record<string, unknown> = { ...atual };
      // Com imóvel, o proprietário gravado é derivado dele: não vale como informado se o imóvel for removido.
      if (atual.imovelUuid) mesclado.proprietarioUuid = null;
      for (const campo of CAMPOS_EDITAVEIS) {
        if (Object.prototype.hasOwnProperty.call(input, campo)) mesclado[campo] = input[campo];
      }
      return validarDadosConta(mesclado);
    });
  }
}
