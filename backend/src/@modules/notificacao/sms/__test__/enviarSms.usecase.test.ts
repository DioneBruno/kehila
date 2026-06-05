import dataSource from "src/@infra/database/datasource";
import { EnviarSmsUsecase } from "../enviarSms.usecase";
import { EnviarSmsRepository } from "../enviarSmsRepository";
import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";

let repo: EnviarSmsRepository;

describe("Deve testar EnviarSmsUsecase", () => {
  beforeAll(async () => {
    await dataSource.initialize();
    const connectionHub = new ConnectionHub({ database: dataSource });
    repo = new EnviarSmsRepository(connectionHub);
  });
  afterAll(async () => {
    await dataSource.destroy();
  });

  test("Deve envicar msngaem vonage", async () => {
    const usecase = new EnviarSmsUsecase(repo);
    const input = {
      gateway: "vonage",
      destinatario: "69984852834",
      mensagem: "Olá, esta é uma mensagem de teste.",
    };
    await usecase.execute(input);
  });
});
