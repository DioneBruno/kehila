import { NovoCarrinhoRepository } from "./novoCarrinhoRepository";

export type NovoCarrinhoInput = {
  companyUuid: string;
  userUuid: string;
};

export class NovoCarrinhoUsecase {
  constructor(readonly repo: NovoCarrinhoRepository) {}

  async execute() {}
}
