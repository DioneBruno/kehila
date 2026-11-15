import { randomUUID } from "crypto";
import * as bcryptjs from "bcryptjs";
import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";

export type MembroParaUsuario = {
  uuid: string;
  companyUuid: string;
  nome: string | null;
  cpf: string | null;
  email: string | null;
  telefone: string | null;
  estadoCivil: string | null;
  dataNascimento: string | null;
  enderecoCep: string | null;
  enderecoLogradouro: string | null;
  enderecoNumero: string | null;
  enderecoBairro: string | null;
  enderecoCidade: string | null;
  enderecoUf: string | null;
};

export type UsuarioExistente = {
  uuid: string;
  vinculadoNaEmpresa: boolean;
};

export type CriarUsuarioDoMembroData = {
  membro: MembroParaUsuario;
  usuarioExistenteUuid?: string;
  password?: string;
  position?: string;
  roles: string[];
};

export class CriarUsuarioRepository {
  constructor(readonly connections: ConnectionHub) {}

  async buscarMembro(companyUuid: string, membroUuid: string): Promise<MembroParaUsuario | null> {
    const [row]: any[] = await this.connections.database.query(
      `
      SELECT
        uuid,
        company_uuid AS "companyUuid",
        nome,
        cpf,
        email,
        telefone,
        estado_civil AS "estadoCivil",
        to_char(data_nascimento, 'YYYY-MM-DD') AS "dataNascimento",
        endereco_cep AS "enderecoCep",
        endereco_logradouro AS "enderecoLogradouro",
        endereco_numero AS "enderecoNumero",
        endereco_bairro AS "enderecoBairro",
        endereco_cidade AS "enderecoCidade",
        endereco_uf AS "enderecoUf"
      FROM auth_pessoas
      WHERE deleted_at IS NULL AND company_uuid = $1 AND uuid = $2
      `,
      [companyUuid, membroUuid],
    );
    return (row as MembroParaUsuario | undefined) ?? null;
  }

  /** auth_users é global (um usuário pode pertencer a várias empresas): procura por CPF ou e-mail. */
  async buscarUsuarioExistente(companyUuid: string, cpf: string | null, email: string | null): Promise<UsuarioExistente | null> {
    if (!cpf && !email) return null;

    const [row]: any[] = await this.connections.database.query(
      `
      SELECT
        u.uuid,
        EXISTS (
          SELECT 1 FROM auth_users_companies uc
          WHERE uc.user_uuid = u.uuid AND uc.company_uuid = $1 AND uc.deleted_at IS NULL
        ) AS "vinculadoNaEmpresa"
      FROM auth_users u
      WHERE u.deleted_at IS NULL
        AND ((u.cpf = $2 AND $2 IS NOT NULL) OR (u.email = $3 AND $3 IS NOT NULL))
      ORDER BY u.created_at
      LIMIT 1
      `,
      [companyUuid, cpf, email],
    );
    return (row as UsuarioExistente | undefined) ?? null;
  }

  async criar(data: CriarUsuarioDoMembroData): Promise<{ uuid: string }> {
    const { membro } = data;
    const userUuid = data.usuarioExistenteUuid ?? randomUUID();

    await this.connections.database.transaction(async (manager) => {
      if (!data.usuarioExistenteUuid) {
        const passwordHash = data.password ? await bcryptjs.hash(data.password, 10) : null;
        await manager.query(
          `
          INSERT INTO auth_users (
            uuid, name, cpf, email, phone, password, password_date_update,
            cep, endereco, endereco_numero, bairro, cidade, uf,
            estado_civil, data_nascimento
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7,
            $8, $9, $10, $11, $12, $13,
            $14, $15
          )
          `,
          [
            userUuid,
            membro.nome,
            membro.cpf,
            membro.email,
            membro.telefone,
            passwordHash,
            passwordHash ? new Date() : null,
            membro.enderecoCep,
            membro.enderecoLogradouro,
            membro.enderecoNumero,
            membro.enderecoBairro,
            membro.enderecoCidade,
            membro.enderecoUf,
            membro.estadoCivil,
            membro.dataNascimento,
          ],
        );
      }

      await manager.query(
        `
        INSERT INTO auth_users_companies (
          uuid, user_uuid, company_uuid, is_accepted, position, roles
        ) VALUES (
          $1, $2, $3, $4, $5, $6
        )
        `,
        [randomUUID(), userUuid, membro.companyUuid, true, data.position ?? null, JSON.stringify(data.roles)],
      );
    });

    return { uuid: userUuid };
  }
}
