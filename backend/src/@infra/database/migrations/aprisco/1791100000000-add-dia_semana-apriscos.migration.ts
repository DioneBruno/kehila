import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

/**
 * Separa o "horario" (antes texto livre, ex.: "Quinta-feira às 20h") em dia_semana + horario (HH:MM).
 * Converte o que for possível dos valores antigos; o que não for reconhecido fica null.
 */
export class MigrationAddDiaSemanaApriscos1791100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn("apriscos", new TableColumn({ name: "dia_semana", type: "varchar", isNullable: true }));

    await queryRunner.query(`
      UPDATE apriscos SET dia_semana = CASE
        WHEN horario ~* 'seg' THEN 'Segunda'
        WHEN horario ~* 'ter' THEN 'Terça'
        WHEN horario ~* 'qua' THEN 'Quarta'
        WHEN horario ~* 'qui' THEN 'Quinta'
        WHEN horario ~* 'sex' THEN 'Sexta'
        WHEN horario ~* 's[áa]b' THEN 'Sábado'
        WHEN horario ~* 'dom' THEN 'Domingo'
      END
      WHERE horario IS NOT NULL
    `);

    // "20h", "20h30", "19:30", "8 h" → HH:MM
    await queryRunner.query(`
      UPDATE apriscos SET horario = (
        SELECT CASE
          WHEN m[1]::int BETWEEN 0 AND 23 AND COALESCE(m[2], '00')::int BETWEEN 0 AND 59
            THEN LPAD(m[1], 2, '0') || ':' || COALESCE(m[2], '00')
        END
        FROM regexp_match(horario, '(\\d{1,2})\\s*(?:h|:)\\s*(\\d{2})?', 'i') AS m
      )
      WHERE horario IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`UPDATE apriscos SET horario = CONCAT_WS(' ', dia_semana, horario) WHERE dia_semana IS NOT NULL`);
    await queryRunner.dropColumn("apriscos", "dia_semana");
  }
}
