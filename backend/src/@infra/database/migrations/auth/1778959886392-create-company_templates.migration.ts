import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class MigrationCreateCompanyTemplatesMigration1778959886392 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "auth_company_templates",
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
            primaryKeyConstraintName: "PK_auth_company_templates",
          },
          {
            name: "company_uuid",
            type: "uuid",
          },
          {
            name: "title",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "active",
            type: "boolean",
            default: false,
          },
          {
            name: "meta",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "header",
            type: "json",
            default: "'{}'",
          },
          {
            name: "login",
            type: "json",
            default: "'{}'",
          },
          {
            name: "email",
            type: "json",
            default: "'{}'",
          },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
