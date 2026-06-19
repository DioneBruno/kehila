import { MigrationInterface, QueryRunner, Table, TableIndex } from "typeorm";

export class MigrationCreateBiMigration1781842380762 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "bi_sumario",
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
            primaryKeyConstraintName: "PK_bi_sumario",
          },
          {
            name: "company_uuid",
            type: "uuid",
            isNullable: true,
          },
          {
            name: "gateway",
            type: "varchar",
          },
          {
            name: "referencia",
            type: "jsonb",
            default: "'{}'",
          },
          {
            name: "titulo",
            type: "varchar",
          },
          {
            name: "descricao",
            type: "text",
          },
          {
            name: "parametros",
            type: "jsonb",
            default: "'[]'",
          },
          {
            name: "roles",
            type: "jsonb",
            default: "'[]'",
          },
        ],
      }),
    );

    await queryRunner.createIndex(
      "bi_sumario",
      new TableIndex({
        name: "IDX_bi_sumario_titulo",
        columnNames: ["titulo"],
      }),
    );

    await queryRunner.createIndex(
      "bi_sumario",
      new TableIndex({
        name: "IDX_bi_sumario_descricao",
        columnNames: ["descricao"],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
