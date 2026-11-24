import { MigrationInterface, QueryRunner } from "typeorm";

export class MigrationCreateImovelContratos1792000000300 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS imovel_contratos (
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now(),
        deleted_at timestamp NULL,
        uuid uuid NOT NULL CONSTRAINT "PK_imovel_contratos" PRIMARY KEY,
        company_uuid uuid NOT NULL REFERENCES auth_companies(uuid) ON DELETE CASCADE,
        imovel_uuid uuid NOT NULL REFERENCES imovel_imoveis(uuid),
        inquilino_uuid uuid NOT NULL REFERENCES imovel_pessoas(uuid),
        numero varchar NULL,
        inicio date NOT NULL,
        fim date NOT NULL,
        valor_aluguel decimal(12,2) NOT NULL CHECK (valor_aluguel >= 0),
        dia_vencimento smallint NOT NULL CHECK (dia_vencimento BETWEEN 1 AND 31),
        indice_reajuste varchar NOT NULL CHECK (indice_reajuste IN ('IGPM', 'IPCA', 'INPC', 'IGPDI', 'nenhum')),
        mes_reajuste smallint NULL CHECK (mes_reajuste BETWEEN 1 AND 12),
        multa_atraso_pct decimal(5,2) NOT NULL DEFAULT 2.00,
        juros_mes_pct decimal(5,2) NOT NULL DEFAULT 1.00,
        desconto_pontualidade_pct decimal(5,2) NULL,
        multa_rescisoria_meses decimal(4,1) NULL,
        garantia_tipo varchar NOT NULL CHECK (garantia_tipo IN ('fiador', 'caucao', 'seguro_fianca', 'titulo_capitalizacao', 'nenhuma')),
        garantia_valor decimal(12,2) NULL,
        fiador_uuid uuid NULL REFERENCES imovel_pessoas(uuid),
        status varchar NOT NULL DEFAULT 'vigente' CHECK (status IN ('vigente', 'encerrado', 'rescindido')),
        encerrado_em date NULL,
        observacoes text NULL,
        CONSTRAINT "CK_imovel_contratos_fim_inicio" CHECK (fim > inicio)
      )
    `);
    // Rede de segurança do lock: no máximo um contrato vigente por imóvel.
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "UQ_imovel_contratos_imovel_vigente" ON imovel_contratos (imovel_uuid) WHERE status = 'vigente' AND deleted_at IS NULL`,
    );
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_imovel_contratos_company" ON imovel_contratos (company_uuid) WHERE deleted_at IS NULL`);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_imovel_contratos_inquilino" ON imovel_contratos (inquilino_uuid) WHERE deleted_at IS NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_imovel_contratos_fiador" ON imovel_contratos (fiador_uuid) WHERE deleted_at IS NULL AND fiador_uuid IS NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS imovel_contratos`);
  }
}
