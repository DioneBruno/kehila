import { MigrationInterface, QueryRunner } from "typeorm";

export class MigrationCreateImovelContas1792000000500 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS imovel_contas (
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now(),
        deleted_at timestamp NULL,
        uuid uuid NOT NULL CONSTRAINT "PK_imovel_contas" PRIMARY KEY,
        company_uuid uuid NOT NULL REFERENCES auth_companies(uuid) ON DELETE CASCADE,
        tipo varchar NOT NULL CHECK (tipo IN ('encargo', 'despesa', 'guia')),
        categoria varchar NOT NULL,
        esfera varchar NULL CHECK (esfera IN ('municipal', 'estadual', 'federal')),
        descricao varchar NULL,
        proprietario_uuid uuid NOT NULL REFERENCES imovel_pessoas(uuid),
        imovel_uuid uuid NULL REFERENCES imovel_imoveis(uuid),
        contrato_uuid uuid NULL REFERENCES imovel_contratos(uuid),
        responsavel varchar NOT NULL DEFAULT 'proprietario' CHECK (responsavel IN ('proprietario', 'inquilino')),
        competencia date NULL,
        vencimento date NOT NULL,
        valor decimal(12,2) NOT NULL CHECK (valor > 0),
        pago_em date NULL,
        valor_pago decimal(12,2) NULL CHECK (valor_pago >= 0),
        fornecedor varchar NULL,
        documento_numero varchar NULL,
        grupo_uuid uuid NULL,
        parcela_numero smallint NULL,
        parcela_total smallint NULL,
        observacoes text NULL,
        CONSTRAINT "CK_imovel_contas_pagamento" CHECK ((pago_em IS NULL) = (valor_pago IS NULL)),
        CONSTRAINT "CK_imovel_contas_contrato_imovel" CHECK (contrato_uuid IS NULL OR imovel_uuid IS NOT NULL),
        CONSTRAINT "CK_imovel_contas_inquilino_contrato" CHECK (responsavel = 'proprietario' OR contrato_uuid IS NOT NULL)
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_imovel_contas_vencimento" ON imovel_contas (company_uuid, vencimento) WHERE deleted_at IS NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_imovel_contas_proprietario_uuid" ON imovel_contas (proprietario_uuid) WHERE deleted_at IS NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_imovel_contas_imovel_uuid" ON imovel_contas (imovel_uuid) WHERE deleted_at IS NULL AND imovel_uuid IS NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_imovel_contas_contrato_uuid" ON imovel_contas (contrato_uuid) WHERE deleted_at IS NULL AND contrato_uuid IS NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_imovel_contas_grupo_uuid" ON imovel_contas (grupo_uuid) WHERE deleted_at IS NULL AND grupo_uuid IS NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS imovel_contas`);
  }
}
