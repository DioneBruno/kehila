import dataSource from "src/@infra/database/datasource";

describe("Deve testar TokenGenerateUsecase", () => {
  beforeAll(async () => {
    await dataSource.initialize();
  });
  afterAll(async () => {
    await dataSource.destroy();
  });
});
