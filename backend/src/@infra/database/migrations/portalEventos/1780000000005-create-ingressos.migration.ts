import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreateIngressos1780000000005 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE ingresso_status AS ENUM (
        'pago', 'usado', 'cancelado', 'transferido'
      )
    `);

    await queryRunner.createTable(
      new Table({
        name: "ingressos",
        columns: [
          { name: "created_at", type: "timestamptz", default: "now()" },
          { name: "updated_at", type: "timestamptz", default: "now()" },
          {
            name: "uuid",
            type: "uuid",
            isPrimary: true,
            primaryKeyConstraintName: "PK_ingressos",
            default: "gen_random_uuid()",
          },
          { name: "company_uuid", type: "uuid" },
          { name: "evento_uuid", type: "uuid" },
          { name: "tipo_ingresso_uuid", type: "uuid" },
          { name: "pedido_uuid", type: "uuid" },
          { name: "user_uuid", type: "uuid" },
          { name: "codigo", type: "varchar", length: "20", isUnique: true },
          { name: "assinatura", type: "text" },
          { name: "status", type: "ingresso_status", default: "'pago'" },
          { name: "transferido_de", type: "uuid", isNullable: true },
          { name: "checkin_em", type: "timestamptz", isNullable: true },
          { name: "checkin_operador_uuid", type: "uuid", isNullable: true },
        ],
      }),
    );

    await queryRunner.createForeignKey(
      "ingressos",
      new TableForeignKey({
        name: "FK_ingressos_pedidos",
        columnNames: ["pedido_uuid"],
        referencedTableName: "evento_pedidos",
        referencedColumnNames: ["uuid"],
      }),
    );

    await queryRunner.createForeignKey(
      "ingressos",
      new TableForeignKey({
        name: "FK_ingressos_tipos_ingresso",
        columnNames: ["tipo_ingresso_uuid"],
        referencedTableName: "evento_lote_tipos_ingresso",
        referencedColumnNames: ["uuid"],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("ingressos");
    await queryRunner.query(`DROP TYPE IF EXISTS ingresso_status`);
  }
}
