import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class MigrationUserCompanies1705326473196 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "auth_users_companies",
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
            primaryKeyConstraintName: "PK_auth_users_companies",
          },
          {
            name: "user_uuid",
            type: "uuid",
          },
          {
            name: "company_uuid",
            type: "uuid",
          },
          {
            name: "is_accepted",
            type: "boolean",
          },
          {
            name: "position",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "roles",
            type: "jsonb",
            default: "'[]'",
          },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
