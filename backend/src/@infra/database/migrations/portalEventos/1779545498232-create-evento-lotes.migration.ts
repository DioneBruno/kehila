import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateEventoLotes1779545498232 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "evento_lotes",
        columns: [
          { name: "created_at", type: "timestamp", default: "now()" },
          { name: "updated_at", type: "timestamp", default: "now()" },
          { name: "deleted_at", type: "timestamp", isNullable: true, default: null },
          {
            name: "uuid",
            type: "uuid",
            isPrimary: true,
            primaryKeyConstraintName: "PK_evento_lotes",
            default: "gen_random_uuid()",
          },
          { name: "company_uuid", type: "uuid" },
          { name: "evento_uuid", type: "uuid" },
          { name: "nome", type: "varchar", length: "200" },
          { name: "ordem", type: "int", default: 0 },
          { name: "quantidade", type: "int", default: 0 },
          { name: "preco", type: "decimal", precision: 10, scale: 2, default: 0 },
          { name: "data_inicio", type: "timestamp", isNullable: true },
          { name: "data_fim", type: "timestamp", isNullable: true },
          { name: "ativo", type: "boolean", default: true },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("evento_lotes");
  }
}
