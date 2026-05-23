import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateCupons1779545498237 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "evento_cupons",
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
            primaryKeyConstraintName: "PK_evento_cupons",
            default: "gen_random_uuid()",
          },
          { name: "company_uuid", type: "uuid" },
          { name: "evento_uuid", type: "uuid" },
          { name: "tipo_ingresso_uuid", type: "uuid", isNullable: true },
          { name: "codigo", type: "varchar", length: "50", isUnique: true },
          { name: "tipo", type: "varchar" },
          { name: "valor", type: "decimal", precision: 10, scale: 2 },
          { name: "usos_maximos", type: "int", isNullable: true },
          { name: "usos_por_usuario", type: "int", default: 1 },
          { name: "usos_atuais", type: "int", default: 0 },
          { name: "valido_ate", type: "timestamp", isNullable: true },
          { name: "ativo", type: "boolean", default: true },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("evento_cupons");
  }
}
