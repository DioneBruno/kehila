import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateEventoLoteTiposIngresso1779545498233 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "evento_lote_tipos_ingresso",
        columns: [
          { name: "created_at", type: "timestamptz", default: "now()" },
          { name: "updated_at", type: "timestamptz", default: "now()" },
          {
            name: "uuid",
            type: "uuid",
            isPrimary: true,
            primaryKeyConstraintName: "PK_evento_lote_tipos_ingresso",
            default: "gen_random_uuid()",
          },
          { name: "company_uuid", type: "uuid" },
          { name: "evento_uuid", type: "uuid" },
          { name: "lote_uuid", type: "uuid" },
          { name: "nome", type: "varchar", length: "200" },
          { name: "descricao", type: "text", isNullable: true },
          { name: "quantidade", type: "int" },
          { name: "vendidos", type: "int", default: 0 },
          { name: "preco", type: "decimal", precision: 10, scale: 2 },
          { name: "visivel", type: "boolean", default: true },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("evento_lote_tipos_ingresso");
  }
}
