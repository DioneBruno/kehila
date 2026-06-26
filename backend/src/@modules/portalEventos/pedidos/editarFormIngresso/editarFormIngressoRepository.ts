import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import { IngressoEntity } from "./ingresso.entity";

export class EditarFormIngressoRepository {
  constructor(readonly connectionHub: ConnectionHub) {}

  async buscarIngresso(ingressoUuid: string): Promise<IngressoEntity | null> {
    const [ingressoModel] = await this.connectionHub.database!.query(
      `SELECT 
        ingressos.uuid,
        ingressos.company_uuid,
        ingressos.evento_uuid,
        ingressos.tipo_ingresso_uuid,
        ingressos.pedido_uuid,
        ingressos.form_data_valido,
        ingressos.pessoa_nome,
        ingressos.pessoa_documento,
        ingressos.pessoa_email,
        ingressos.pessoa_telefone,
        ingressos.pessoa_pais,
        ingressos.pessoa_uf,
        ingressos.pessoa_cidade
      FROM evento_ingressos ingressos
      WHERE ingressos.deleted_at IS NULL
      AND ingressos.uuid = $1`,
      [ingressoUuid],
    );

    if (!ingressoModel) return null;

    const ingresso = new IngressoEntity({
      uuid: ingressoModel.uuid,
      companyUuid: ingressoModel.company_uuid,
      eventoUuid: ingressoModel.evento_uuid,
      tipoIngressoUuid: ingressoModel.tipo_ingresso_uuid,
      pedidoUuid: ingressoModel.pedido_uuid,
      formDataValido: ingressoModel.form_data_valido,
      pessoaNome: ingressoModel.pessoa_nome,
      pessoaDocumento: ingressoModel.pessoa_documento,
      pessoaEmail: ingressoModel.pessoa_email,
      pessoaTelefone: ingressoModel.pessoa_telefone,
      pessoaPais: ingressoModel.pessoa_pais,
      pessoaUf: ingressoModel.pessoa_uf,
      pessoaCidade: ingressoModel.pessoa_cidade,
    });

    return ingresso;
  }

  async existeOutroIngressoComDocumento(pedidoUuid: string, pessoaDocumento: string, ingressoUuid: string): Promise<boolean> {
    const [ingressoModel] = await this.connectionHub.database!.query(
      `SELECT uuid FROM evento_ingressos
      WHERE deleted_at IS NULL
      AND pedido_uuid = $1
      AND pessoa_documento = $2
      AND uuid != $3`,
      [pedidoUuid, pessoaDocumento, ingressoUuid],
    );

    return !!ingressoModel;
  }

  async salvarIngresso(ingresso: IngressoEntity) {
    await this.connectionHub.database!.query(
      `UPDATE evento_ingressos SET
        pessoa_nome = $2,
        pessoa_documento = $3,
        pessoa_email = $4,
        pessoa_telefone = $5,
        pessoa_pais = $6,
        pessoa_uf = $7,
        pessoa_cidade = $8,
        form_data_valido = $9,
        form_data = $10
      WHERE uuid = $1`,
      [
        ingresso.uuid(),
        ingresso.pessoaNome(),
        ingresso.pessoaDocumento(),
        ingresso.pessoaEmail(),
        ingresso.pessoaTelefone(),
        ingresso.pessoaPais(),
        ingresso.pessoaUf(),
        ingresso.pessoaCidade(),
        ingresso.formDataValido(),
        ingresso.formData(),
      ],
    );
  }
}
