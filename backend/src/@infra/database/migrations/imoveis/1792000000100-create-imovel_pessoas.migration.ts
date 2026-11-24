import { MigrationInterface, QueryRunner } from "typeorm";

export class MigrationCreateImovelPessoas1792000000100 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS imovel_pessoas (
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now(),
        deleted_at timestamp NULL,
        uuid uuid NOT NULL CONSTRAINT "PK_imovel_pessoas" PRIMARY KEY,
        company_uuid uuid NOT NULL REFERENCES auth_companies(uuid) ON DELETE CASCADE,
        tipo varchar(2) NOT NULL CHECK (tipo IN ('PF', 'PJ')),
        documento varchar(14) NOT NULL,
        nome varchar NOT NULL,
        nome_fantasia varchar NULL,
        rg_ie varchar NULL,
        email varchar NULL,
        telefone varchar NULL,
        endereco_cep varchar NULL,
        endereco_logradouro varchar NULL,
        endereco_numero varchar NULL,
        endereco_complemento varchar NULL,
        endereco_bairro varchar NULL,
        endereco_cidade varchar NULL,
        endereco_uf varchar(2) NULL,
        observacoes text NULL,
        eh_proprietario boolean NOT NULL DEFAULT false,
        eh_inquilino boolean NOT NULL DEFAULT false,
        eh_fiador boolean NOT NULL DEFAULT false
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "UQ_imovel_pessoas_company_documento" ON imovel_pessoas (company_uuid, documento) WHERE deleted_at IS NULL`,
    );
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_imovel_pessoas_company" ON imovel_pessoas (company_uuid) WHERE deleted_at IS NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS imovel_pessoas`);
  }
}
