import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class MigrationCreateCartaoCredito1781983983294 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "financeiro_cartao_credito",
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
            primaryKeyConstraintName: "PK_financeiro_cartao_credito",
            default: "gen_random_uuid()",
          },
          { name: "company_uuid", type: "uuid" },
          { name: "user_uuid", type: "uuid" },
          { name: "conta_bancaria_uuid", type: "uuid" },
          { name: "numero", type: "varchar", isNullable: true },
          { name: "bandeira", type: "varchar", isNullable: true },
          { name: "token", type: "varchar", isNullable: true },
          { name: "status", type: "varchar", isNullable: true },
          { name: "atual", type: "boolean", isNullable: true, default: false },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
