import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class MigrationCreateCobrancasMigration1779555127741 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "financeiro_cobrancas",
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
            primaryKeyConstraintName: "PK_financeiro_cobrancas",
            default: "gen_random_uuid()",
          },
          { name: "company_uuid", type: "uuid" },
          { name: "user_uuid", type: "uuid" },
          { name: "origem_tipo", type: "varchar", isNullable: true },
          { name: "origem_uuid", type: "uuid", isNullable: true },
          { name: "pagador_nome", type: "varchar", isNullable: true },
          { name: "pagador_documento", type: "varchar", isNullable: true },
          { name: "pagador_email", type: "varchar", isNullable: true },
          { name: "pagador_telefone", type: "varchar", isNullable: true },
          { name: "valor", type: "decimal", precision: 10, scale: 2, default: 0 },
          { name: "valor_pago", type: "decimal", precision: 10, scale: 2, default: 0 },
          { name: "status", type: "varchar", default: "'pendente'" },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
