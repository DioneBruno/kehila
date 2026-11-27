import { MigrationInterface, QueryRunner } from "typeorm";

export class MigrationCreateImovelContaAnexos1792000000600 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS imovel_conta_anexos (
        created_at timestamp NOT NULL DEFAULT now(),
        deleted_at timestamp NULL,
        uuid uuid NOT NULL CONSTRAINT "PK_imovel_conta_anexos" PRIMARY KEY,
        company_uuid uuid NOT NULL REFERENCES auth_companies(uuid) ON DELETE CASCADE,
        conta_uuid uuid NOT NULL REFERENCES imovel_contas(uuid),
        tipo varchar NOT NULL CHECK (tipo IN ('documento', 'comprovante')),
        nome_arquivo varchar NOT NULL,
        caminho varchar NOT NULL,
        content_type varchar NOT NULL,
        tamanho integer NOT NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_imovel_conta_anexos_conta_uuid" ON imovel_conta_anexos (conta_uuid) WHERE deleted_at IS NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS imovel_conta_anexos`);
  }
}
