import { MigrationInterface, QueryRunner } from "typeorm";

export class MigrationCreateMigration1781994114445 implements MigrationInterface {
  name?: string | undefined;
  transaction?: boolean | undefined;
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE auth_users ADD COLUMN IF NOT EXISTS cep varchar(10)`);
    await queryRunner.query(`ALTER TABLE auth_users ADD COLUMN IF NOT EXISTS endereco varchar(255)`);
    await queryRunner.query(`ALTER TABLE auth_users ADD COLUMN IF NOT EXISTS endereco_numero varchar(50)`);
    await queryRunner.query(`ALTER TABLE auth_users ADD COLUMN IF NOT EXISTS bairro varchar(50)`);
    await queryRunner.query(`ALTER TABLE auth_users ADD COLUMN IF NOT EXISTS cidade varchar(100)`);
    await queryRunner.query(`ALTER TABLE auth_users ADD COLUMN IF NOT EXISTS uf varchar(2)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
