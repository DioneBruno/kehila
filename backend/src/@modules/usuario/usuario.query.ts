import dataSource from "src/@infra/database/datasource";
import { ConnectionHub } from "../shared/connections/connectionHub";

export type EditarPerfilUsuarioInput = {
  uuid: string;
  nome: string;
  cpf: string;
  email: string;
  telefone: string;
  cep: string;
  endereco: string;
  enderecoNumero: string;
  bairro: string;
  cidade: string;
  uf: string;
};

export class UsuarioQuery {
  constructor(readonly connectionHub: ConnectionHub) {}

  async editarPerfilUsuario(input: EditarPerfilUsuarioInput) {
    await dataSource.query(
      `UPDATE FROM auth_users SET
      name = $2,
      cpf = $3,
      email = $4,
      telefone = $5,
      cep = $6,
      endereco = $7,
      enderecoNumero = $8,
      bairro = $9,
      cidade = $10,
      uf = $11
      WHERE uuid = $1`,
      [
        input.uuid,
        input.nome,
        input.cpf,
        input.email,
        input.telefone,
        input.cep,
        input.endereco,
        input.enderecoNumero,
        input.bairro,
        input.cidade,
        input.uf,
      ],
    );
  }
  async buscarUsuarioPorUuid(userUuid: string) {
    const [usuarioModel] = await this.connectionHub.database?.query(
      `SELECT 
        uuid,
        name,
        email,
        phone telefone,
        cpf,
        cep,
        endereco,
        endereco_numero,
        bairro,
        cidade,
        uf
    FROM auth_users WHERE uuid = $1`,
      [userUuid],
    );
    if (!usuarioModel) return null;
    return usuarioModel;
  }
}
