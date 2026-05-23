import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateEventos1779545498231 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "eventos",
        columns: [
          { name: "created_at", type: "timestamp", default: "now()" },
          { name: "updated_at", type: "timestamp", default: "now()" },
          { name: "deleted_at", type: "timestamp", isNullable: true, default: null },
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
          { name: "data_inicio", type: "timestamp" },
          { name: "data_fim", type: "timestamp", isNullable: true },
          { name: "capacidade_total", type: "int", isNullable: true },
          { name: "local_nome", type: "varchar", length: "300", isNullable: true },
          { name: "local_endereco", type: "varchar", length: "500", isNullable: true },
          { name: "local_lat", type: "decimal", precision: 10, scale: 8, isNullable: true },
          { name: "local_lng", type: "decimal", precision: 11, scale: 8, isNullable: true },
          { name: "online", type: "boolean", default: false },
          { name: "link_online", type: "varchar", length: "500", isNullable: true },
          { name: "status", type: "varchar", default: "'rascunho'" },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("eventos");
  }
}
