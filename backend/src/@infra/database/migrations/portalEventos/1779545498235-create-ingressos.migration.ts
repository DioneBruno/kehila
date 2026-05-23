import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateIngressos1779545498235 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "evento_ingressos",
        columns: [
          { name: "created_at", type: "timestamptz", default: "now()" },
          { name: "updated_at", type: "timestamptz", default: "now()" },
          {
            name: "uuid",
            type: "uuid",
            isPrimary: true,
            primaryKeyConstraintName: "PK_evento_ingressos",
            default: "gen_random_uuid()",
          },
          { name: "company_uuid", type: "uuid" },
          { name: "evento_uuid", type: "uuid" },
          { name: "tipo_ingresso_uuid", type: "uuid" },
          { name: "pedido_uuid", type: "uuid" },
          { name: "user_uuid", type: "uuid" },
          { name: "codigo", type: "varchar", length: "20", isUnique: true },
          { name: "pessoa_nome", type: "varchar", isNullable: true },
          { name: "pessoa_email", type: "varchar", isNullable: true },
          { name: "pessoa_documento", type: "varchar", isNullable: true },
          { name: "assinatura", type: "text" },
          { name: "status", type: "ingresso_status", default: "'pendente'" },
          { name: "transferido_de", type: "uuid", isNullable: true },
          { name: "transferido_para", type: "uuid", isNullable: true },
          { name: "checkin_em", type: "timestamptz", isNullable: true },
          { name: "checkin_operador_uuid", type: "uuid", isNullable: true },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("evento_ingressos");
  }
}
