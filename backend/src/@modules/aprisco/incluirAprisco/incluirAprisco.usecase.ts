import { ApriscoEntity, ApriscoStatus } from "./aprisco.entity";
import { IncluirApriscoRepository } from "./incluirApriscoRepository";

export type IncluirApriscoInput = {
  companyUuid: string;
  nome: string;
  horario?: string;
  endereco?: string;
  latitude?: number;
  longitude?: number;
  status?: ApriscoStatus;
};

export type IncluirApriscoOutput = {
  uuid: string;
};

export class IncluirApriscoUsecase {
  constructor(readonly repo: IncluirApriscoRepository) {}

  async execute(input: IncluirApriscoInput): Promise<IncluirApriscoOutput> {
    const aprisco = ApriscoEntity.criar(input);
    await this.repo.incluir(aprisco);
    return { uuid: aprisco.uuid };
  }
}
