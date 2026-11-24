import { MigrationInterface, QueryRunner } from "typeorm";

export class MigrationCreateImovelContratoEventos1792000000400 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS imovel_contrato_eventos (
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now(),
        deleted_at timestamp NULL,
        uuid uuid NOT NULL CONSTRAINT "PK_imovel_contrato_eventos" PRIMARY KEY,
        company_uuid uuid NOT NULL REFERENCES auth_companies(uuid) ON DELETE CASCADE,
        contrato_uuid uuid NOT NULL REFERENCES imovel_contratos(uuid) ON DELETE CASCADE,
        tipo varchar NOT NULL CHECK (tipo IN ('renovacao', 'aditivo', 'encerramento', 'rescisao')),
        data date NOT NULL,
        descricao text NOT NULL,
        valor_anterior decimal(12,2) NULL,
        valor_novo decimal(12,2) NULL,
        fim_anterior date NULL,
        fim_novo date NULL,
        criado_por_uuid uuid NULL REFERENCES auth_users(uuid) ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_imovel_contrato_eventos_contrato" ON imovel_contrato_eventos (contrato_uuid) WHERE deleted_at IS NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS imovel_contrato_eventos`);
  }
}
