import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateEventos1780000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE evento_status AS ENUM (
        'rascunho', 'publicado', 'em_vendas', 'esgotado', 'encerrado', 'cancelado'
      )
    `);

    await queryRunner.createTable(
      new Table({
        name: "eventos",
        columns: [
          { name: "created_at", type: "timestamptz", default: "now()" },
          { name: "updated_at", type: "timestamptz", default: "now()" },
          { name: "deleted_at", type: "timestamptz", isNullable: true, default: null },
          {
            name: "uuid",
            type: "uuid",
            isPrimary: true,
            primaryKeyConstraintName: "PK_eventos",
            default: "gen_random_uuid()",
          },
          { name: "company_uuid", type: "uuid" },
          { name: "user_uuid", type: "uuid" },
          { name: "titulo", type: "varchar", length: "300" },
          { name: "slug", type: "varchar", length: "300", isUnique: true },
          { name: "descricao", type: "text", isNullable: true },
          { name: "banner_url", type: "varchar", length: "500", isNullable: true },
          { name: "data_inicio", type: "timestamptz" },
          { name: "data_fim", type: "timestamptz", isNullable: true },
          { name: "capacidade_total", type: "int", isNullable: true },
          { name: "local_nome", type: "varchar", length: "300", isNullable: true },
          { name: "local_endereco", type: "varchar", length: "500", isNullable: true },
          { name: "local_lat", type: "decimal", precision: 10, scale: 8, isNullable: true },
          { name: "local_lng", type: "decimal", precision: 11, scale: 8, isNullable: true },
          { name: "online", type: "boolean", default: false },
          { name: "link_online", type: "varchar", length: "500", isNullable: true },
          { name: "status", type: "evento_status", default: "'rascunho'" },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("eventos");
    await queryRunner.query(`DROP TYPE IF EXISTS evento_status`);
  }
}
