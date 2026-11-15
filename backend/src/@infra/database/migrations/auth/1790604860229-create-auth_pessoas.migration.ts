import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class MigrationCreateAuthPessoasMigration1790604860229 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "auth_pessoas",
        columns: [
          {
            name: "created_at",
            type: "timestamp",
            default: "now()",
          },
          {
            name: "updated_at",
            type: "timestamp",
            default: "now()",
          },
          {
            name: "deleted_at",
            type: "timestamp",
            isNullable: true,
            default: null,
          },
          {
            name: "uuid",
            type: "uuid",
            isPrimary: true,
            primaryKeyConstraintName: "PK_auth_pessoas",
          },
          {
            name: "company_uuid",
            type: "uuid",
          },
          {
            name: "nome",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "ativo",
            type: "boolean",
            default: false,
          },
          {
            name: "membro",
            type: "boolean",
            default: false,
          },
          {
            name: "batizado",
            type: "boolean",
            default: false,
          },
          {
            name: "transferido",
            type: "boolean",
            default: false,
          },
          {
            name: "cpf",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "email",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "telefone",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "estado_civil",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "meta",
            type: "json",
            isNullable: true,
            default: "'{}'",
          },
          {
            name: "data_nascimento",
            type: "date",
            isNullable: true,
          },
          {
            name: "endereco_cep",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "endereco_logradouro",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "endereco_numero",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "endereco_complemento",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "endereco_bairro",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "endereco_cidade",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "endereco_uf",
            type: "varchar",
            isNullable: true,
          },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
