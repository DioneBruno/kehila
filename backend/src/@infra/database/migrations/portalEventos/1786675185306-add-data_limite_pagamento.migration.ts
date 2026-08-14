import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class MigrationDataLimitePagamentoMigration1786675185306 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn("eventos", new TableColumn({ name: "data_limite_pagamento", type: "timestamp", isNullable: true }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn("eventos", "data_limite_pagamento");
  }
}
