import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPagamentosQuantidadeCobrancas1781983983295 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE financeiro_cobrancas ADD COLUMN IF NOT EXISTS pagamentos_quantidade int DEFAULT 0`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE financeiro_cobrancas DROP COLUMN IF EXISTS pagamentos_quantidade`);
  }
}
