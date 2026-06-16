import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddSuporteContatoEventos1781222400003 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns("eventos", [
      new TableColumn({ name: "suporte_email", type: "varchar", length: "300", isNullable: true }),
      new TableColumn({ name: "suporte_telefone", type: "varchar", length: "30", isNullable: true }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn("eventos", "suporte_telefone");
    await queryRunner.dropColumn("eventos", "suporte_email");
  }
}
