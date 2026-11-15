import { MigrationInterface, QueryRunner } from "typeorm";

export class MigrationCreateAuthPessoasVinculosMigration1790700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS auth_pessoas_vinculos (
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now(),
        uuid uuid NOT NULL CONSTRAINT "PK_auth_pessoas_vinculos" PRIMARY KEY,
        company_uuid uuid NOT NULL,
        pessoa_uuid uuid NOT NULL REFERENCES auth_pessoas(uuid) ON DELETE CASCADE,
        pessoa_vinculada_uuid uuid NOT NULL REFERENCES auth_pessoas(uuid) ON DELETE CASCADE,
        tipo varchar NOT NULL,
        CONSTRAINT "UQ_auth_pessoas_vinculos_par" UNIQUE (company_uuid, pessoa_uuid, pessoa_vinculada_uuid),
        CONSTRAINT "CK_auth_pessoas_vinculos_self" CHECK (pessoa_uuid <> pessoa_vinculada_uuid)
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_auth_pessoas_vinculos_pessoa" ON auth_pessoas_vinculos (company_uuid, pessoa_uuid)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS auth_pessoas_vinculos`);
  }
}
