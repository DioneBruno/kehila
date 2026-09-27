import { MigrationInterface, QueryRunner } from "typeorm";

export class MigrationAddDataUsersMigration1790546306388 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE auth_users ADD COLUMN IF NOT EXISTS estado_civil varchar(10)`);
    await queryRunner.query(`ALTER TABLE auth_users ADD COLUMN IF NOT EXISTS data_nascimento date`);
    await queryRunner.query(`ALTER TABLE auth_users ADD COLUMN IF NOT EXISTS meta JSONB default '{}'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
