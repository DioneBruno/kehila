import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddPessoaPaisIngressos1781222400002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      "evento_ingressos",
      new TableColumn({ name: "pessoa_pais", type: "varchar", isNullable: true }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn("evento_ingressos", "pessoa_pais");
  }
}
