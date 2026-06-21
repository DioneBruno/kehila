import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import { CartaoEntity } from "./cartao.entity";
import { ContaBancariaEntity } from "./contabancaria.entity";
import { IncluirCartaoCreditoGatewayAsaas } from "./incluirCartaoCreditoGateway.asaas";
import { UsuarioEntity } from "./usuario.entity";

export class IncluirCartaoCreditoRepository {
  constructor(readonly connectionHub: ConnectionHub) {}

  buscarGateway(contaBancaria: ContaBancariaEntity): IncluirCartaoCreditoGatewayAsaas {
    const gateway = new IncluirCartaoCreditoGatewayAsaas(this.connectionHub);
    return gateway;
  }

  async buscarContaBancaria(companyUuid: string): Promise<ContaBancariaEntity | null> {
    const [contaBancariaModel] = await this.connectionHub.database!.query(
      `SELECT *
      FROM financeiro_contas_bancarias
      WHERE company_uuid = $1`,
      [companyUuid],
    );
    if (!contaBancariaModel) return null;
    const contaBancaria = new ContaBancariaEntity({
      uuid: contaBancariaModel.uuid,
      bancoNumero: contaBancariaModel.banco_numero,
      ambiente: contaBancariaModel.ambiente,
    });
    return contaBancaria;
  }

  async buscarUsuario(userUuid: string): Promise<UsuarioEntity | null> {
    const [usuarioModel] = await this.connectionHub.database!.query(
      `SELECT *
      FROM auth_users
      WHERE uuid = $1`,
      [userUuid],
    );
    if (!usuarioModel) return null;
    const usuario = new UsuarioEntity({
      uuid: usuarioModel.uuid,
      nome: usuarioModel.name,
      email: usuarioModel.email,
      cpf: usuarioModel.cpf,
      cep: usuarioModel.cep,
      endereco: usuarioModel.endereco,
      enderecoNumero: usuarioModel.endereco_numero,
      bairro: usuarioModel.bairro,
      cidade: usuarioModel.cidade,
      uf: usuarioModel.uf,
      telefone: usuarioModel.phone,
    });
    return usuario;
  }

  async salvarCartao(cartao: CartaoEntity): Promise<void> {
    await this.connectionHub.database!.query(
      `INSERT INTO financeiro_cartao_credito (company_uuid, user_uuid, conta_bancaria_uuid, numero, bandeira, token, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [cartao.companyUuid(), cartao.usuario().uuid(), cartao.contaBancaria().uuid(), cartao.numero(), cartao.bandeira(), cartao.token(), "ativo"],
    );
  }
}
