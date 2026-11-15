import { ConnectionHub } from "../../shared/connections/connectionHub";
import { MembroEntity } from "./membro.entity";

export class IncluirMembroRepository {
  constructor(readonly connections: ConnectionHub) {}

  async incluir(membro: MembroEntity): Promise<void> {
    const p = membro.props;
    await this.connections.database.query(
      `
      INSERT INTO auth_pessoas (
        uuid, company_uuid, nome, ativo, membro, batizado, transferido,
        cpf, email, telefone, estado_civil, meta, data_nascimento,
        endereco_cep, endereco_logradouro, endereco_numero, endereco_complemento,
        endereco_bairro, endereco_cidade, endereco_uf
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11, $12, $13,
        $14, $15, $16, $17,
        $18, $19, $20
      )
      `,
      [
        p.uuid,
        p.companyUuid,
        p.nome,
        p.ativo,
        p.membro,
        p.batizado,
        p.transferido,
        p.cpf ?? null,
        p.email ?? null,
        p.telefone ?? null,
        p.estadoCivil ?? null,
        JSON.stringify(p.meta ?? {}),
        p.dataNascimento ?? null,
        p.enderecoCep ?? null,
        p.enderecoLogradouro ?? null,
        p.enderecoNumero ?? null,
        p.enderecoComplemento ?? null,
        p.enderecoBairro ?? null,
        p.enderecoCidade ?? null,
        p.enderecoUf ?? null,
      ],
    );
  }
}
