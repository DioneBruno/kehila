import dataSource from "src/@infra/database/datasource";
import { EditarFormIngressoUsecase } from "../editarFormIngresso.usecase";
import { EditarFormIngressoRepository } from "../editarFormIngressoRepository";
import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";

const companyUuid = "9ca1bb79-f51e-4441-8a0a-ace75c01fab6";
let repo: EditarFormIngressoRepository;

describe("Deve testar EditarFormIngressoUsecase", () => {
  beforeAll(async () => {
    await dataSource.initialize();
    const connectionHub = new ConnectionHub({ database: dataSource });
    repo = new EditarFormIngressoRepository(connectionHub);
  });
  beforeEach(async () => {
    await dataSource.query(`DELETE FROM evento_ingressos WHERE company_uuid = '${companyUuid}'`);
  });
  afterAll(async () => {
    await dataSource.query(`DELETE FROM evento_ingressos WHERE company_uuid = '${companyUuid}'`);
    await dataSource.destroy();
  });

  test("Deve alterar os dados do Ingresso", async () => {
    const eventoUuid = "c31e5f9d-d8cd-4f9a-b9fe-80dd671dc0b8";
    const pedidoUuid = "90a62a60-4a7e-4fec-803b-58f8f225bf44";
    const ingressoUuid = "014c8ceb-46d5-465f-b934-9ebc03559a7b";

    await dataSource.query(`INSERT INTO evento_ingressos (uuid, company_uuid, evento_uuid, tipo_ingresso_uuid, pedido_uuid, codigo)
      VALUES ('${ingressoUuid}', '${companyUuid}', '${eventoUuid}', '${eventoUuid}', '${pedidoUuid}', 1001)`);

    const usecase = new EditarFormIngressoUsecase(repo);
    const input = {
      pedidoUuid,
      ingressoUuid,
      pessoaNome: "Dione Almeida",
      pessoaDocumento: "12345678909",
      pessoaEmail: "pessoaEmail",
      pessoaTelefone: "11999999999",
      pessoaUf: "SP",
      pessoaCidade: "São Paulo",
      formData: { teste: "DadosTeste" },
    };
    await usecase.execute(input);

    const [ingressoModel] = await dataSource.query(`SELECT * FROM evento_ingressos WHERE uuid = '${ingressoUuid}'`);
    expect(ingressoModel.pessoa_nome).toBe(input.pessoaNome);
    expect(ingressoModel.pessoa_documento).toBe(input.pessoaDocumento);
    expect(ingressoModel.pessoa_email).toBe(input.pessoaEmail);
    expect(ingressoModel.pessoa_telefone).toBe(input.pessoaTelefone);
    expect(ingressoModel.pessoa_uf).toBe(input.pessoaUf);
    expect(ingressoModel.pessoa_cidade).toBe(input.pessoaCidade);
    expect(ingressoModel.form_data).toEqual(input.formData);
  });

  test("Caso todos os campos tiverem preenchidos, deve validar o form e marcar como valido", async () => {
    const eventoUuid = "c31e5f9d-d8cd-4f9a-b9fe-80dd671dc0b8";
    const pedidoUuid = "90a62a60-4a7e-4fec-803b-58f8f225bf44";
    const ingressoUuid = "014c8ceb-46d5-465f-b934-9ebc03559a7b";

    await dataSource.query(`INSERT INTO evento_ingressos (uuid, company_uuid, evento_uuid, tipo_ingresso_uuid, pedido_uuid, codigo)
      VALUES ('${ingressoUuid}', '${companyUuid}', '${eventoUuid}', '${eventoUuid}', '${pedidoUuid}', 1001)`);

    const usecase = new EditarFormIngressoUsecase(repo);
    const input = {
      pedidoUuid,
      ingressoUuid,
      pessoaNome: "Dione Almeida",
      pessoaDocumento: "12345678909",
      pessoaEmail: "pessoaEmail",
      pessoaTelefone: "11999999999",
      pessoaUf: "SP",
      pessoaCidade: "São Paulo",
    };
    await usecase.execute(input);

    const [ingressoModel] = await dataSource.query(`SELECT * FROM evento_ingressos WHERE uuid = '${ingressoUuid}'`);
    expect(ingressoModel.form_data_valido).toBeTruthy();
  });

  test("Caso um campo não tiver preenchido, deve invalidar o form", async () => {
    const eventoUuid = "c31e5f9d-d8cd-4f9a-b9fe-80dd671dc0b8";
    const pedidoUuid = "90a62a60-4a7e-4fec-803b-58f8f225bf44";
    const ingressoUuid = "014c8ceb-46d5-465f-b934-9ebc03559a7b";

    await dataSource.query(`INSERT INTO evento_ingressos (uuid, company_uuid, evento_uuid, tipo_ingresso_uuid, pedido_uuid, codigo)
      VALUES ('${ingressoUuid}', '${companyUuid}', '${eventoUuid}', '${eventoUuid}', '${pedidoUuid}', 1001)`);

    const usecase = new EditarFormIngressoUsecase(repo);
    const input = {
      pedidoUuid,
      ingressoUuid,
      pessoaNome: "Dione Almeida",
      pessoaDocumento: "12345678909",
      pessoaTelefone: "11999999999",
      pessoaUf: "SP",
      pessoaCidade: "São Paulo",
    };
    await usecase.execute(input);

    const [ingressoModel] = await dataSource.query(`SELECT * FROM evento_ingressos WHERE uuid = '${ingressoUuid}'`);
    expect(ingressoModel.form_data_valido).not.toBeTruthy();
  });
});
