import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreateEventoPedidos1780000000004 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE pedido_status AS ENUM (
        'pendente', 'pago', 'cancelado', 'reembolsado', 'expirado'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE forma_pagamento AS ENUM (
        'cartao', 'pix', 'boleto', 'cortesia'
      )
    `);

    await queryRunner.createTable(
      new Table({
        name: "evento_pedidos",
        columns: [
          { name: "created_at", type: "timestamptz", default: "now()" },
          { name: "updated_at", type: "timestamptz", default: "now()" },
          {
            name: "uuid",
            type: "uuid",
            isPrimary: true,
            primaryKeyConstraintName: "PK_evento_pedidos",
            default: "gen_random_uuid()",
          },
          { name: "company_uuid", type: "uuid" },
          { name: "evento_uuid", type: "uuid" },
          { name: "user_uuid", type: "uuid" },
          { name: "idempotency_key", type: "varchar", length: "100", isUnique: true },
          { name: "status", type: "pedido_status", default: "'pendente'" },
          { name: "valor_bruto", type: "decimal", precision: 10, scale: 2 },
          { name: "desconto", type: "decimal", precision: 10, scale: 2, default: 0 },
          { name: "valor_liquido", type: "decimal", precision: 10, scale: 2 },
          { name: "forma_pagamento", type: "forma_pagamento", isNullable: true },
          { name: "gateway_id", type: "varchar", length: "200", isNullable: true },
          { name: "expires_at", type: "timestamptz", isNullable: true },
          { name: "pago_em", type: "timestamptz", isNullable: true },
        ],
      }),
    );

    await queryRunner.createForeignKey(
      "evento_pedidos",
      new TableForeignKey({
        name: "FK_pedidos_eventos",
        columnNames: ["evento_uuid"],
        referencedTableName: "eventos",
        referencedColumnNames: ["uuid"],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("evento_pedidos");
    await queryRunner.query(`DROP TYPE IF EXISTS pedido_status`);
    await queryRunner.query(`DROP TYPE IF EXISTS forma_pagamento`);
  }
}
