import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOrdemToLoteTiposIngresso1779545498234 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE evento_lote_tipos_ingresso ADD COLUMN IF NOT EXISTS ordem INT NOT NULL DEFAULT 0`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE evento_lote_tipos_ingresso DROP COLUMN IF EXISTS ordem`);
  }
}
