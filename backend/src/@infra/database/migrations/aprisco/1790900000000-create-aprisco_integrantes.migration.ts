import { MigrationInterface, QueryRunner } from "typeorm";

export class MigrationCreateApriscoIntegrantes1790900000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS aprisco_integrantes (
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now(),
        deleted_at timestamp NULL DEFAULT NULL,
        uuid uuid NOT NULL DEFAULT gen_random_uuid() CONSTRAINT "PK_aprisco_integrantes" PRIMARY KEY,
        company_uuid uuid NOT NULL,
        aprisco_uuid uuid NOT NULL REFERENCES apriscos(uuid) ON DELETE CASCADE,
        pessoa_uuid uuid NOT NULL REFERENCES auth_pessoas(uuid) ON DELETE CASCADE,
        papel varchar NOT NULL DEFAULT 'MEMBRO'
      )
    `);
    // Uma pessoa só pode ter um vínculo ativo por aprisco (soft delete libera novo vínculo)
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "UQ_aprisco_integrantes_ativo" ON aprisco_integrantes (company_uuid, aprisco_uuid, pessoa_uuid) WHERE deleted_at IS NULL`,
    );
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_aprisco_integrantes_pessoa" ON aprisco_integrantes (company_uuid, pessoa_uuid)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS aprisco_integrantes`);
  }
}
