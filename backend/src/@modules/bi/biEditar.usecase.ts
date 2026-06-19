import { ApiError } from "../shared/apiError";
import { BiRepository } from "./biRepostiory";

export type BiIncluirInput = {
  companyUuid: string;
  uuid: string;
  gateway: string;
  titulo: string;
  descricao: string;
  referencia: { tipo: string; valor: string };
  parametros?: { nome: string; valor: string; obrigatorio: boolean }[];
  roles?: string[];
};

export class BiEditarUsecase {
  constructor(readonly biRepository: BiRepository) {}

  async execute(input: any): Promise<void> {
    const bi = await this.biRepository.findBi(input.uuid);
    if (!bi) throw new ApiError("BI não encontrado");

    bi.setGateway(input.gateway);
    bi.setTitulo(input.titulo);
    bi.setDescricao(input.descricao);
    bi.setReferencia(input.referencia);
    bi.setParametros(input.parametros);
    bi.setRoles(input.roles);

    await this.biRepository.biSave(bi);
  }
}
