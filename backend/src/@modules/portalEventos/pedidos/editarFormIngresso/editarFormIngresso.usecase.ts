import { EditarFormIngressoRepository } from "./editarFormIngressoRepository";

export interface EditarFormIngressoInput {
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
    const ingresso = await this.repo.buscarIngresso(input.ingressoUuid);
    if (!ingresso) throw new Error("Ingresso não encontrado");

    if (input.pessoaDocumento) {
      const cpfDuplicado = await this.repo.existeOutroIngressoComDocumento(input.pedidoUuid, input.pessoaDocumento, input.ingressoUuid);
      if (cpfDuplicado) throw new Error("CPF já informado para este pedido");
    }

    ingresso.setData(input);
    await this.repo.salvarIngresso(ingresso);
  }
}
