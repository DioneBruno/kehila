import { MigrationInterface, QueryRunner } from "typeorm";

export class MigrationCreateApriscoPresencas1791000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS aprisco_presencas (
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now(),
        deleted_at timestamp NULL DEFAULT NULL,
        uuid uuid NOT NULL DEFAULT gen_random_uuid() CONSTRAINT "PK_aprisco_presencas" PRIMARY KEY,
        company_uuid uuid NOT NULL,
        aprisco_uuid uuid NOT NULL REFERENCES apriscos(uuid) ON DELETE CASCADE,
        tipo varchar NOT NULL CONSTRAINT "CK_aprisco_presencas_tipo" CHECK (tipo IN ('INTEGRANTE', 'CRIANCA', 'VISITANTE')),
        pessoa_uuid uuid NULL REFERENCES auth_pessoas(uuid) ON DELETE CASCADE,
        data_reuniao date NOT NULL,
        presenca boolean NOT NULL DEFAULT true,
        quantidade integer NULL CONSTRAINT "CK_aprisco_presencas_quantidade" CHECK (quantidade IS NULL OR quantidade >= 0)
      )
    `);
    // Um único registro ativo por pessoa (ou por tipo, quando sem pessoa) em cada reunião
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_aprisco_presencas_ativo" ON aprisco_presencas
        (company_uuid, aprisco_uuid, data_reuniao, tipo, COALESCE(pessoa_uuid, '00000000-0000-0000-0000-000000000000'::uuid))
        WHERE deleted_at IS NULL
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_aprisco_presencas_pessoa" ON aprisco_presencas (company_uuid, pessoa_uuid)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS aprisco_presencas`);
  }
}
