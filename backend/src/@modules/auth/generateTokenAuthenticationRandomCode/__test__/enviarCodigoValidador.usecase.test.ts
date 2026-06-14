import dataSource from "src/@infra/database/datasource";

describe("Deve testar EnviarCodigoValidadorUsecase", () => {
  beforeAll(async () => {
    await dataSource.initialize();
  });

  beforeEach(async () => {});

  afterAll(async () => {
    await dataSource.destroy();
  });

  test("Deve enviar codigo validado", async () => {});
});
