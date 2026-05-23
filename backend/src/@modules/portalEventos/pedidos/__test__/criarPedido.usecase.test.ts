import dataSource from "src/@infra/database/datasource";
import { CriarPedidoUsecase } from "../criarPedido.usecase";
import { CriarPedidoRepository } from "../criarPedidoRepository";
import { ConnectionHub } from "src/@modules/shared/connectionHub";

const companyUuid = "42c8158d-0132-4a5d-a2f6-10ae38ad5f17";
let repo: CriarPedidoRepository;

describe("Deve testar CriarPedidoUsecase", () => {
  beforeAll(async () => {
    await dataSource.initialize();
    const connectionHub = new ConnectionHub(dataSource);
    repo = new CriarPedidoRepository(connectionHub);
  });
  afterAll(async () => {
    await dataSource.query(`DELETE FROM eventos WHERE company_uuid = '${companyUuid}'`);
    await dataSource.query(`DELETE FROM evento_lotes WHERE company_uuid = '${companyUuid}'`);
    await dataSource.query(`DELETE FROM evento_lote_tipos_ingresso WHERE company_uuid = '${companyUuid}'`);
    await dataSource.query(`DELETE FROM evento_ingressos WHERE company_uuid = '${companyUuid}'`);
    await dataSource.destroy();
  });

  test("Deve gerar ingressos conforme pedido", async () => {
    const eventoUuid = "e301a3c0-aaf4-42c5-86d0-d8800116b674";
    await dataSource.query(`INSERT INTO eventos (uuid, company_uuid, user_uuid, titulo, slug, data_inicio)
      VALUES ('${eventoUuid}', '${companyUuid}', '${companyUuid}', 'Evento Teste', 'evento-teste', now())`);

    const loteUuid = "e614d3d2-02b7-43cf-9a17-22794ee175cc";
    await dataSource.query(`INSERT INTO evento_lotes (uuid, company_uuid, evento_uuid, nome)
      VALUES ('${loteUuid}', '${companyUuid}', '${eventoUuid}', 'Lote Teste')`);

    const tipoIngressoUuidBase = "5ecdb8b-d83b-42f9-98f4-1b3af475b868";
    await dataSource.query(`INSERT INTO evento_lote_tipos_ingresso (uuid, company_uuid, evento_uuid, lote_uuid, nome)
      VALUES ('1${tipoIngressoUuidBase}', '${companyUuid}', '${eventoUuid}', '${loteUuid}', 'Ingresso Teste')`);

    const usecase = new CriarPedidoUsecase(repo);
    const input = {
      companyUuid,
      eventoUuid,
      pedido: [
        {
          tipoIngressoUuid: `1${tipoIngressoUuidBase}`,
          quantidade: 2,
        },
        {
          tipoIngressoUuid: `2${tipoIngressoUuidBase}`,
          quantidade: 4,
        },
        {
          tipoIngressoUuid: `3${tipoIngressoUuidBase}`,
          quantidade: 6,
        },
      ],
    };
    await usecase.execute(input);

    const ingressosModel = await dataSource.query(`SELECT * FROM evento_ingressos WHERE company_uuid = '${companyUuid}'`);
    expect(ingressosModel.length).toBe(12);
    const ingressosTipo1 = ingressosModel.filter((ingresso: any) => ingresso.tipo_ingresso_uuid == `1${tipoIngressoUuidBase}`);
    expect(ingressosTipo1.length).toBe(2);
    const ingressosTipo2 = ingressosModel.filter((ingresso: any) => ingresso.tipo_ingresso_uuid == `2${tipoIngressoUuidBase}`);
    expect(ingressosTipo2.length).toBe(4);
    const ingressosTipo3 = ingressosModel.filter((ingresso: any) => ingresso.tipo_ingresso_uuid == `3${tipoIngressoUuidBase}`);
    expect(ingressosTipo3.length).toBe(6);
  });
});
