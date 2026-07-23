import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class MigrationCreatePagamentoNotificacoesMigration1784771577535 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "financeiro_pagamento_notificacoes",
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
            primaryKeyConstraintName: "PK_financeiro_pagamento_notificacoes",
            default: "gen_random_uuid()",
          },
          { name: "company_uuid", type: "uuid" },
          { name: "pagamento_uuid", type: "uuid" },
          { name: "tipo", type: "varchar" },
          { name: "data_envio", type: "timestamp" },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}

