import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAmbienteContaBancaria1781222400001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE financeiro_contas_bancarias ADD COLUMN IF NOT EXISTS ambiente varchar(10) DEFAULT 'HOMOLOG'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE financeiro_contas_bancarias DROP COLUMN IF EXISTS ambiente`);
  }
}
