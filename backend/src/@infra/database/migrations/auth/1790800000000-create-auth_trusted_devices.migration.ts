import { MigrationInterface, QueryRunner } from "typeorm";

export class MigrationCreateAuthTrustedDevices1790800000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS auth_trusted_devices (
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now(),
        uuid uuid NOT NULL CONSTRAINT "PK_auth_trusted_devices" PRIMARY KEY,
        user_uuid uuid NOT NULL REFERENCES auth_users(uuid) ON DELETE CASCADE,
        company_uuid uuid NOT NULL REFERENCES auth_companies(uuid) ON DELETE CASCADE,
        token_hash varchar NOT NULL CONSTRAINT "UQ_auth_trusted_devices_token_hash" UNIQUE,
        previous_token_hash varchar NULL,
        rotated_at timestamp NULL,
        device_name varchar NULL,
        last_used_at timestamp NOT NULL DEFAULT now(),
        expires_at timestamp NOT NULL,
        revoked_at timestamp NULL
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_auth_trusted_devices_previous" ON auth_trusted_devices (company_uuid, previous_token_hash)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_auth_trusted_devices_user" ON auth_trusted_devices (user_uuid)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS auth_trusted_devices`);
  }
}
