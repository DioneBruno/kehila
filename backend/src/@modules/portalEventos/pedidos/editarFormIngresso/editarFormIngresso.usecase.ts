import { ApiValidate } from "src/@modules/shared/apiValidate";
import { EditarFormIngressoRepository } from "./editarFormIngressoRepository";
import { ApiError } from "src/@modules/shared/apiError";

export interface EditarFormIngressoInput {
  /** Quando informados, garantem que o ingresso é da empresa e de um pedido do usuário (ou que ele é admin). */
  companyUuid?: string;
  userUuid?: string;
  admin?: boolean;
  pedidoUuid: string;
  ingressoUuid: string;
  pessoaNome?: string;
  pessoaDocumento?: string;
  pessoaEmail?: string;
  pessoaTelefone?: string;
  pessoaPais?: string;
  pessoaUf?: string;
  pessoaCidade?: string;
  formData?: object;
}

export class EditarFormIngressoUsecase {
  constructor(readonly repo: EditarFormIngressoRepository) {}

  async execute(input: EditarFormIngressoInput) {
    if (!ApiValidate.validateCpfCnpj(input.pessoaDocumento as string)) throw new ApiError("CPF/CNPJ inválido", 400);
    const ingresso = await this.repo.buscarIngresso(input.ingressoUuid);
    if (!ingresso) throw new Error("Ingresso não encontrado");
    if (input.userUuid !== undefined || input.companyUuid !== undefined) {
      const permitido = await this.repo.usuarioPodeEditarIngresso(input.ingressoUuid, {
        companyUuid: input.companyUuid as string,
        userUuid: input.userUuid as string,
        admin: !!input.admin,
      });
      if (!permitido) throw new ApiError("Ingresso não encontrado", 404);
    }
    // O pedido usado na checagem de CPF duplicado é sempre o do próprio ingresso.
    input.pedidoUuid = ingresso.pedidoUuid();

    if (input.pessoaDocumento) {
      const cpfDuplicado = await this.repo.existeOutroIngressoComDocumento(input.pedidoUuid, input.pessoaDocumento, input.ingressoUuid);
      if (cpfDuplicado) throw new Error("CPF já informado para este pedido");
    }

    ingresso.setData(input);
    await this.repo.salvarIngresso(ingresso);
  }
}
