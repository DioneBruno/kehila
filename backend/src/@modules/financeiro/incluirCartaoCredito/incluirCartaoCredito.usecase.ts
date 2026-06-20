import { ApiError } from "src/@modules/shared/apiError";
import { CartaoEntity } from "./cartao.entity";
import { IncluirCartaoCreditoRepository } from "./incluirCartaoCreditoRepository";

export type IncluirCartaoCreditoInput = {
  companyUuid: string;
  userUuid: string;
  cartaoCredito: {
    nomeNoCartao: string;
    numeroCartao: string;
    mesVencimento: string;
    anoVencimento: string;
    codigoSeguranca: string;
  };
};

export class IncluirCartaoCreditoUsecase {
  constructor(readonly repo: IncluirCartaoCreditoRepository) {}

  async execute(input: IncluirCartaoCreditoInput): Promise<void> {
    const contaBancaria = await this.repo.buscarContaBancaria(input.companyUuid);
    if (!contaBancaria) throw new ApiError("Conta bancária não encontrada");

    const usuario = await this.repo.buscarUsuario(input.userUuid);
    if (!usuario) throw new ApiError("Usuário não encontrado");

    const camposFaltantes: string[] = [];
    if (!usuario.telefone()) camposFaltantes.push("Telefone");
    if (!usuario.cep()) camposFaltantes.push("Cep");
    if (!usuario.endereco()) camposFaltantes.push("Endereco");
    if (!usuario.bairro()) camposFaltantes.push("Bairro");
    if (!usuario.cidade()) camposFaltantes.push("Cidade");
    if (!usuario.uf()) camposFaltantes.push("UF");
    if (camposFaltantes.length) throw new ApiError(`Dados incompletos, (${camposFaltantes.join(", ")})`);

    const gateway = this.repo.buscarGateway(contaBancaria);
    const cartao = new CartaoEntity({
      companyUuid: input.companyUuid,
      usuario,
      contaBancaria,
      nome: input.cartaoCredito.nomeNoCartao,
      numero: input.cartaoCredito.numeroCartao,
      mesVencimento: input.cartaoCredito.mesVencimento,
      anoVencimento: input.cartaoCredito.anoVencimento,
      codigoSeguranca: input.cartaoCredito.codigoSeguranca,
    });

    const registro = await gateway.registrarCartao(cartao);
    cartao.setRegistro({ numero: registro.numeroCartao, bandeira: registro.bandeira, token: registro.token });

    await this.repo.salvarCartao(cartao);
  }
}
