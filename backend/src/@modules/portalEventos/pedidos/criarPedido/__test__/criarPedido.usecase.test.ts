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
  beforeEach(async () => {
    await dataSource.query(`DELETE FROM evento_pedidos WHERE company_uuid = '${companyUuid}'`);
    await dataSource.query(`DELETE FROM eventos WHERE company_uuid = '${companyUuid}'`);
    await dataSource.query(`DELETE FROM evento_lotes WHERE company_uuid = '${companyUuid}'`);
    await dataSource.query(`DELETE FROM evento_lote_tipos_ingresso WHERE company_uuid = '${companyUuid}'`);
    await dataSource.query(`DELETE FROM evento_ingressos WHERE company_uuid = '${companyUuid}'`);
  });
  afterAll(async () => {
    await dataSource.query(`DELETE FROM evento_pedidos WHERE company_uuid = '${companyUuid}'`);
    await dataSource.query(`DELETE FROM eventos WHERE company_uuid = '${companyUuid}'`);
    await dataSource.query(`DELETE FROM evento_lotes WHERE company_uuid = '${companyUuid}'`);
    await dataSource.query(`DELETE FROM evento_lote_tipos_ingresso WHERE company_uuid = '${companyUuid}'`);
    await dataSource.query(`DELETE FROM evento_ingressos WHERE company_uuid = '${companyUuid}'`);
    await dataSource.destroy();
  });

  test("Deve gerar pedido", async () => {
    const eventoUuid = "e301a3c0-aaf4-42c5-86d0-d8800116b674";
    await dataSource.query(`INSERT INTO eventos (uuid, company_uuid, user_uuid, titulo, slug, data_inicio)
      VALUES ('${eventoUuid}', '${companyUuid}', '${companyUuid}', 'Evento Teste', 'evento-teste', now())`);

    const loteUuid = "e614d3d2-02b7-43cf-9a17-22794ee175cc";
    await dataSource.query(`INSERT INTO evento_lotes (uuid, company_uuid, evento_uuid, nome)
      VALUES ('${loteUuid}', '${companyUuid}', '${eventoUuid}', 'Lote Teste')`);

    const tipoIngressoUuidBase = "5ecdb8b-d83b-42f9-98f4-1b3af475b868";
    const tiposIngressos = [
      {
        uuid: `1${tipoIngressoUuidBase}`,
        nome: "",
        preco: 12.45,
      },
      {
        uuid: `2${tipoIngressoUuidBase}`,
        nome: "",
        preco: 45.5,
      },
      {
        uuid: `3${tipoIngressoUuidBase}`,
        nome: "",
        preco: 123.45,
      },
    ];
    for (const tipoIngresso of tiposIngressos) {
      await dataSource.query(`INSERT INTO evento_lote_tipos_ingresso (uuid, company_uuid, evento_uuid, lote_uuid, nome, preco)
        VALUES ('${tipoIngresso.uuid}', '${companyUuid}', '${eventoUuid}', '${loteUuid}', '${tipoIngresso.nome}', ${tipoIngresso.preco})`);
    }

    const usecase = new CriarPedidoUsecase(repo);
    const input = {
      companyUuid,
      eventoUuid,
      userUuid: "218a2fe4-e343-4bde-8f4e-a32626d1ffde",
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

    const pedidoModel = await dataSource.query(`SELECT * FROM evento_pedidos WHERE company_uuid = '${companyUuid}'`);
    expect(pedidoModel.length).toBe(1);
    expect(pedidoModel[0].user_uuid).toBe("218a2fe4-e343-4bde-8f4e-a32626d1ffde");
    expect(pedidoModel[0].valor_bruto).toBe(947.6);
    expect(pedidoModel[0].valor_desconto).toBe(0);
    expect(pedidoModel[0].valor_liquido).toBe(947.6);
    expect(pedidoModel[0].status).toBe("pendente");
  });

  test("Deve gerar ingressos conforme pedido", async () => {
    const eventoUuid = "e301a3c0-aaf4-42c5-86d0-d8800116b674";
    await dataSource.query(`INSERT INTO eventos (uuid, company_uuid, user_uuid, titulo, slug, data_inicio)
      VALUES ('${eventoUuid}', '${companyUuid}', '${companyUuid}', 'Evento Teste', 'evento-teste', now())`);

    const loteUuid = "e614d3d2-02b7-43cf-9a17-22794ee175cc";
    await dataSource.query(`INSERT INTO evento_lotes (uuid, company_uuid, evento_uuid, nome)
      VALUES ('${loteUuid}', '${companyUuid}', '${eventoUuid}', 'Lote Teste')`);

    const tipoIngressoUuidBase = "5ecdb8b-d83b-42f9-98f4-1b3af475b868";
    const tiposIngressos = [
      {
        uuid: `1${tipoIngressoUuidBase}`,
        nome: "",
        preco: 12.45,
      },
      {
        uuid: `2${tipoIngressoUuidBase}`,
        nome: "",
        preco: 45.5,
      },
      {
        uuid: `3${tipoIngressoUuidBase}`,
        nome: "",
        preco: 123.45,
      },
    ];
    for (const tipoIngresso of tiposIngressos) {
      await dataSource.query(`INSERT INTO evento_lote_tipos_ingresso (uuid, company_uuid, evento_uuid, lote_uuid, nome, preco)
        VALUES ('${tipoIngresso.uuid}', '${companyUuid}', '${eventoUuid}', '${loteUuid}', '${tipoIngresso.nome}', ${tipoIngresso.preco})`);
    }

    const usecase = new CriarPedidoUsecase(repo);
    const input = {
      companyUuid,
      userUuid: "218a2fe4-e343-4bde-8f4e-a32626d1ffde",
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
