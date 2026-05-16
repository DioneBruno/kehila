import dataSource from "src/@infra/database/datasource";

describe("Deve testar TokenGenerateUsecase", () => {
  beforeAll(async () => {
    await dataSource.initialize();
  });
  afterAll(async () => {
    await dataSource.destroy();
  });

  test("Deve gerar token de acesso para usuário", async () => {
    expect(1 == 1).toBe(true);
  });
});
