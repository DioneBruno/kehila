import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class MigrationCreatePagamentosMigration1779555472216 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE financeiro_cobrancas ADD CONSTRAINT PK_financeiro_cobrancas PRIMARY KEY (uuid)`);

    await queryRunner.createTable(
      new Table({
        name: "financeiro_pagamentos",
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
            primaryKeyConstraintName: "PK_financeiro_pagamentos",
            default: "gen_random_uuid()",
          },
          { name: "company_uuid", type: "uuid" },
          { name: "user_uuid", type: "uuid" },
          { name: "cobanca_uuid", type: "uuid" },
          { name: "forma_pagamento", type: "varchar" },
          { name: "vencimento", type: "varchar", isNullable: true },
          { name: "valor", type: "float8", default: 0 },
          { name: "valor_com_desc_gateway", type: "float8", default: 0 },
          { name: "pago_em", type: "date", isNullable: true },
          { name: "valor_pago", type: "decimal", precision: 10, scale: 2, default: 0 },
          { name: "status", type: "varchar", default: "'pendente'" },
          { name: "conta_bancaria_uuid", type: "uuid", isNullable: true },
          { name: "banco_ref", type: "varchar", isNullable: true },
          { name: "nosso_numero", type: "varchar", isNullable: true },
          { name: "codigo_barras", type: "varchar", length: "300", isNullable: true },
          { name: "linha_digitavel", type: "varchar", length: "300", isNullable: true },
          { name: "link_boleto", type: "varchar", length: "300", isNullable: true },
          { name: "pix", type: "text", isNullable: true },
        ],
        foreignKeys: [
          {
            name: "fk_pagamentos_cobranca",
            columnNames: ["cobanca_uuid"],
            referencedTableName: "financeiro_cobrancas",
            referencedColumnNames: ["uuid"],
            onDelete: "CASCADE",
          },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("financeiro_pagamentos");
    await queryRunner.query(`ALTER TABLE financeiro_cobrancas DROP CONSTRAINT PK_financeiro_cobrancas`);
  }
}
