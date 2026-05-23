import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateEventoPedidos1779545498234 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "evento_pedidos",
        columns: [
          { name: "created_at", type: "timestamp", default: "now()" },
          { name: "updated_at", type: "timestamp", default: "now()" },
          { name: "deleted_at", type: "timestamp", isNullable: true, default: null },
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
          { name: "expires_at", type: "timestamp", isNullable: true },
          { name: "pago_em", type: "timestamp", isNullable: true },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("evento_pedidos");
  }
}
