import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class MigrationUsers1699043032977 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "auth_users",
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
            primaryKeyConstraintName: "PK_auth_users",
          },
          {
            name: "name",
            type: "varchar",
          },
          {
            name: "email",
            type: "varchar",
          },
          {
            name: "cpf",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "password",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "password_date_update",
            type: "timestamp",
            isNullable: true,
            default: null,
          },
          {
            name: "email_confirmed_at",
            type: "date",
            isNullable: true,
          },
          {
            name: "is_verify",
            type: "boolean",
            default: false,
          },
          {
            name: "is_super_admin",
            type: "boolean",
            default: false,
          },
          {
            name: "authentik_id",
            type: "varchar",
            isNullable: true,
          },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
