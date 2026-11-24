import { MigrationInterface, QueryRunner } from "typeorm";

export class MigrationCreateImovelImoveis1792000000200 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS imovel_imoveis (
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now(),
        deleted_at timestamp NULL,
        uuid uuid NOT NULL CONSTRAINT "PK_imovel_imoveis" PRIMARY KEY,
        company_uuid uuid NOT NULL REFERENCES auth_companies(uuid) ON DELETE CASCADE,
        proprietario_uuid uuid NOT NULL REFERENCES imovel_pessoas(uuid),
        identificacao varchar NOT NULL,
        tipo varchar NOT NULL CHECK (tipo IN ('casa', 'apartamento', 'sala_comercial', 'loja', 'galpao', 'terreno', 'outro')),
        finalidade varchar NOT NULL CHECK (finalidade IN ('residencial', 'comercial')),
        endereco_cep varchar NULL,
        endereco_logradouro varchar NULL,
        endereco_numero varchar NULL,
        endereco_complemento varchar NULL,
        endereco_bairro varchar NULL,
        endereco_cidade varchar NULL,
        endereco_uf varchar(2) NULL,
        inscricao_iptu varchar NULL,
        matricula varchar NULL,
        cartorio varchar NULL,
        area_m2 decimal(12,2) NULL,
        situacao varchar NOT NULL DEFAULT 'livre' CHECK (situacao IN ('livre', 'alugado', 'reforma', 'inativo')),
        observacoes text NULL
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_imovel_imoveis_company" ON imovel_imoveis (company_uuid) WHERE deleted_at IS NULL`);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_imovel_imoveis_proprietario" ON imovel_imoveis (proprietario_uuid) WHERE deleted_at IS NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS imovel_imoveis`);
  }
}
