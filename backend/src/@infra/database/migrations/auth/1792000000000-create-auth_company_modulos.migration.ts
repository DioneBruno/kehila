import { MigrationInterface, QueryRunner } from "typeorm";

export class MigrationCreateAuthCompanyModulos1792000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS auth_company_modulos (
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now(),
        deleted_at timestamp NULL,
        uuid uuid NOT NULL CONSTRAINT "PK_auth_company_modulos" PRIMARY KEY,
        company_uuid uuid NOT NULL REFERENCES auth_companies(uuid) ON DELETE CASCADE,
        modulo varchar(40) NOT NULL
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "UQ_auth_company_modulos_company_modulo" ON auth_company_modulos (company_uuid, modulo) WHERE deleted_at IS NULL`,
    );
    await queryRunner.query(`
      INSERT INTO auth_company_modulos (uuid, company_uuid, modulo)
      SELECT gen_random_uuid(), uuid, 'igreja' FROM auth_companies WHERE deleted_at IS NULL
      ON CONFLICT DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS auth_company_modulos`);
  }
}
