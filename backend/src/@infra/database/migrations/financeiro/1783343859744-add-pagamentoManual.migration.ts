import { MigrationInterface, QueryRunner } from "typeorm";

export class MigrationCreateMigration1783343859744 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE financeiro_pagamentos ADD COLUMN IF NOT EXISTS descricao varchar(350)`);
    await queryRunner.query(`ALTER TABLE financeiro_pagamentos ADD COLUMN IF NOT EXISTS pago_manual_data timestamp`);
    await queryRunner.query(`ALTER TABLE financeiro_pagamentos ADD COLUMN IF NOT EXISTS pago_manual_user_uuid uuid`);
    await queryRunner.query(`ALTER TABLE financeiro_pagamentos ADD COLUMN IF NOT EXISTS pago_manual_descricao varchar(350)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
