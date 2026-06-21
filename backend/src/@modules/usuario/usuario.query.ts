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
    await this.connectionHub.database?.query(
      `UPDATE auth_users SET
      name = COALESCE($2, name),
      cpf = COALESCE($3, cpf),
      email = COALESCE($4, email),
      phone = COALESCE($5, phone),
      cep = COALESCE($6, cep),
      endereco = COALESCE($7, endereco),
      endereco_numero = COALESCE($8, endereco_numero),
      bairro = COALESCE($9, bairro),
      cidade = COALESCE($10, cidade),
      uf = COALESCE($11, uf)
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
    return this.buscarUsuarioPorUuid(input.uuid);
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
    const cartoes = await this.connectionHub.database?.query(
      `SELECT 
        uuid,
        numero,
        bandeira,
        status
      FROM financeiro_cartao_credito
      WHERE deleted_at IS NULL
        AND user_uuid = $1`,
      [userUuid],
    );

    return { ...usuarioModel, cartoes  };
  }
}
