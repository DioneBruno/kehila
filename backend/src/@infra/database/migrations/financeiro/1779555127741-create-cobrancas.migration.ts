import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class MigrationCreateCobrancasMigration1779555127740 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "financiero_cobrancas",
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
            primaryKeyConstraintName: "PK_financiero_cobrancas",
            default: "gen_random_uuid()",
          },
          { name: "company_uuid", type: "uuid" },
          { name: "user_uuid", type: "uuid" },
          { name: "conta_bancaria_uuid", type: "uuid", isNullable: true },
          { name: "origem_tipo", type: "varchar", isNullable: true },
          { name: "origem_uuid", type: "uuid", isNullable: true },
          { name: "valor", type: "decimal", precision: 10, scale: 2, default: 0 },
          { name: "valor_pago", type: "decimal", precision: 10, scale: 2, default: 0 },
          { name: "status", type: "varchar", default: "'pendente'" },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
