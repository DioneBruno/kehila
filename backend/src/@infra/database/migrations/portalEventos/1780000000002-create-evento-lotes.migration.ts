import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreateEventoLotes1780000000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "evento_lotes",
        columns: [
          { name: "created_at", type: "timestamptz", default: "now()" },
          { name: "updated_at", type: "timestamptz", default: "now()" },
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
          { name: "ordem", type: "int" },
          { name: "quantidade", type: "int" },
          { name: "preco", type: "decimal", precision: 10, scale: 2 },
          { name: "data_inicio", type: "timestamptz", isNullable: true },
          { name: "data_fim", type: "timestamptz", isNullable: true },
          { name: "ativo", type: "boolean", default: true },
        ],
      }),
    );

    await queryRunner.createForeignKey(
      "evento_lotes",
      new TableForeignKey({
        name: "FK_evento_lotes_eventos",
        columnNames: ["evento_uuid"],
        referencedTableName: "eventos",
        referencedColumnNames: ["uuid"],
        onDelete: "CASCADE",
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("evento_lotes");
  }
}
