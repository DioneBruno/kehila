import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class MigrationCreateNotificacaoGatewayMigration1784744698374 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "notificacao_gateways",
        columns: [
          { name: "created_at", type: "timestamp", default: "now()" },
          { name: "updated_at", type: "timestamp", default: "now()" },
          { name: "deleted_at", type: "timestamp", isNullable: true, default: null },
          {
            name: "index",
            type: "int",
            isGenerated: true,
            generationStrategy: "increment",
          },
          {
            name: "uuid",
            type: "uuid",
            isPrimary: true,
            primaryKeyConstraintName: "PK_notificacao_gateways",
            default: "gen_random_uuid()",
          },
          { name: "company_uuid", type: "uuid" },
          { name: "type", type: "varchar", isNullable: true },
          { name: "name", type: "varchar", isNullable: true },
          { name: "usuario", type: "varchar", isNullable: true },
          { name: "senha", type: "varchar", isNullable: true },
          { name: "meta", type: "json", default: "'{}'" },
          { name: "status", type: "varchar", isNullable: true },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
