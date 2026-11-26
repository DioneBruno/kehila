import { criarClienteS3 } from "../connectionStorage.awsS3";

const base = { STORAGE_KEYID: "k", STORAGE_ACCESSKEY: "s", STORAGE_BUCKET: "b" };

describe("criarClienteS3", () => {
  it("sem STORAGE_BASE_URL usa a AWS na região informada", async () => {
    const cliente = criarClienteS3({ ...base, STORAGE_REGION: "sa-east-1" });
    expect(await cliente.config.region()).toBe("sa-east-1");
    expect(cliente.config.endpoint).toBeUndefined();
    expect(cliente.config.forcePathStyle).toBeFalsy();
  });

  it("com STORAGE_BASE_URL usa o endpoint compatível em path-style", async () => {
    const cliente = criarClienteS3({ ...base, STORAGE_REGION: "", STORAGE_BASE_URL: " https://s3.exemplo.com " });
    const endpoint = await cliente.config.endpoint!();
    expect(endpoint.hostname).toBe("s3.exemplo.com");
    expect(cliente.config.forcePathStyle).toBe(true);
    expect(await cliente.config.region()).toBe("auto");
  });
});
