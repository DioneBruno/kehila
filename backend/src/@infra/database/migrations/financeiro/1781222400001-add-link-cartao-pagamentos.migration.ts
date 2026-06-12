import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLinkCartaoPagamentos1781222400001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE financeiro_pagamentos ADD COLUMN IF NOT EXISTS link_cartao varchar(300)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE financeiro_pagamentos DROP COLUMN IF EXISTS link_cartao`);
  }
}
