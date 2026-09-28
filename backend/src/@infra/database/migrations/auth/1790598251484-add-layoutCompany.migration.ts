import { MigrationInterface, QueryRunner } from "typeorm";

export class MigrationAddLayoutCompanyMigration1790598251484 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE auth_companies ADD COLUMN IF NOT EXISTS layout JSONB default '{}'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
