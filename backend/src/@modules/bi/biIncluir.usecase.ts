import { randomUUID } from "crypto";
import { BiEntity } from "./bi.enitty";
import { BiRepository } from "./biRepostiory";

export type BiIncluirInput = {
  companyUuid: string;
  gateway: string;
  titulo: string;
  descricao: string;
  referencia: { tipo: string; valor: string };
  parametros?: { nome: string; valor: string; obrigatorio: boolean }[];
};

export class BiIncluirUsecase {
  constructor(readonly repo: BiRepository) {}

  async execute(input: BiIncluirInput) {
    const bi = new BiEntity({
      companyUuid: input.companyUuid,
      uuid: randomUUID(),
      gateway: input.gateway,
      titulo: input.titulo,
      descricao: input.descricao,
      referencia: input.referencia,
      parametros: input.parametros,
    });

    await this.repo.biSave(bi);
  }
}
