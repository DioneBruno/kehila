import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import { PessoaEntity } from "../pessoa.entity";
import { tratarDocumentoDuplicado } from "../documentoDuplicado";

export class IncluirPessoaRepository {
  constructor(readonly connections: ConnectionHub) {}

  async incluir(pessoa: PessoaEntity): Promise<void> {
    const p = pessoa.props;
    const e = p.endereco;
    try {
      await this.connections.database.query(
        `
        INSERT INTO imovel_pessoas (
          uuid, company_uuid, tipo, documento, nome, nome_fantasia, rg_ie, email, telefone,
          endereco_cep, endereco_logradouro, endereco_numero, endereco_complemento, endereco_bairro, endereco_cidade, endereco_uf,
          observacoes, eh_proprietario, eh_inquilino, eh_fiador
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
        `,
        [
          p.uuid,
          p.companyUuid,
          p.tipo,
          p.documento,
          p.nome,
          p.nomeFantasia,
          p.rgIe,
          p.email,
          p.telefone,
          e.cep,
          e.logradouro,
          e.numero,
          e.complemento,
          e.bairro,
          e.cidade,
          e.uf,
          p.observacoes,
          p.ehProprietario,
          p.ehInquilino,
          p.ehFiador,
        ],
      );
    } catch (erro) {
      tratarDocumentoDuplicado(erro);
    }
  }
}
