import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class MigrationCompanies1699043032977 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "auth_companies",
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
            primaryKeyConstraintName: "PK_auth_companies",
          },
          {
            name: "tenant_id",
            type: "varchar",
          },
          {
            name: "name",
            type: "varchar",
          },
          {
            name: "state_registration",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "cpf_cnpj",
            type: "varchar",
          },
          {
            name: "commercial_name",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "fantasy_name",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "email",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "phone",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "address",
            type: "jsonb",
            isNullable: true,
          },
          {
            name: "uf",
            type: "varchar",
            isNullable: true,
          },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
