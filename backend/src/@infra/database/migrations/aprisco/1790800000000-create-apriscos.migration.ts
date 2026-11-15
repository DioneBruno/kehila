import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class MigrationCreateApriscos1790800000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "apriscos",
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
            primaryKeyConstraintName: "PK_apriscos",
            default: "gen_random_uuid()",
          },
          { name: "company_uuid", type: "uuid" },
          { name: "nome", type: "varchar" },
          { name: "horario", type: "varchar", isNullable: true },
          { name: "endereco", type: "varchar", isNullable: true },
          { name: "latitude", type: "decimal", precision: 10, scale: 7, isNullable: true },
          { name: "longitude", type: "decimal", precision: 10, scale: 7, isNullable: true },
          { name: "status", type: "varchar", default: "'ativo'" },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("apriscos");
  }
}
