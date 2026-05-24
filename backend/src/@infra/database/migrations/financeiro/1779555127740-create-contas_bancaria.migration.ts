import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class MigrationCreateContasBancariasMigration1779555127740 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "financeiro_contas_bancarias",
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
            primaryKeyConstraintName: "PK_financeiro_contas_bancarias",
            default: "gen_random_uuid()",
          },
          { name: "company_uuid", type: "uuid" },
          { name: "nome", type: "varchar", isNullable: true },
          { name: "banco_numero", type: "varchar", isNullable: true },
          { name: "agencia", type: "varchar", isNullable: true },
          { name: "conta", type: "varchar", isNullable: true },
          { name: "digito", type: "varchar", isNullable: true },
          { name: "chave_api", type: "text", isNullable: true },
          { name: "status", type: "varchar", isNullable: true },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
